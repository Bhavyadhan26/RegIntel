import { useState } from "react";
import { 
  Filter, ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";

export const Alerts = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'old'>('new');

  // Mock Data matching your screenshot
  const alertsData = [
    {
      id: 1,
      title: "SEBI Circular on Mutual Fund Regulations Amendment",
      authority: "Securities and Exchange Board of India",
      desc: "New guidelines for mutual fund distributors regarding commission disclosure and investor communication requirements.",
      date: "Jan 24, 2024",
      tag: "Circular",
      type: "critical", // Red border
      tagColor: "bg-purple-100 text-purple-700",
      hasReadMore: false
    },
    {
      id: 2,
      title: "GST Rate Revision Notification",
      authority: "Central Board of Indirect Taxes",
      desc: "Revised GST rates for select commodities effective from February 1, 2024.",
      date: "Jan 23, 2024",
      tag: "Notice",
      type: "high", // Orange border
      titleColor: "text-orange-600",
      tagColor: "bg-blue-100 text-blue-700",
      hasReadMore: true
    },
    {
      id: 3,
      title: "RBI Guidelines on Digital Lending",
      authority: "Reserve Bank of India",
      desc: "Updated guidelines for digital lending platforms regarding customer data protection.",
      date: "Jan 22, 2024",
      tag: "Circular",
      type: "medium", // Yellow/Gold border
      tagColor: "bg-purple-100 text-purple-700",
      hasReadMore: false
    },
    {
      id: 4,
      title: "Companies Act Amendment – CSR Provisions",
      authority: "Ministry of Corporate Affairs",
      desc: "Amendments to CSR spending reporting requirements for FY 2023-24.",
      date: "Jan 20, 2024",
      tag: "Amendment",
      type: "medium", // Yellow border
      tagColor: "bg-orange-100 text-orange-700",
      hasReadMore: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex font-sans">
      <Sidebar />

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 md:ml-64 p-4 sm:p-8">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Alerts</h1>
        </header>

        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          
          {/* Tabs */}
          <div className="bg-gray-200/50 p-1 rounded-xl flex gap-1">
            <button 
              onClick={() => setActiveTab('new')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'new' 
                ? "bg-orange-500 text-white shadow-md" 
                : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              New Alerts <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'new' ? "bg-white/20 text-white" : "bg-gray-300 text-gray-700"}`}>4</span>
            </button>
            <button 
              onClick={() => setActiveTab('old')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'old' 
                ? "bg-orange-500 text-white shadow-md" 
                : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Old Alerts <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'old' ? "bg-white/20 text-white" : "bg-gray-300 text-gray-700"}`}>2</span>
            </button>
          </div>

          {/* Filter Button */}
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm font-semibold hover:bg-gray-50 shadow-sm transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        {/* --- ALERTS LIST --- */}
        <div className="space-y-4">
          {alertsData.map((alert, idx) => (
            <motion.div 
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow"
            >
              {/* Colored Border Indicator on Left */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                alert.type === 'critical' ? 'bg-red-500' : 
                alert.type === 'high' ? 'bg-orange-500' : 
                'bg-yellow-500'
              }`} />

              <div className="pl-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className={`font-bold text-lg ${alert.titleColor || 'text-gray-900'}`}>
                      {alert.title}
                    </h3>
                    <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wide">
                      {alert.authority}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${alert.tagColor}`}>
                    {alert.tag}
                  </span>
                </div>

                <p className="text-gray-600 text-sm leading-relaxed mb-4 mt-3">
                  {alert.desc}
                </p>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-medium text-gray-400">
                    {alert.date}
                  </span>
                  
                  {alert.hasReadMore && (
                    <button className="flex items-center gap-1 text-sm font-bold text-orange-600 hover:text-orange-700 hover:underline">
                      Read More <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </main>
    </div>
  );
};

