import { Menu, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import React from "react";

export interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  isSidebarOpen: boolean;
  rightContent?: React.ReactNode;
}

export const Header = ({ 
  title, 
  subtitle, 
  onMenuClick, 
  isSidebarOpen,
  rightContent
}: HeaderProps) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div className="flex flex-col">
        <div className="flex items-center gap-4">
          {!isSidebarOpen && (
            <button 
              onClick={onMenuClick}
              className="p-2 bg-white border border-gray-200 rounded-lg text-text-muted hover:text-text-main shadow-sm shrink-0"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-text-main">{title}</h1>
        </div>
        {subtitle && (
          <p className={`text-sm text-text-muted mt-1 ${!isSidebarOpen ? 'ml-[56px]' : ''}`}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-4 self-end md:self-auto">
        {rightContent}
        <button className="w-10 h-10 bg-white rounded-full border border-gray-200 flex items-center justify-center text-text-muted hover:text-text-main hover:border-gray-300 transition-colors relative shadow-sm shrink-0">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <Link to="/profile" className="shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm border border-primary/20 hover:bg-primary/20 transition-colors shadow-sm">
          JD
        </Link>
      </div>
    </header>
  );
};
