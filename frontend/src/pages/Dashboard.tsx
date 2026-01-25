import { 
  LayoutDashboard, Bell, FileText, Calendar, 
  MessageSquare, LogOut, ChevronRight, 
  AlertCircle, CheckCircle2, TrendingUp
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

export const Dashboard = () => {
  const location = useLocation();
  
  // This helper function checks if the link is the current active page
  const isActive = (path: string) => location.pathname === path;

  // Mock Data for Deadlines
  const deadlines = [
    { title: "GST Return Filing", date: "Jan 28, 2026", urgent: true },
    { title: "Annual Compliance Report", date: "Feb 1, 2026", urgent: true },
    { title: "Quarterly Audit Submission", date: "Feb 15, 2026", urgent: false },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col fixed h-full z-10">
        
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
            R
          </div>
          <span className="text-xl font-extrabold text-gray-900">RegIntel</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {/* We now use the isActive function to determine if the tab is orange or gray */}
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" active={isActive('/dashboard')} />
          <NavItem to="/alerts" icon={Bell} label="Alerts" active={isActive('/alerts')} />
          <NavItem to="/publications" icon={FileText} label="Publications" active={isActive('/publications')} />
          <NavItem to="/deadlines" icon={Calendar} label="Deadlines" active={isActive('/deadlines')} />
          <NavItem to="/feedback" icon={MessageSquare} label="Feedback" active={isActive('/feedback')} />
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-50">
          <Link to="/login" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </Link>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 md:ml-64 p-4 sm:p-8">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-500 shadow-sm relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
              JD
            </div>
          </div>
        </header>

        {/* --- SECTION 1: UPCOMING DEADLINES --- */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Deadlines</h2>
            <Link to="/deadlines" className="text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {deadlines.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group flex items-center justify-between p-5 bg-gray-50 hover:bg-orange-50/50 border border-gray-100 hover:border-orange-100 rounded-2xl transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center text-gray-600 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.date}</p>
                  </div>
                </div>
                {item.urgent && (
                  <div className="w-8 h-8 flex items-center justify-center text-orange-500 bg-white rounded-full shadow-sm">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* --- SECTION 2: COMPLIANCE OVERVIEW --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                <Bell className="w-5 h-5" />
              </div>
              <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-xs font-bold">+5 new</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">12</div>
              <div className="text-sm text-gray-500">Unread Alerts</div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="bg-green-50 text-green-600 px-2 py-1 rounded-lg text-xs font-bold">Good</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">98%</div>
              <div className="text-sm text-gray-500">Compliance Score</div>
            </div>
          </div>

           {/* Card 3 - Link to Analytics */}
           <Link to="/alerts" className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl shadow-lg flex flex-col justify-between h-40 hover:scale-[1.02] transition-transform cursor-pointer group">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                <ChevronRight className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">View Analytics</div>
              <div className="text-sm text-gray-400">Detailed reports</div>
            </div>
          </Link>

        </div>
      </main>
    </div>
  );
};

// Helper Component for Sidebar Items
const NavItem = ({ to, icon: Icon, label, active = false }: any) => (
  <Link 
    to={to} 
    className={`
      flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200
      ${active 
        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" 
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }
    `}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </Link>
);