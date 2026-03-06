import { useState } from "react";
import { Filter, ChevronRight, Menu } from "lucide-react";
import { motion } from "framer-motion";
import Sidebar from "../components/layout/Sidebar";
import { Footer } from "../components/Footer";
import { cbicAlerts } from "../lib/cbicData";

export const Alerts = () => {
  const [activeTab, setActiveTab] = useState<"new" | "old">("new");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const newAlertsCount = cbicAlerts.filter((item) => item.isNew).length;
  const oldAlertsCount = cbicAlerts.length - newAlertsCount;
  const alertsData = cbicAlerts.filter((item) => (activeTab === "new" ? item.isNew : !item.isNew));

  const severityColor = (type: string) =>
    type === "critical" ? "bg-red-500" : type === "high" ? "bg-amber-500" : "bg-blue-500";

  return (
    <div className="min-h-screen bg-background flex font-sans relative overflow-x-hidden">
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out`}>
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col min-h-screen">
        <div className="p-8 flex-1">
          <div className="flex items-center gap-3 mb-7">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-white border border-gray-200 rounded-lg text-text-muted hover:text-text-main shadow-sm"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-text-main">Alerts</h1>
          </div>

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
                    {tab === "new" ? newAlertsCount : oldAlertsCount}
                  </span>
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-text-main text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>

          <div className="space-y-3">
            {alertsData.map((alert, idx) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all relative"
              >
                <div className={`absolute left-0 top-5 bottom-5 w-[3px] rounded-full ${severityColor(alert.type)}`} />
                <div className="pl-5">
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="text-base font-bold text-text-main">{alert.title}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ml-3 ${alert.tagColor}`}>
                      {alert.tag}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted mb-2 font-medium">{alert.authority}</p>
                  <p className="text-sm text-text-muted leading-relaxed mb-3">{alert.desc}</p>
                  <div className="flex justify-between items-center">
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
            ))}
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
};
