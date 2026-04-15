import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { FilterButton } from '../components/ui/FilterButton';
import { PublicationCard } from '../components/ui/PublicationCard';
import type { Publication } from '../components/ui/PublicationCard';
import Sidebar from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/Footer';
import { apiGetPublications } from '../lib/api';
import { useResponsiveSidebar } from '@/hooks/useResponsiveSidebar';
import { FadeIn } from "@/components/ui/FadeIn";

const CATEGORIES = ['All', 'Notifications', 'Updates', 'Events', 'Tenders'] as const;
type Category = (typeof CATEGORIES)[number];

const WEBSITE_FILTERS = [
  { label: 'All Websites', domains: [], code: 'all' },
  { label: 'ICAI', domains: ['icai.org'], code: 'ICAI' },
  { label: 'Bar Council of India', domains: ['barcouncilofindia.org'], code: 'BCI' },
  { label: 'ICMAI', domains: ['icmai.in'], code: 'ICMAI' },
  { label: 'RBI', domains: ['rbi.org.in'], code: 'RBI' },
  { label: 'CBIC', domains: ['cbic.gov.in'], code: 'CBIC' },
];

const PAGE_SIZE = 10;
const PUBLICATIONS_CACHE_TTL_MS = 5 * 60 * 1000;
const PUBLICATIONS_CACHE_KEY = "publications_cache_v2";

const WEBSITE_LABEL_BY_CODE: Record<string, string> = {
  ICAI: 'ICAI',
  BCI: 'Bar Council of India',
  ICMAI: 'ICMAI',
  RBI: 'RBI',
  CBIC: 'CBIC',
};

type PublicationsCacheEntry = {
  rows: Publication[];
  page: number;
  hasMore: boolean;
  cachedAt: number;
};

const getPublicationsCache = (): Map<string, PublicationsCacheEntry> => {
  try {
    const cached = sessionStorage.getItem(PUBLICATIONS_CACHE_KEY);
    if (!cached) return new Map();
    const obj = JSON.parse(cached);
    return new Map(Object.entries(obj) as [string, PublicationsCacheEntry][]);
  } catch {
    return new Map();
  }
};

const setPublicationsCache = (cache: Map<string, PublicationsCacheEntry>): void => {
  try {
    const obj = Object.fromEntries(cache);
    sessionStorage.setItem(PUBLICATIONS_CACHE_KEY, JSON.stringify(obj));
  } catch {
    // Ignore storage errors
  }
};

const EMPTY_MESSAGE_BY_CATEGORY: Record<Category, string> = {
  All: 'No publications found',
  Notifications: 'No Notifications found',
  Updates: 'No Updates found',
  Events: 'No Events found',
  Tenders: 'No tenders found',
};

const LOADING_MESSAGE_BY_CATEGORY: Record<Category, string> = {
  All: 'Loading publications...',
  Notifications: 'Loading notifications...',
  Updates: 'Loading updates...',
  Events: 'Loading events...',
  Tenders: 'Loading tenders...',
};

const LOADING_MORE_MESSAGE_BY_CATEGORY: Record<Category, string> = {
  All: 'Loading more publications...',
  Notifications: 'Loading more notifications...',
  Updates: 'Loading more updates...',
  Events: 'Loading more events...',
  Tenders: 'Loading more tenders...',
};

const matchesCategory = (rawCategory: string, category: Category): boolean => {
  const normalized = (rawCategory || '').trim().toLowerCase();
  if (category === 'All') return true;
  if (category === 'Notifications') return normalized.includes('notification') || normalized.includes('notice');
  if (category === 'Updates') {
    return normalized.includes('update') || normalized.includes('circular') || normalized.includes('amend');
  }
  if (category === 'Events') return normalized.includes('event');
  if (category === 'Tenders') return normalized.includes('tender');
  return true;
};

const Publications = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWebsite, setActiveWebsite] = useState('All Websites');
  const [publications, setPublications] = useState<Publication[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');
  const { isSidebarOpen, openSidebar, closeSidebar } = useResponsiveSidebar();

  const requestIdRef = useRef(0);

  const selectedWebsiteCode = useMemo(() => {
    const selectedWebsite = WEBSITE_FILTERS.find((site) => site.label === activeWebsite);
    return selectedWebsite?.code ?? 'all';
  }, [activeWebsite]);

  const cacheKey = useMemo(() => {
    return [activeCategory, selectedWebsiteCode, searchQuery.trim().toLowerCase()].join('::');
  }, [activeCategory, searchQuery, selectedWebsiteCode]);

  const mapAuthority = (websiteName: string) => {
    const code = (websiteName || '').toUpperCase();
    return WEBSITE_LABEL_BY_CODE[code] ?? websiteName;
  };

  const formatCreatedAtDate = (createdAt: string) => {
    if (!createdAt) return '';
    const parsed = new Date(createdAt);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const resolveCardDate = (noticeDate: string, createdAt: string) => {
    const normalizedNotice = (noticeDate || '').trim();
    const missingNoticeValues = new Set(['', 'N/A', 'NA', '-', 'NOT APPLICABLE']);
    if (!missingNoticeValues.has(normalizedNotice.toUpperCase())) {
      return normalizedNotice;
    }
    return formatCreatedAtDate(createdAt) || normalizedNotice;
  };

  const loadPublications = useCallback(
    async (targetPage: number, replace: boolean) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (replace) {
        const publicationsPageCache = getPublicationsCache();
        const cached = publicationsPageCache.get(cacheKey);
        const cacheIsFresh = cached && Date.now() - cached.cachedAt < PUBLICATIONS_CACHE_TTL_MS;
        if (cacheIsFresh && cached) {
          setPublications(cached.rows.filter((item) => matchesCategory(item.type || '', activeCategory)));
          setPage(cached.page);
          setHasMore(cached.hasMore);
          setIsInitialLoading(false);
          setIsLoadingMore(false);
          setLoadError('');
          return;
        }
      }

      if (replace) {
        setIsInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      setLoadError('');

      try {
        const response = await apiGetPublications({
          page: targetPage,
          page_size: PAGE_SIZE,
          category: activeCategory,
          website: selectedWebsiteCode,
          search: searchQuery,
        });

        if (requestIdRef.current !== requestId) return;

        const mappedRows: Publication[] = response.results
          .filter((item) => matchesCategory(item.category || item.type || '', activeCategory))
          .map((item) => ({
            id: item.id,
            title: item.title,
            authority: mapAuthority(item.website_name || item.authority),
            description: item.summary || '',
            date: resolveCardDate(item.notice_date, item.created_at),
            type: item.type,
            url: item.url,
          }));

        setPublications((prev) => {
          const nextRows = replace ? mappedRows : [...prev, ...mappedRows];
          const publicationsPageCache = getPublicationsCache();
          publicationsPageCache.set(cacheKey, {
            rows: nextRows,
            page: targetPage,
            hasMore: response.has_more,
            cachedAt: Date.now(),
          });
          setPublicationsCache(publicationsPageCache);
          return nextRows;
        });
        setPage(targetPage);
        setHasMore(response.has_more);
      } catch (error) {
        if (requestIdRef.current !== requestId) return;
        setLoadError('Unable to load publications right now. Please try again.');
      } finally {
        if (requestIdRef.current === requestId) {
          setIsInitialLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [activeCategory, cacheKey, searchQuery, selectedWebsiteCode],
  );

  useEffect(() => {
    setPublications([]);
    setHasMore(true);
    setPage(1);
    void loadPublications(1, true);
  }, [activeCategory, selectedWebsiteCode, searchQuery, loadPublications]);

  useEffect(() => {
    const handleScroll = () => {
      if (isInitialLoading || isLoadingMore || !hasMore) return;

      const threshold = 240;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - threshold;

      if (atBottom) {
        void loadPublications(page + 1, false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isInitialLoading, isLoadingMore, loadPublications, page]);

  const visiblePublications = publications;

  return (
    <div className="flex min-h-screen bg-background font-sans relative overflow-x-hidden">
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      </div>

      {/* Sidebar Overlay (Mobile only) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? 'lg:ml-[260px]' : ''}`}>
        <div className="flex-1 w-full max-w-full overflow-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Header title="Publications" onMenuClick={openSidebar} isSidebarOpen={isSidebarOpen} />

          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search publications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-sm text-text-main placeholder:text-text-muted transition-all shadow-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>

          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <div className="flex w-full gap-2.5 overflow-x-auto pb-1 lg:w-auto lg:pb-0">
              {CATEGORIES.map((cat) => (
                <FilterButton key={cat} label={cat} active={activeCategory === cat} onClick={() => setActiveCategory(cat)} />
              ))}
            </div>

            <div className="w-full sm:w-64 lg:w-72 lg:ml-4 lg:shrink-0 relative">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                <select
                  value={activeWebsite}
                  onChange={(e) => setActiveWebsite(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 rounded-lg border border-dark-600/40 bg-dark-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-sm font-medium text-gray-400 hover:bg-dark-700/60 transition-all"
                >
                  {WEBSITE_FILTERS.map((site) => (
                    <option key={site.label} value={site.label}>
                      {site.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {isInitialLoading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 w-40 rounded bg-gray-200" />
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-5/6 rounded bg-gray-200" />
                <div className="h-4 w-3/4 rounded bg-gray-200" />
              </div>
              <div className="mt-4 text-xs text-text-muted">{LOADING_MESSAGE_BY_CATEGORY[activeCategory]}</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {visiblePublications.map((pub, index) => (
                <FadeIn key={pub.id} delay={index * 0.05} direction="up">
                  <PublicationCard data={pub} />
                </FadeIn>
              ))}
            </div>
          )}

          {isLoadingMore && (
            <div className="text-center py-5 text-text-muted text-sm">{LOADING_MORE_MESSAGE_BY_CATEGORY[activeCategory]}</div>
          )}

          {loadError && (
            <div className="text-center py-5 text-red-500 text-sm">{loadError}</div>
          )}

          {!isInitialLoading && visiblePublications.length === 0 && !loadError && (
            <div className="text-center py-20 text-text-muted text-sm">{EMPTY_MESSAGE_BY_CATEGORY[activeCategory]}.</div>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default Publications;