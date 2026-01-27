import { useState } from 'react';
import { Search } from 'lucide-react';
import { FilterButton } from '../components/ui/FilterButton';
import { PublicationCard } from '../components/ui/PublicationCard';
import type { Publication } from '../components/ui/PublicationCard';
import Sidebar from '../components/Sidebar';

// 1. Mock Data (Replace with API call later)
const MOCK_DATA: Publication[] = [
  {
    id: '1',
    title: 'Guidelines for Foreign Investment in Insurance Sector',
    authority: 'Insurance Regulatory and Development Authority',
    description: 'New guidelines allowing up to 74% FDI in insurance companies with specific compliance requirements.',
    date: 'Jan 24, 2024',
    type: 'Circular'
  },
  {
    id: '2',
    title: 'Amendments to Prevention of Money Laundering Act',
    authority: 'Ministry of Finance',
    description: 'Key amendments to PMLA regarding beneficial ownership and reporting requirements.',
    date: 'Jan 23, 2024',
    type: 'Amendment'
  },
  {
    id: '3',
    title: 'Public Notice on E-Invoice Threshold Reduction',
    authority: 'Central Board of Indirect Taxes',
    description: 'E-invoicing mandatory for businesses with turnover exceeding Rs 5 crore from April 1, 2024.',
    date: 'Jan 22, 2024',
    type: 'Notice'
  },
  {
    id: '4',
    title: 'Tender for Regulatory Technology Platform',
    authority: 'Securities and Exchange Board of India',
    description: 'Invitation for bids to develop a comprehensive regulatory technology platform for market surveillance.',
    date: 'Jan 21, 2024',
    type: 'Tender'
  }
];

const CATEGORIES = ['All', 'Notices', 'Circulars', 'Amendments', 'Tenders'];

const Publications = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // 2. Filter Logic
  const filteredData = MOCK_DATA.filter(item => {
    // Check Category
    const matchesCategory = activeCategory === 'All' || item.type + 's' === activeCategory;
    // Check Search Text (Case insensitive)
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 px-4 py-8">
        
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Publications</h1>

        {/* Search Bar (Updated style to match image) */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search publications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {CATEGORIES.map(cat => (
            <FilterButton
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
            />
          ))}
        </div>

        {/* Grid of Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredData.map(pub => (
            <PublicationCard key={pub.id} data={pub} />
          ))}
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            No publications found matching your criteria.
          </div>
        )}
      </main>
    </div>
  );
};

export default Publications;