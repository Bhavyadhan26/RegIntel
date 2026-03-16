import Sidebar from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { Calendar, AlertCircle, Clock, CheckCircle2, Search, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Footer } from '../components/Footer';
import { apiGetDeadlines } from '@/lib/api';
import { FadeIn } from "@/components/ui/FadeIn";
import { useResponsiveSidebar } from '@/hooks/useResponsiveSidebar';

interface DeadlineRow {
  id: string;
  title: string;
  category: string;
  bodyDate: string;
  dueDate: string;
  daysLeft: number;
  status: 'Urgent' | 'Upcoming' | 'Normal';
  url: string;
}

const Deadlines = () => {
  const { isSidebarOpen, openSidebar, closeSidebar } = useResponsiveSidebar();
  const [searchQuery, setSearchQuery] = useState('');
  const [deadlinesData, setDeadlinesData] = useState<DeadlineRow[]>([]);
  const [counts, setCounts] = useState({ urgent: 0, thisWeek: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadDeadlines = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const response = await apiGetDeadlines();
        if (cancelled) return;

        const mapped: DeadlineRow[] = response.results.map((item) => ({
          id: item.id,
          title: item.title,
          category: item.category,
          bodyDate: item.body_date,
          dueDate: item.due_date,
          daysLeft: item.days_left,
          status: item.status,
          url: item.url,
        }));

        setDeadlinesData(mapped);
        setCounts({
          urgent: response.counts.urgent,
          thisWeek: response.counts.this_week,
          total: response.counts.total,
        });
      } catch {
        if (cancelled) return;
        setDeadlinesData([]);
        setCounts({ urgent: 0, thisWeek: 0, total: 0 });
        setLoadError('Unable to load deadlines right now.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadDeadlines();
    return () => {
      cancelled = true;
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

          {isLoading && (
            <div className="mb-4 text-center text-text-muted text-sm">Loading deadlines...</div>
          )}

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
            {filteredData.length > 0 ? filteredData.map((item, index) => (
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
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Body Date</p>
                    <p className="mt-1 text-text-main">{item.bodyDate}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
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