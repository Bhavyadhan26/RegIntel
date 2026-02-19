import Sidebar from '../components/Sidebar';
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
    s === 'Urgent' ? 'bg-accent-rose/15 text-accent-rose' :
      s === 'Upcoming' ? 'bg-accent-amber/15 text-accent-amber' : 'bg-accent-teal/15 text-accent-teal';

  const statusIcon = (s: string) =>
    s === 'Urgent' ? <AlertCircle size={12} /> :
      s === 'Upcoming' ? <Clock size={12} /> : <CheckCircle2 size={12} />;

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar />
      <main className="flex-1 ml-[240px] p-8">
        <h1 className="text-2xl font-semibold text-white mb-7">Upcoming Deadlines</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
          <div className="bg-dark-800/60 backdrop-blur-sm p-6 rounded-xl border border-dark-600/40 flex justify-between items-center">
            <span className="text-sm text-gray-500">Urgent</span>
            <span className="text-3xl font-bold text-accent-rose">1</span>
          </div>
          <div className="bg-dark-800/60 backdrop-blur-sm p-6 rounded-xl border border-dark-600/40 flex justify-between items-center">
            <span className="text-sm text-gray-500">This Week</span>
            <span className="text-3xl font-bold text-accent-amber">2</span>
          </div>
          <div className="bg-dark-800/60 backdrop-blur-sm p-6 rounded-xl border border-dark-600/40 flex justify-between items-center">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-3xl font-bold text-accent-purple">6</span>
          </div>
        </div>

        <div className="bg-dark-800/60 backdrop-blur-sm border border-dark-600/40 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 bg-dark-700/50 px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-600/30">
            <div className="col-span-4">Title</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Body Date</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-center">Action</div>
          </div>
          <div className="divide-y divide-dark-600/30">
            {DEADLINES_DATA.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-dark-700/20 transition-colors">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent-amber/10 flex items-center justify-center shrink-0">
                    <Calendar size={16} className="text-accent-amber" />
                  </div>
                  <span className="text-sm font-medium text-gray-200">{item.title}</span>
                </div>
                <div className="col-span-2 text-sm text-gray-500">{item.category}</div>
                <div className="col-span-2 text-sm text-gray-500">{item.bodyDate}</div>
                <div className="col-span-2">
                  <div className="text-sm font-medium text-gray-200">{item.dueDate}</div>
                  <div className="text-xs text-gray-600">{item.daysLeft} days left</div>
                </div>
                <div className="col-span-1 flex justify-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle(item.status)}`}>
                    {statusIcon(item.status)} {item.status}
                  </span>
                </div>
                <div className="col-span-1 flex justify-center">
                  <button className="text-sm font-medium text-accent-purple hover:text-accent-purple/80 flex items-center gap-1">
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