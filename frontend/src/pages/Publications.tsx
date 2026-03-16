import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { FilterButton } from '../components/ui/FilterButton';
import { PublicationCard } from '../components/ui/PublicationCard';
import type { Publication } from '../components/ui/PublicationCard';
import Sidebar from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/Footer';
import { cbicPublications } from '../lib/cbicData';
import { useResponsiveSidebar } from '@/hooks/useResponsiveSidebar';

const PUBLICATIONS_DATA: Publication[] = cbicPublications;

const CATEGORIES = ['All', 'Notices', 'Updates',  'Tenders'];

const WEBSITE_FILTERS = [
  { label: 'All Websites', domains: [] },
  { label: 'ICAI', domains: ['icai.org'] },
  { label: 'Bar Council of India', domains: ['barcouncilofindia.org'] },
  { label: 'ICMAI', domains: ['icmai.in'] },
  { label: 'RBI', domains: ['rbi.org.in'] },
  { label: 'CBIC', domains: ['cbic.gov.in'] },
];

const Publications = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWebsite, setActiveWebsite] = useState('All Websites');
  const { isSidebarOpen, openSidebar, closeSidebar } = useResponsiveSidebar();

  const filteredData = PUBLICATIONS_DATA.filter((item) => {
    const matchCat = activeCategory === 'All' || item.type + 's' === activeCategory;
    const selectedWebsite = WEBSITE_FILTERS.find((site) => site.label === activeWebsite);
    const normalizedUrl = item.url.toLowerCase();
    const matchWebsite =
      !selectedWebsite ||
      selectedWebsite.domains.length === 0 ||
      selectedWebsite.domains.some((domain) => normalizedUrl.includes(domain));
    const normalizedQuery = searchQuery.toLowerCase();
    const matchSearch =
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.description.toLowerCase().includes(normalizedQuery) ||
      item.authority.toLowerCase().includes(normalizedQuery);
    return matchCat && matchWebsite && matchSearch;
  });

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
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? 'lg:ml-[260px]' : ''}`}>
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredData.map((pub) => (
              <PublicationCard key={pub.id} data={pub} />
            ))}
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-20 text-text-muted text-sm">No publications found.</div>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default Publications;