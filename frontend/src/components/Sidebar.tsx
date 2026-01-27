import { LayoutDashboard, Bell, FileText, Calendar, MessageSquare, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { name: 'Alerts', icon: <Bell size={20} />, path: '/alerts' },
    { name: 'Publications', icon: <FileText size={20} />, path: '/publications' },
    { name: 'Deadlines', icon: <Calendar size={20} />, path: '/deadlines' },
    { name: 'Feedback', icon: <MessageSquare size={20} />, path: '/feedback' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col fixed left-0 top-0">
      {/* Logo Section */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white font-bold">
          R
        </div>
        <span className="text-xl font-bold text-slate-800">RegIntel</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-gray-100">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium">
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;