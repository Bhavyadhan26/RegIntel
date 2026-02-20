import Sidebar from '../components/layout/Sidebar';
import { Calendar, ExternalLink, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

interface Deadline {
  id: string; title: string; category: string;
  bodyDate: string; dueDate: string; daysLeft: number;
  status: 'Urgent' | 'Upcoming' | 'Normal';
}

const DEADLINES_DATA: Deadline[] = [
  { id: '1', title: 'GST Monthly Return (GSTR-3B)', category: 'GST Compliance', bodyDate: 'Jan 20, 2024', dueDate: 'Jan 28, 2024', daysLeft: 4, status: 'Urgent' },
  { id: '2', title: 'TDS Payment for Q3', category: 'Income Tax', bodyDate: 'Jan 15, 2024', dueDate: 'Jan 31, 2024', daysLeft: 7, status: 'Upcoming' },
  { id: '3', title: 'Annual Compliance Certificate', category: 'Corporate Law', bodyDate: 'Jan 10, 2024', dueDate: 'Feb 15, 2024', daysLeft: 22, status: 'Normal' },
  { id: '4', title: 'Advance Tax Installment', category: 'Income Tax', bodyDate: 'Jan 5, 2024', dueDate: 'Feb 28, 2024', daysLeft: 35, status: 'Normal' },
  { id: '5', title: 'SEBI Annual Disclosure', category: 'Securities Law', bodyDate: 'Jan 1, 2024', dueDate: 'Mar 31, 2024', daysLeft: 67, status: 'Normal' },
  { id: '6', title: 'PF Monthly Contribution', category: 'Labour Law', bodyDate: 'Jan 20, 2024', dueDate: 'Feb 15, 2024', daysLeft: 22, status: 'Upcoming' },
];

const Deadlines = () => {
  const statusStyle = (s: string) =>
    s === 'Urgent' ? 'bg-red-50 text-red-600 border-red-100' :
      s === 'Upcoming' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100';

  const statusIcon = (s: string) =>
    s === 'Urgent' ? <AlertCircle size={12} /> :
      s === 'Upcoming' ? <Clock size={12} /> : <CheckCircle2 size={12} />;

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-2xl font-bold text-text-main mb-7">Upcoming Deadlines</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
            <span className="text-sm text-text-muted">Urgent</span>
            <span className="text-3xl font-bold text-red-500">1</span>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
            <span className="text-sm text-text-muted">This Week</span>
            <span className="text-3xl font-bold text-amber-500">2</span>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
            <span className="text-sm text-text-muted">Total</span>
            <span className="text-3xl font-bold text-primary">6</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 gap-4 bg-gray-50/50 px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-gray-200">
            <div className="col-span-4">Title</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Body Date</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-center">Action</div>
          </div>
          <div className="divide-y divide-gray-100">
            {DEADLINES_DATA.map((item) => (
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
                  <button className="text-sm font-medium text-primary hover:text-primary-hover flex items-center gap-1">
                    View <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Deadlines;