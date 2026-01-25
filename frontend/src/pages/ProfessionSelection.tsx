import { useState } from "react";
import { 
  Calculator, Scale, Briefcase, ClipboardCheck, 
  FileText, Shield, TrendingUp, Wallet, 
  BarChart3, Users, ArrowRight 
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// Data for the professions
const professions = [
  { id: "ca", title: "Chartered Accountant", desc: "ICAI updates, tax circulars, audit standards", icon: Calculator },
  { id: "lawyer", title: "Lawyer", desc: "Legal amendments, court notifications", icon: Scale },
  { id: "consultant", title: "Consultant", desc: "Cross-industry regulations, advisory updates", icon: Briefcase },
  { id: "auditor", title: "Auditor", desc: "Auditing standards, compliance requirements", icon: ClipboardCheck },
  { id: "tax", title: "Tax Advisor", desc: "Tax laws, filing deadlines, amendments", icon: FileText },
  { id: "compliance", title: "Compliance Officer", desc: "Regulatory compliance, policy updates", icon: Shield },
  { id: "reg-analyst", title: "Regulatory Analyst", desc: "Market regulations, policy analysis", icon: TrendingUp },
  { id: "finance", title: "Finance Manager", desc: "Financial regulations, reporting standards", icon: Wallet },
  { id: "analyst", title: "Analyst", desc: "Data analysis, regulatory trends", icon: BarChart3 },
  { id: "risk", title: "Risk & Governance Team", desc: "Risk management, governance frameworks", icon: Users },
];

export const ProfessionSelection = () => {
  // Track selected IDs
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans py-12 px-6">
      
      {/* --- Header --- */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-500/20">
            R
          </div>
          <span className="text-2xl font-extrabold text-gray-900 tracking-tight">RegIntel</span>
        </div>

        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
        >
          Select Your Profession
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-600 max-w-xl mx-auto"
        >
          Choose the professions that best describe your role. We'll customize your regulatory feed accordingly.
        </motion.p>
      </div>

      {/* --- Grid of Cards --- */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-24"
      >
        {professions.map((prof) => {
          const isSelected = selectedIds.includes(prof.id);
          
          return (
            <div 
              key={prof.id}
              onClick={() => toggleSelection(prof.id)}
              className={`
                relative cursor-pointer rounded-xl p-6 border-2 transition-all duration-200 group
                ${isSelected 
                  ? "border-orange-500 bg-orange-50/50 shadow-md" 
                  : "border-gray-100 bg-white hover:border-orange-200 hover:shadow-lg"
                }
              `}
            >
              {/* Icon */}
              <div className={`
                w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors
                ${isSelected ? "bg-orange-500 text-white" : "bg-gray-800 text-orange-500 group-hover:bg-gray-700"}
              `}>
                <prof.icon className="w-6 h-6" />
              </div>

              {/* Text */}
              <h3 className="font-bold text-gray-900 mb-2">{prof.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{prof.desc}</p>

              {/* Checkmark (Visible only when selected) */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center animate-in fade-in zoom-in duration-200">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </motion.div>

      {/* --- Bottom Action Bar --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 sm:p-6 z-50">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="text-gray-600 font-medium text-sm">
            <span className="text-gray-900 font-bold">{selectedIds.length}</span> professions selected
          </div>

          <Link 
            to="/dashboard" // We will create this next
            className={`
              flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg
              ${selectedIds.length > 0 
                ? "bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-orange-500/25 hover:scale-105" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
            // Prevent click if nothing selected (optional logic)
            onClick={(e) => selectedIds.length === 0 && e.preventDefault()}
          >
            Continue to Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
};