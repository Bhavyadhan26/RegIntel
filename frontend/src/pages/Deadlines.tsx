import Sidebar from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { Calendar, ExternalLink, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Footer } from '../components/Footer';
import { cbicDeadlines } from '../lib/cbicData';
import { useResponsiveSidebar } from '@/hooks/useResponsiveSidebar';

const Deadlines = () => {
  const { isSidebarOpen, openSidebar, closeSidebar } = useResponsiveSidebar();
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
          <Header title="Upcoming Deadlines" onMenuClick={openSidebar} isSidebarOpen={isSidebarOpen} />

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

          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
            <div className="grid grid-cols-12 gap-4 bg-gray-50/50 px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-gray-200">
              <div className="col-span-4">Title</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Body Date</div>
              <div className="col-span-2">Due Date</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-1 text-center">Action</div>
            </div>
            <div className="divide-y divide-gray-100">
              {cbicDeadlines.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                      <Calendar size={16} className="text-amber-600" />
                    </div>
                    <span className="text-sm font-medium text-text-main">{item.title}</span>
                  </div>
                  <div className="col-span-2 text-sm text-text-muted">{item.category}</div>
                  <div className="col-span-2 text-sm text-text-muted">{item.bodyDate}</div>
                  <div className="col-span-2">
                    <div className="text-sm font-medium text-text-main">{item.dueDate}</div>
                    <div className="text-xs text-text-muted">{item.daysLeft} days left</div>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusStyle(item.status)}`}>
                      {statusIcon(item.status)} {item.status}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:text-primary-hover flex items-center gap-1"
                    >
                      View <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 md:hidden">
            {cbicDeadlines.map((item) => (
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
                    <p className="mt-1 text-text-main">{item.dueDate}</p>
                    <p className="text-xs text-text-muted">{item.daysLeft} days left</p>
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
            ))}
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default Deadlines;