import { useState } from "react";
import { Filter, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";

export const Alerts = () => {
  const [activeTab, setActiveTab] = useState<"new" | "old">("new");

  const alertsData = [
    {
      id: 1, title: "SEBI Circular on Mutual Fund Regulations Amendment",
      authority: "Securities and Exchange Board of India",
      desc: "New guidelines for mutual fund distributors regarding commission disclosure and investor communication requirements.",
      date: "Jan 24, 2024", tag: "Circular", type: "critical",
      tagColor: "bg-accent-purple/15 text-accent-purple",
    },
    {
      id: 2, title: "GST Rate Revision Notification",
      authority: "Central Board of Indirect Taxes",
      desc: "Revised GST rates for select commodities effective from February 1, 2024.",
      date: "Jan 23, 2024", tag: "Notice", type: "high",
      tagColor: "bg-accent-sky/15 text-accent-sky",
    },
    {
      id: 3, title: "RBI Guidelines on Digital Lending",
      authority: "Reserve Bank of India",
      desc: "Updated guidelines for digital lending platforms regarding customer data protection.",
      date: "Jan 22, 2024", tag: "Circular", type: "medium",
      tagColor: "bg-accent-purple/15 text-accent-purple",
    },
    {
      id: 4, title: "Companies Act Amendment – CSR Provisions",
      authority: "Ministry of Corporate Affairs",
      desc: "Amendments to CSR spending reporting requirements for FY 2023-24.",
      date: "Jan 20, 2024", tag: "Amendment", type: "medium",
      tagColor: "bg-accent-amber/15 text-accent-amber",
    },
  ];

  const severityColor = (type: string) =>
    type === "critical" ? "bg-accent-rose" : type === "high" ? "bg-accent-amber" : "bg-accent-sky";

  return (
    <div className="min-h-screen bg-dark-950 flex font-sans">
      <Sidebar />
      <main className="flex-1 ml-[240px] p-8">
        <h1 className="text-2xl font-semibold text-white mb-7">Alerts</h1>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-7">
          <div className="flex bg-dark-800 border border-dark-600/40 rounded-lg p-1">
            {(["new", "old"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab
                    ? "bg-accent-purple text-white"
                    : "text-gray-500 hover:text-gray-300"
                  }`}
              >
                {tab === "new" ? "New" : "Old"}
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${activeTab === tab ? "bg-white/20" : "bg-dark-700"
                  }`}>
                  {tab === "new" ? "4" : "2"}
                </span>
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-dark-800 border border-dark-600/40 rounded-lg text-gray-400 text-sm font-medium hover:border-dark-400 transition-colors">
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
              className="bg-dark-800/60 backdrop-blur-sm rounded-xl p-6 border border-dark-600/40 hover:border-dark-400/40 transition-all relative"
            >
              <div className={`absolute left-0 top-5 bottom-5 w-[3px] rounded-full ${severityColor(alert.type)}`} />
              <div className="pl-5">
                <div className="flex justify-between items-start mb-1.5">
                  <h3 className="text-base font-medium text-gray-200">{alert.title}</h3>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ml-3 ${alert.tagColor}`}>
                    {alert.tag}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-2">{alert.authority}</p>
                <p className="text-sm text-gray-400 leading-relaxed mb-3">{alert.desc}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">{alert.date}</span>
                  <button className="flex items-center gap-1 text-sm font-medium text-accent-purple hover:text-accent-purple/80">
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
