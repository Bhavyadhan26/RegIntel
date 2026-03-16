import { useState } from "react";
import {
  Calendar, Bell, ChevronRight,
  AlertCircle,
  FileText, Briefcase
} from "lucide-react";
import Sidebar from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Footer } from "../components/Footer";
import { useResponsiveSidebar } from "@/hooks/useResponsiveSidebar";


export const Dashboard = () => {
  const { isSidebarOpen, openSidebar, closeSidebar } = useResponsiveSidebar();
  const [searchQuery, setSearchQuery] = useState("");

  const deadlines = [
    { title: "GST Return Filing", date: "Jan 28, 2026", urgent: true },
    { title: "Annual Compliance Report", date: "Feb 1, 2026", urgent: true },
    { title: "Quarterly Audit Submission", date: "Feb 15, 2026", urgent: false },
  ];

  const filteredDeadlines = deadlines.filter((d) => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex font-sans relative overflow-x-hidden">

      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out`}>
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      </div>

      {/* Sidebar Overlay (Mobile only) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden" 
          onClick={closeSidebar}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? 'lg:ml-[260px]' : ''}`}>
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Header */}
          <Header 
            title="Dashboard" 
            subtitle="Welcome back, John. Here's what's happening today."
            onMenuClick={openSidebar}
            isSidebarOpen={isSidebarOpen}
            showSearch={true}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="hover:-translate-y-1 transition-all duration-300 hover:shadow-lg border-t-0 border-r-0 border-b-0 border-l-[6px] border-l-orange-500 rounded-xl overflow-hidden bg-white/70 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center shadow-sm">
                    <Bell className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="bg-orange-100/80 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">+2 new</span>
                </div>
                <div className="text-4xl font-black text-text-main tracking-tight">2</div>
                <div className="text-sm font-medium text-text-muted mt-1 uppercase tracking-wide">Unread Alerts</div>
              </CardContent>
            </Card>

            <Card className="hover:-translate-y-1 transition-all duration-300 hover:shadow-lg border-t-0 border-r-0 border-b-0 border-l-[6px] border-l-blue-500 rounded-xl overflow-hidden bg-white/70 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shadow-sm">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="bg-blue-100/80 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">+1 this week</span>
                </div>
                <div className="text-4xl font-black text-text-main tracking-tight">3</div>
                <div className="text-sm font-medium text-text-muted mt-1 uppercase tracking-wide">Number of Publications</div>
              </CardContent>
            </Card>

            <Card className="hover:-translate-y-1 transition-all duration-300 hover:shadow-lg border-t-0 border-r-0 border-b-0 border-l-[6px] border-l-purple-500 rounded-xl overflow-hidden md:col-span-1 bg-white/70 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center shadow-sm">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="bg-purple-100/80 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">+4 this month</span>
                </div>
                <div className="text-4xl font-black text-text-main tracking-tight">15</div>
                <div className="text-sm font-medium text-text-muted mt-1 uppercase tracking-wide">Deadlines</div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">Upcoming Deadlines</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary-hover h-auto py-1 px-2">
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-100">
                {filteredDeadlines.length > 0 ? (
                  filteredDeadlines.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 py-4 hover:bg-gray-50/50 transition-colors rounded-lg px-2 -mx-2"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-text-main">{item.title}</h3>
                        <p className="text-xs text-text-muted">{item.date}</p>
                      </div>
                      {item.urgent && (
                        <span className="flex items-center gap-1 bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-100">
                          <AlertCircle className="w-3 h-3" /> URGENT
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-text-muted text-sm">
                    No deadlines found matching your criteria.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </main>
    </div>
  );
};