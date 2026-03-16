import { useState } from "react";
import { Filter, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Sidebar from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/Footer";
import { cbicAlerts } from "../lib/cbicData";
import { useResponsiveSidebar } from "@/hooks/useResponsiveSidebar";

export const Alerts = () => {
  const [activeTab, setActiveTab] = useState<"new" | "old">("new");
  const { isSidebarOpen, openSidebar, closeSidebar } = useResponsiveSidebar();
  const [filterType, setFilterType] = useState<"all" | "critical" | "high" | "medium">("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);



  const alertsData = cbicAlerts.filter((item) => (activeTab === "new" ? item.isNew : !item.isNew));

  const severityColor = (type: string) =>
    type === "critical" ? "bg-red-500" : type === "high" ? "bg-amber-500" : "bg-blue-500";

  const getFilteredAlerts = () => {
    let filtered = alertsData;
    // Arbitrary split: IDs 1 & 2 are new, 3 & 4 are old. Or normally this is done by a read status.
    filtered = filtered.filter(a => Number(a.id) <= 2 ? activeTab === "new" : activeTab === "old");
    
    if (filterType !== "all") {
      filtered = filtered.filter(a => a.type === filterType);
    }
    return filtered;
  };

  const filteredAlerts = getFilteredAlerts();

  const newCount = alertsData.filter(a => Number(a.id) <= 2).length;
  const oldCount = alertsData.filter(a => Number(a.id) > 2).length;

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
          <Header title="Alerts" onMenuClick={openSidebar} isSidebarOpen={isSidebarOpen} />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-7">
            <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
              {(["new", "old"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab
                    ? "bg-white text-text-main shadow-sm"
                    : "text-text-muted hover:text-text-main"
                    }`}
                >
                  {tab === "new" ? "New" : "Old"}
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${activeTab === tab ? "bg-primary/10 text-primary" : "bg-gray-200 text-gray-600"
                    }`}>
                    {tab === "new" ? newCount : oldCount}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-text-main text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Filter className="w-4 h-4" /> 
                {filterType === "all" ? "Filter" : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-lg shadow-black/5 z-20 py-1 overflow-hidden">
                  {(["all", "critical", "high", "medium"] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setFilterType(type);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        filterType === type ? "bg-primary/5 text-primary font-medium" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {type === "all" ? "All Severities" : type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert, idx) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all relative"
              >
                <div className={`absolute left-0 top-5 bottom-5 w-[3px] rounded-full ${severityColor(alert.type)}`} />
                <div className="pl-5">
                  <div className="mb-1.5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-base font-bold text-text-main">{alert.title}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 sm:ml-3 ${alert.tagColor}`}>
                      {alert.tag}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted mb-2 font-medium">{alert.authority}</p>
                  <p className="text-sm text-text-muted leading-relaxed mb-3">{alert.desc}</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-gray-500">{alert.date}</span>
                    <a
                      href={alert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
                    >
                      Read More <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))
            ) : (
              <div className="py-12 text-center text-text-muted text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No alerts found matching your criteria.
              </div>
            )}
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
};
