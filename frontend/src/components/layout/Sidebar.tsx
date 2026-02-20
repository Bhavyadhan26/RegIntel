import { LayoutDashboard, Bell, FileText, Calendar, HelpCircle, ArrowLeft, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const Sidebar = () => {
    const location = useLocation();

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { name: 'Alerts', icon: <Bell size={20} />, path: '/alerts', badge: 12 },
        { name: 'Publications', icon: <FileText size={20} />, path: '/publications' },
        { name: 'Deadlines', icon: <Calendar size={20} />, path: '/deadlines' },
        { name: 'Feedback', icon: <HelpCircle size={20} />, path: '/feedback' },
    ];

    return (
        <div className="w-[260px] bg-light-100 border-r border-border min-h-screen flex flex-col fixed left-0 top-0 z-30">
            {/* Logo */}
            <div className="px-6 h-[72px] flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                    {/* Placeholder logo icon if no image */}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <span className="text-xl font-bold text-text-main tracking-tight">RegIntel</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-6 space-y-1">
                {menuItems.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md text-[15px] font-medium transition-colors mb-1",
                                active
                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                    : "text-text-muted hover:text-text-main hover:bg-gray-100"
                            )}
                        >
                            {item.icon}
                            {item.name}
                            {item.badge && (
                                <span className={`ml-auto flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${active ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="px-4 pb-8 pt-4 space-y-1 mt-auto border-t border-border">
                <Link
                    to="/"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-[15px] font-medium text-text-muted hover:text-text-main hover:bg-secondary/50 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Home
                </Link>
                <Link
                    to="/login"
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
