import { LayoutDashboard, Bell, FileText, Calendar, MessageSquare, LogOut, Home, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// Added isOpen and onClose props to allow parent control
const Sidebar = ({ onClose }: { isOpen: boolean; onClose: () => void }) => {
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
    <div className="w-[260px] bg-dark-900 border-r border-dark-700/50 h-full flex flex-col relative">
      {/* Close Button for Mobile */}
      <button 
        onClick={onClose}
        className="lg:hidden absolute right-4 top-6 text-gray-400 hover:text-white"
      >
        <X size={24} />
      </button>

      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-2.5">
        <div className="w-9 h-9 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-bold">R</div>
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
              onClick={() => { if(window.innerWidth < 1024) onClose(); }} // Close sidebar on mobile after clicking
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[15px] font-medium transition-all ${
                active
                  ? 'bg-dark-700 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-dark-800'
              }`}
            >
              {item.icon}
              {item.name}
              {active && <span className="ml-auto w-1.5 h-1.5 bg-primary rounded-full" />}
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