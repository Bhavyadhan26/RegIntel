import { useState } from 'react';
import { Search, Menu } from 'lucide-react';
import { FilterButton } from '../components/ui/FilterButton';
import { PublicationCard } from '../components/ui/PublicationCard';
import type { Publication } from '../components/ui/PublicationCard';
import Sidebar from '../components/layout/Sidebar';
import { Footer } from '../components/Footer';
import { cbicPublications } from '../lib/cbicData';

const PUBLICATIONS_DATA: Publication[] = cbicPublications;

const CATEGORIES = ['All', 'Notices', 'Circulars', 'Amendments', 'Tenders'];

const Publications = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const filteredData = PUBLICATIONS_DATA.filter((item) => {
    const matchCat = activeCategory === 'All' || item.type + 's' === activeCategory;
    const normalizedQuery = searchQuery.toLowerCase();
    const matchSearch =
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.description.toLowerCase().includes(normalizedQuery) ||
      item.authority.toLowerCase().includes(normalizedQuery);
    return matchCat && matchSearch;
  });

  return (
    <div className="flex min-h-screen bg-background font-sans relative overflow-x-hidden">
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col min-h-screen">
        <div className="p-8 flex-1">
          <div className="flex items-center gap-3 mb-7">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-white border border-gray-200 rounded-lg text-text-muted hover:text-text-main shadow-sm"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-text-main">Publications</h1>
          </div>

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

          <div className="flex gap-2.5 mb-7 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <FilterButton key={cat} label={cat} active={activeCategory === cat} onClick={() => setActiveCategory(cat)} />
            ))}
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