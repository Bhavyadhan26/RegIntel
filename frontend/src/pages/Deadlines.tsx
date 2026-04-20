import Sidebar from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { Calendar, AlertCircle, Clock, CheckCircle2, Search, ExternalLink, Filter, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Footer } from '../components/Footer';
import { apiGetDeadlines } from '@/lib/api';
import { FadeIn } from "@/components/ui/FadeIn";
import { useResponsiveSidebar } from '@/hooks/useResponsiveSidebar';
import { useAuth } from '@/context/AuthContext';

interface DeadlineRow {
  id: string;
  title: string;
  category: string;
  dueDate: string;
  daysLeft: number;
  status: 'Urgent' | 'Upcoming' | 'Normal';
  url: string;
}

const WEBSITE_FULL_NAME_BY_CODE: Record<string, string> = {
  all: 'All regulatory sources',
  ICAI: 'Institute of Chartered Accountants of India',
  BCI: 'Bar Council of India',
  ICMAI: 'Institute of Cost Accountants of India',
  RBI: 'Reserve Bank of India',
  CBIC: 'Central Board of Indirect Taxes and Customs',
};

const Deadlines = () => {
  const { isSidebarOpen, openSidebar, closeSidebar } = useResponsiveSidebar();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [deadlinesData, setDeadlinesData] = useState<DeadlineRow[]>([]);
  const [counts, setCounts] = useState({ urgent: 0, thisWeek: 0, total: 0 });
  const [websiteFilter, setWebsiteFilter] = useState('all');
  const [professionFilter, setProfessionFilter] = useState('all');
  const [isWebsiteDropdownOpen, setIsWebsiteDropdownOpen] = useState(false);
  const [websiteOptions, setWebsiteOptions] = useState<Array<{ code: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const professionInitRef = useRef(false);
  const websiteDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (professionInitRef.current) return;
    if (!user?.profession) return;
    setProfessionFilter(user.profession);
    professionInitRef.current = true;
  }, [user?.profession]);

  useEffect(() => {
    let cancelled = false;

    const loadDeadlines = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const response = await apiGetDeadlines({
          website: websiteFilter,
          profession: professionFilter,
        });
        if (cancelled) return;

        const mapped: DeadlineRow[] = response.results.map((item) => ({
          id: item.id,
          title: item.title,
          category: item.category,
          dueDate: item.due_date,
          daysLeft: item.days_left,
          status: item.status,
          url: item.url,
        }));

        const nextCounts = {
          urgent: response.counts.urgent,
          thisWeek: response.counts.this_week,
          total: response.counts.total,
        };

        setDeadlinesData(mapped);
        setCounts(nextCounts);
        setWebsiteOptions(response.filters.websites ?? []);
      } catch {
        if (cancelled) return;
        setDeadlinesData([]);
        setCounts({ urgent: 0, thisWeek: 0, total: 0 });
        setWebsiteOptions([]);
        setLoadError('Unable to load deadlines right now.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadDeadlines();
    return () => {
      cancelled = true;
    };
  }, [websiteFilter, professionFilter]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (websiteDropdownRef.current && !websiteDropdownRef.current.contains(target)) {
        setIsWebsiteDropdownOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsWebsiteDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const filteredData = deadlinesData.filter(item => {
    const normalizedQuery = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(normalizedQuery) ||
           item.category.toLowerCase().includes(normalizedQuery);
  });

  const statusStyle = (s: string) =>
    s === 'Urgent' ? 'bg-red-50 text-red-600 border-red-100' :
      s === 'Upcoming' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100';

  const statusIcon = (s: string) =>
    s === 'Urgent' ? <AlertCircle size={12} /> :
      s === 'Upcoming' ? <Clock size={12} /> : <CheckCircle2 size={12} />;

  const selectedWebsiteLabel =
    websiteFilter === 'all'
      ? 'All Websites'
      : websiteOptions.find((site) => site.code === websiteFilter)?.code ?? websiteFilter;

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
        <div className="flex-1 w-full max-w-full overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Header title="Upcoming Deadlines" onMenuClick={openSidebar} isSidebarOpen={isSidebarOpen} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
              <span className="text-sm text-text-muted">Urgent</span>
              <span className="text-3xl font-bold text-red-500">{counts.urgent}</span>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
              <span className="text-sm text-text-muted">This Week</span>
              <span className="text-3xl font-bold text-amber-500">{counts.thisWeek}</span>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
              <span className="text-sm text-text-muted">Total</span>
              <span className="text-3xl font-bold text-primary">{counts.total}</span>
            </div>
          </div>

          {loadError && !isLoading && (
            <div className="mb-4 text-center text-red-600 text-sm">{loadError}</div>
          )}

          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search deadlines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-sm text-text-main placeholder:text-text-muted transition-all shadow-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="relative" ref={websiteDropdownRef}>
              <Filter className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-600 pointer-events-none" size={16} />
              <button
                type="button"
                aria-label="Filter deadlines by website"
                aria-haspopup="listbox"
                aria-expanded={isWebsiteDropdownOpen}
                onClick={() => setIsWebsiteDropdownOpen((prev) => !prev)}
                className="w-full h-10 rounded-lg border border-gray-200 bg-white pl-10 pr-10 text-left text-sm text-text-main shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
              >
                {selectedWebsiteLabel}
              </button>
              <ChevronDown
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none transition-transform ${isWebsiteDropdownOpen ? 'rotate-180' : ''}`}
                size={16}
              />

              {isWebsiteDropdownOpen && (
                <div
                  role="listbox"
                  aria-label="Website filter options"
                  className="absolute left-0 right-0 z-30 mt-2 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl"
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={websiteFilter === 'all'}
                    onClick={() => {
                      setWebsiteFilter('all');
                      setIsWebsiteDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 text-left text-sm transition-colors ${websiteFilter === 'all'
                      ? 'bg-primary text-white font-semibold'
                      : 'text-text-main hover:bg-gray-100'
                      }`}
                  >
                    All Websites
                  </button>
                  {websiteOptions.map((site) => {
                    const isSelected = websiteFilter === site.code;
                    const fullWebsiteName = WEBSITE_FULL_NAME_BY_CODE[site.code] ?? site.name;
                    return (
                      <button
                        key={site.code}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setWebsiteFilter(site.code);
                          setIsWebsiteDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2.5 text-left text-sm transition-colors ${isSelected
                          ? 'bg-primary text-white font-semibold'
                          : 'text-text-main hover:bg-gray-100'
                          }`}
                      >
                        <span className="block break-words leading-tight">{site.code}</span>
                        <span className={`mt-0.5 block text-[11px] font-normal leading-tight break-words ${isSelected ? 'text-white/90' : 'text-text-muted'}`}>
                          {fullWebsiteName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Profession filter temporarily hidden */}
          </div>

          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <div className="min-w-[680px] md:min-w-[760px]">
                <div className="grid grid-cols-12 gap-4 bg-gray-50/50 px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-gray-200">
                  <div className="col-span-5">Title</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-2">Due Date</div>
                  <div className="col-span-1 text-center">Status</div>
                  <div className="col-span-2 text-center">Action</div>
                </div>
                <div className="divide-y divide-gray-100">
                  {isLoading ? (
                    <div className="px-6 py-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 w-28 rounded bg-gray-200" />
                        <div className="h-4 w-full rounded bg-gray-200" />
                        <div className="h-4 w-5/6 rounded bg-gray-200" />
                        <div className="h-4 w-2/3 rounded bg-gray-200" />
                      </div>
                      <div className="mt-4 text-sm text-text-muted">Loading deadlines...</div>
                    </div>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((item, index) => (
                    <FadeIn key={item.id} delay={index * 0.05} direction="up" fullWidth>
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                      <div className="col-span-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                          <Calendar size={16} className="text-amber-600" />
                        </div>
                        <span className="text-sm font-medium text-text-main pr-2">{item.title}</span>
                      </div>
                      <div className="col-span-2 text-sm text-text-muted">{item.category}</div>
                      <div className="col-span-2">
                        {!item.dueDate || item.dueDate === 'N/A' || item.dueDate.toLowerCase() === 'not applicable' ? (
                          <div className="text-sm font-medium text-text-muted">-</div>
                        ) : (
                          <>
                            <div className="text-sm font-medium text-text-main">{item.dueDate}</div>
                            <div className="text-xs text-text-amber-600 font-medium">{item.daysLeft} days left</div>
                          </>
                        )}
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <span className={`inline-flex items-center justify-center gap-1 w-24 py-1 rounded-full text-xs font-semibold border ${statusStyle(item.status)}`}>
                          {statusIcon(item.status)} {item.status}
                        </span>
                      </div>
                      <div className="col-span-2 flex justify-center">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
                            >
                              View <ExternalLink size={12} />
                            </a>
                      </div>
                    </div>
                    </FadeIn>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-sm font-medium text-text-main">Relax, you are upto date.</h3>
                      <p className="text-sm text-text-muted mt-1">No active deadlines right now.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 md:hidden">
            {isLoading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 w-28 rounded bg-gray-200" />
                  <div className="h-4 w-full rounded bg-gray-200" />
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                </div>
                <div className="mt-4 text-sm text-text-muted">Loading deadlines...</div>
              </div>
            ) : filteredData.length > 0 ? filteredData.map((item, index) => (
              <FadeIn key={item.id} delay={index * 0.05} direction="up">
              <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-100 bg-amber-50">
                    <Calendar size={16} className="text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-text-main">{item.title}</h3>
                    <p className="mt-1 text-xs text-text-muted">{item.category}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusStyle(item.status)}`}>
                    {statusIcon(item.status)} {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2 rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Due Date</p>
                    {!item.dueDate || item.dueDate === 'N/A' || item.dueDate.toLowerCase() === 'not applicable' ? (
                      <p className="mt-1 text-text-muted">-</p>
                    ) : (
                      <>
                        <p className="mt-1 text-text-main">{item.dueDate}</p>
                        <p className="text-xs text-text-muted">{item.daysLeft} days left</p>
                      </>
                    )}
                  </div>
                </div>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
                >
                  View source <ExternalLink size={12} />
                </a>
              </div>
              </FadeIn>
            )) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
                <Calendar className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <h3 className="text-sm font-medium text-text-main">Relax, you are upto date.</h3>
                <p className="mt-1 text-sm text-text-muted">No active deadlines right now.</p>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default Deadlines;