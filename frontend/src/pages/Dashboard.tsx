import {
  Calendar, Bell, ChevronRight,
  AlertCircle, CheckCircle2, TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";

export const Dashboard = () => {
  const deadlines = [
    { title: "GST Return Filing", date: "Jan 28, 2026", urgent: true },
    { title: "Annual Compliance Report", date: "Feb 1, 2026", urgent: true },
    { title: "Quarterly Audit Submission", date: "Feb 15, 2026", urgent: false },
  ];

  return (
    <div className="min-h-screen bg-dark-950 flex font-sans">
      <Sidebar />

      <main className="flex-1 ml-[240px] p-8">
        {/* Header */}
        <header className="flex justify-between items-start mb-9">
          <div>
            <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
            <p className="text-[15px] text-gray-500 mt-1">Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 bg-dark-800 rounded-lg border border-dark-600/50 flex items-center justify-center text-gray-400 hover:border-dark-400 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent-rose rounded-full" />
            </button>
            <div className="w-10 h-10 bg-accent-purple rounded-lg flex items-center justify-center text-white font-semibold text-sm">
              JD
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-dark-800/60 backdrop-blur-sm rounded-xl p-6 border border-dark-600/40">
            <div className="flex justify-between items-start mb-4">
              <div className="w-11 h-11 bg-accent-rose/10 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-accent-rose" />
              </div>
              <span className="bg-accent-rose/10 text-accent-rose text-xs font-bold px-2.5 py-1 rounded-full">+5 new</span>
            </div>
            <div className="text-3xl font-bold text-white">12</div>
            <div className="text-[15px] text-gray-500 mt-1">Unread Alerts</div>
          </div>

          <div className="bg-dark-800/60 backdrop-blur-sm rounded-xl p-6 border border-dark-600/40">
            <div className="flex justify-between items-start mb-4">
              <div className="w-11 h-11 bg-accent-teal/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-accent-teal" />
              </div>
              <span className="bg-accent-teal/10 text-accent-teal text-xs font-bold px-2.5 py-1 rounded-full">Good</span>
            </div>
            <div className="text-3xl font-bold text-white">98%</div>
            <div className="text-[15px] text-gray-500 mt-1">Compliance Score</div>
          </div>

          <Link to="/alerts" className="bg-accent-purple/20 backdrop-blur-sm rounded-xl p-6 border border-accent-purple/30 group hover:bg-accent-purple/25 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-accent-purple/10 rounded-full blur-[30px]" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="w-11 h-11 bg-accent-purple/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-accent-purple" />
                </div>
                <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                  <ChevronRight className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-lg font-bold text-white">View Analytics</div>
              <div className="text-[15px] text-gray-400 mt-1">Detailed reports →</div>
            </div>
          </Link>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-dark-800/60 backdrop-blur-sm rounded-xl border border-dark-600/40">
          <div className="flex justify-between items-center px-6 py-5 border-b border-dark-600/30">
            <h2 className="text-base font-semibold text-white">Upcoming Deadlines</h2>
            <Link to="/deadlines" className="text-[15px] font-semibold text-accent-purple hover:text-accent-purple/80">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-dark-600/30">
            {deadlines.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-dark-700/30 transition-colors"
              >
                <div className="w-10 h-10 bg-accent-amber/10 rounded-lg flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-accent-amber" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-medium text-gray-200">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.date}</p>
                </div>
                {item.urgent && (
                  <span className="flex items-center gap-1 bg-accent-rose/10 text-accent-rose text-xs font-bold px-2.5 py-1 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5" /> Urgent
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
