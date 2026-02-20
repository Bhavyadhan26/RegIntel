import { useState } from "react";
import { Filter, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Sidebar from "../components/layout/Sidebar";

export const Alerts = () => {
  const [activeTab, setActiveTab] = useState<"new" | "old">("new");

  const alertsData = [
    {
      id: 1, title: "SEBI Circular on Mutual Fund Regulations Amendment",
      authority: "Securities and Exchange Board of India",
      desc: "New guidelines for mutual fund distributors regarding commission disclosure and investor communication requirements.",
      date: "Jan 24, 2024", tag: "Circular", type: "critical",
      tagColor: "bg-red-100 text-red-700",
    },
    {
      id: 2, title: "GST Rate Revision Notification",
      authority: "Central Board of Indirect Taxes",
      desc: "Revised GST rates for select commodities effective from February 1, 2024.",
      date: "Jan 23, 2024", tag: "Notice", type: "high",
      tagColor: "bg-amber-100 text-amber-700",
    },
    {
      id: 3, title: "RBI Guidelines on Digital Lending",
      authority: "Reserve Bank of India",
      desc: "Updated guidelines for digital lending platforms regarding customer data protection.",
      date: "Jan 22, 2024", tag: "Circular", type: "medium",
      tagColor: "bg-purple-100 text-purple-700",
    },
    {
      id: 4, title: "Companies Act Amendment – CSR Provisions",
      authority: "Ministry of Corporate Affairs",
      desc: "Amendments to CSR spending reporting requirements for FY 2023-24.",
      date: "Jan 20, 2024", tag: "Amendment", type: "medium",
      tagColor: "bg-blue-100 text-blue-700",
    },
  ];

  const severityColor = (type: string) =>
    type === "critical" ? "bg-red-500" : type === "high" ? "bg-amber-500" : "bg-blue-500";

  return (
    <div className="min-h-screen bg-background flex font-sans">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-2xl font-bold text-text-main mb-7">Alerts</h1>

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
                  {tab === "new" ? "4" : "2"}
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
                  <button className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover">
                    Read More <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};
