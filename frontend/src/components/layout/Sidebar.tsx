import { LayoutDashboard, Bell, FileText, Calendar, HelpCircle, ArrowLeft, LogOut, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const location = useLocation();

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { name: 'Alerts', icon: <Bell size={20} />, path: '/alerts' },
        { name: 'Publications', icon: <FileText size={20} />, path: '/publications' },
        { name: 'Deadlines', icon: <Calendar size={20} />, path: '/deadlines' },
        { name: 'Feedback', icon: <HelpCircle size={20} />, path: '/feedback' },
    ];

    return (
        <div className="w-[260px] bg-light-100 border-r border-border h-full flex flex-col relative" aria-hidden={!isOpen}>
            {/* Logo and Menu Toggle */}
            <div className="px-5 h-[72px] flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                    <img src="/WEBLOGO.png" alt="RegIntel Logo" className="h-[2.75rem] w-auto" />
                    <span className="text-xl font-bold text-text-main tracking-tight">RegIntel</span>
                </div>
                
                <button
                    onClick={onClose}
                    className="p-2 bg-white border border-gray-200 rounded-lg text-text-muted hover:text-text-main shadow-sm shrink-0"
                    aria-label="Close sidebar"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-6 space-y-1">
                {menuItems.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            onClick={() => {
                                if (window.innerWidth < 1024) onClose();
                            }}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md text-[15px] font-medium transition-colors mb-1",
                                active
                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                    : "text-text-muted hover:text-text-main hover:bg-gray-100"
                            )}
                        >
                            {item.icon}
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="px-4 pb-8 pt-4 space-y-1 mt-auto border-t border-border">
                <Link
                    to="/"
                    onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-[15px] font-medium text-text-muted hover:text-text-main hover:bg-secondary/50 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Home
                </Link>
                <Link
                    to="/login"
                    onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-[15px] font-medium text-red-500 hover:bg-red-50 transition-colors text-left"
                >
                    <LogOut size={20} className="text-red-500" />
                    Logout
                </Link>
            </div>
        </div>
    );
};

export default Sidebar;
