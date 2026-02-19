import { LayoutDashboard, Bell, FileText, Calendar, MessageSquare, LogOut, Home } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userProfile');
    navigate('/');
  };

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
    { name: 'Alerts', icon: <Bell size={18} />, path: '/alerts' },
    { name: 'Publications', icon: <FileText size={18} />, path: '/publications' },
    { name: 'Deadlines', icon: <Calendar size={18} />, path: '/deadlines' },
    { name: 'Feedback', icon: <MessageSquare size={18} />, path: '/feedback' },
  ];

  return (
    <div className="w-[240px] bg-dark-900 border-r border-dark-700/50 min-h-screen flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-2.5">
        <img src="/logo.png" alt="RegIntel" className="w-9 h-9 rounded-lg" />
        <span className="text-base font-semibold text-white tracking-tight">RegIntel</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-2 space-y-0.5">
        {menuItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[15px] font-medium transition-all ${active
                  ? 'bg-dark-700 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-dark-800'
                }`}
            >
              {item.icon}
              {item.name}
              {active && <span className="ml-auto w-1.5 h-1.5 bg-accent-purple rounded-full" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 border-t border-dark-700/50 pt-3 space-y-0.5">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 px-3.5 py-2.5 w-full text-gray-500 hover:text-gray-300 hover:bg-dark-800 rounded-lg text-[15px] font-medium transition-all"
        >
          <Home size={18} /> Back to Home
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3.5 py-2.5 w-full text-gray-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg text-[15px] font-medium transition-all"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;