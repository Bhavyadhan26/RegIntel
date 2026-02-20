import { useState } from 'react';
import { Search } from 'lucide-react';
import { FilterButton } from '../components/ui/FilterButton';
import { PublicationCard } from '../components/ui/PublicationCard';
import type { Publication } from '../components/ui/PublicationCard';
import Sidebar from '../components/layout/Sidebar';

const MOCK_DATA: Publication[] = [
  { id: '1', title: 'Guidelines for Foreign Investment in Insurance Sector', authority: 'Insurance Regulatory and Development Authority', description: 'New guidelines allowing up to 74% FDI in insurance companies with specific compliance requirements.', date: 'Jan 24, 2024', type: 'Circular' },
  { id: '2', title: 'Amendments to Prevention of Money Laundering Act', authority: 'Ministry of Finance', description: 'Key amendments to PMLA regarding beneficial ownership and reporting requirements.', date: 'Jan 23, 2024', type: 'Amendment' },
  { id: '3', title: 'Public Notice on E-Invoice Threshold Reduction', authority: 'Central Board of Indirect Taxes', description: 'E-invoicing mandatory for businesses with turnover exceeding Rs 5 crore from April 1, 2024.', date: 'Jan 22, 2024', type: 'Notice' },
  { id: '4', title: 'Tender for Regulatory Technology Platform', authority: 'Securities and Exchange Board of India', description: 'Invitation for bids to develop a comprehensive regulatory technology platform for market surveillance.', date: 'Jan 21, 2024', type: 'Tender' },
];

const CATEGORIES = ['All', 'Notices', 'Circulars', 'Amendments', 'Tenders'];

const Publications = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = MOCK_DATA.filter((item) => {
    const matchCat = activeCategory === 'All' || item.type + 's' === activeCategory;
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-2xl font-bold text-text-main mb-7">Publications</h1>

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
      </main>
    </div>
  );
};

export default Publications;