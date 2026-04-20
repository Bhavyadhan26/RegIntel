import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import React from "react";
import { useAuth } from "@/context/AuthContext";

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
  const { user } = useAuth();

  const initials = (() => {
    const name = user?.full_name?.trim();
    if (name) {
      return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
    }
    const email = user?.email?.trim();
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "U";
  })();

  return (
    <header className="mb-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
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
            <h1 className="text-xl sm:text-2xl font-bold text-text-main leading-tight break-words">{title}</h1>
          </div>
          {subtitle && (
            <p className={`text-sm text-text-muted mt-1 ${!isSidebarOpen ? 'ml-[56px]' : ''}`}>
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 sm:gap-4">
          {rightContent}
          <Link to="/profile" className="shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm border border-primary/20 hover:bg-primary/20 transition-colors shadow-sm">
            {initials}
          </Link>
        </div>
      </div>
    </header>
  );
};
