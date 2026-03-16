import Sidebar from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { Calendar, AlertCircle, Clock, CheckCircle2, Search } from 'lucide-react';
import { useState } from 'react';
import { Footer } from '../components/Footer';
import { cbicDeadlines } from '../lib/cbicData';
import { FadeIn } from "@/components/ui/FadeIn";
import { Button } from "@/components/ui/Button";

const Deadlines = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = cbicDeadlines.filter(item => {
    const normalizedQuery = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(normalizedQuery) ||
           item.category.toLowerCase().includes(normalizedQuery);
  });

  const urgentCount = cbicDeadlines.filter((item) => item.status === 'Urgent').length;
  const weekCount = cbicDeadlines.filter((item) => item.daysLeft <= 7).length;
  const totalCount = cbicDeadlines.length;

  const statusStyle = (s: string) =>
    s === 'Urgent' ? 'bg-red-50 text-red-600 border-red-100' :
      s === 'Upcoming' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100';

  const statusIcon = (s: string) =>
    s === 'Urgent' ? <AlertCircle size={12} /> :
      s === 'Upcoming' ? <Clock size={12} /> : <CheckCircle2 size={12} />;

  return (
    <div className="flex min-h-screen bg-background font-sans relative overflow-x-hidden">
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Sidebar Overlay (Mobile only) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? 'lg:ml-[260px]' : ''}`}>
        <div className="p-4 sm:p-6 lg:p-8 flex-1 w-full max-w-full overflow-hidden">
          <Header title="Upcoming Deadlines" onMenuClick={() => setIsSidebarOpen(true)} isSidebarOpen={isSidebarOpen} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
              <span className="text-sm text-text-muted">Urgent</span>
              <span className="text-3xl font-bold text-red-500">{urgentCount}</span>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
              <span className="text-sm text-text-muted">This Week</span>
              <span className="text-3xl font-bold text-amber-500">{weekCount}</span>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
              <span className="text-sm text-text-muted">Total</span>
              <span className="text-3xl font-bold text-primary">{totalCount}</span>
            </div>
          </div>

          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search deadlines..."
              value={searchQuery} //added
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-sm text-text-main placeholder:text-text-muted transition-all shadow-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-12 gap-4 bg-gray-50/50 px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-gray-200">
                  <div className="col-span-4">Title</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-2">Body Date</div>
                  <div className="col-span-2">Due Date</div>
                  <div className="col-span-1 text-center">Status</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>
                <div className="divide-y divide-gray-100">
                  {filteredData.length > 0 ? (
                    filteredData.map((item, index) => (
                    <FadeIn key={item.id} delay={index * 0.05} direction="up" fullWidth>
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                          <Calendar size={16} className="text-amber-600" />
                        </div>
                        <span className="text-sm font-medium text-text-main pr-2">{item.title}</span>
                      </div>
                      <div className="col-span-2 text-sm text-text-muted">{item.category}</div>
                      <div className="col-span-2 text-sm text-text-muted">{item.bodyDate}</div>
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
                      <div className="col-span-1 flex justify-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => window.open(item.url, '_blank')}
                          className="text-primary hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          View
                        </Button>
                      </div>
                    </div>
                    </FadeIn>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-sm font-medium text-text-main">No deadlines found</h3>
                      <p className="text-sm text-text-muted mt-1">Try adjusting your search query.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default Deadlines;