import Sidebar from '../components/Sidebar';
import { Calendar, ExternalLink, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

// 1. Define the Data Structure
interface Deadline {
  id: string;
  title: string;
  category: string;
  bodyDate: string;
  dueDate: string;
  daysLeft: number;
  status: 'Urgent' | 'Upcoming' | 'Normal';
}

// 2. Mock Data (Matches your image exactly)
const DEADLINES_DATA: Deadline[] = [
  {
    id: '1',
    title: 'GST Monthly Return (GSTR-3B)',
    category: 'GST Compliance',
    bodyDate: 'Jan 20, 2024',
    dueDate: 'Jan 28, 2024',
    daysLeft: 4,
    status: 'Urgent'
  },
  {
    id: '2',
    title: 'TDS Payment for Q3',
    category: 'Income Tax',
    bodyDate: 'Jan 15, 2024',
    dueDate: 'Jan 31, 2024',
    daysLeft: 7,
    status: 'Upcoming'
  },
  {
    id: '3',
    title: 'Annual Compliance Certificate',
    category: 'Corporate Law',
    bodyDate: 'Jan 10, 2024',
    dueDate: 'Feb 15, 2024',
    daysLeft: 22,
    status: 'Normal'
  },
  {
    id: '4',
    title: 'Advance Tax Installment',
    category: 'Income Tax',
    bodyDate: 'Jan 5, 2024',
    dueDate: 'Feb 28, 2024',
    daysLeft: 35,
    status: 'Normal'
  },
  {
    id: '5',
    title: 'SEBI Annual Disclosure',
    category: 'Securities Law',
    bodyDate: 'Jan 1, 2024',
    dueDate: 'Mar 31, 2024',
    daysLeft: 67,
    status: 'Normal'
  },
  {
    id: '6',
    title: 'PF Monthly Contribution',
    category: 'Labour Law',
    bodyDate: 'Jan 20, 2024',
    dueDate: 'Feb 15, 2024',
    daysLeft: 22,
    status: 'Upcoming'
  }
];

const Deadlines = () => {
  // Helper to get status badge styles
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Urgent':
        return 'bg-red-100 text-red-600 border-red-200';
      case 'Upcoming':
        return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'Normal':
        return 'bg-green-100 text-green-600 border-green-200';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Helper to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Urgent': return <AlertCircle size={14} className="mr-1" />;
      case 'Upcoming': return <Clock size={14} className="mr-1" />;
      default: return <CheckCircle2 size={14} className="mr-1" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Upcoming Deadlines</h1>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
            <span className="text-slate-600 font-medium">Urgent</span>
            <span className="text-3xl font-bold text-red-500">1</span>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
            <span className="text-slate-600 font-medium">This Week</span>
            <span className="text-3xl font-bold text-orange-500">2</span>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
            <span className="text-slate-600 font-medium">Total</span>
            <span className="text-3xl font-bold text-blue-600">6</span>
          </div>
        </div>

        {/* Deadlines Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 bg-gray-100 p-4 border-b border-gray-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <div className="col-span-4 pl-2">Title</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Body Date</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-center">Action</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-100">
            {DEADLINES_DATA.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors">
                
                {/* Title Column */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 text-white">
                    <Calendar size={20} />
                  </div>
                  <span className="font-semibold text-slate-800 text-sm">{item.title}</span>
                </div>

                {/* Category */}
                <div className="col-span-2 text-sm text-slate-600 font-medium">
                  {item.category}
                </div>

                {/* Body Date */}
                <div className="col-span-2 text-sm text-slate-500">
                  {item.bodyDate}
                </div>

                {/* Due Date */}
                <div className="col-span-2">
                  <div className="text-sm font-bold text-slate-800">{item.dueDate}</div>
                  <div className="text-xs text-slate-500">{item.daysLeft} days left</div>
                </div>

                {/* Status Pill */}
                <div className="col-span-1 flex justify-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(item.status)}`}>
                    {getStatusIcon(item.status)}
                    {item.status}
                  </span>
                </div>

                {/* Action Link */}
                <div className="col-span-1 flex justify-center">
                  <button className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">
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