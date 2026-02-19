import { useState } from "react";
import {
  Calculator, Scale, Briefcase, ClipboardCheck,
  FileText, Shield, TrendingUp, Wallet,
  BarChart3, Users, ArrowRight, Check
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  return (
    <div className="min-h-screen bg-dark-950 font-sans">
      {/* Top bar */}
      <div className="bg-dark-900 border-b border-dark-600/50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2.5">
          <img src="/logo.png" alt="RegIntel" className="w-9 h-9 rounded-lg" />
          <span className="text-base font-semibold text-white">RegIntel</span>
          <span className="ml-auto text-sm text-gray-500 font-medium">Step 2 of 2</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-normal text-white mb-3">Pick your profession</h1>
          <p className="text-[15px] font-medium text-gray-400 mb-10 max-w-md">
            Select the roles that match yours. We'll customize your regulatory feed.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-28">
          {professions.map((p) => {
            const sel = selectedIds.includes(p.id);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => toggle(p.id)}
                className={`flex items-center gap-4 p-5 rounded-xl border cursor-pointer transition-all duration-200 ${sel
                  ? "border-accent-purple/50 bg-accent-purple/10"
                  : "border-dark-600/40 bg-dark-800/60 hover:border-dark-400/50 hover:bg-dark-800"
                  }`}
              >
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${sel ? "bg-accent-purple text-white" : "bg-dark-700 text-gray-400"
                  }`}>
                  <p.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-white">{p.title}</h3>
                  <p className="text-sm text-gray-500 truncate">{p.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${sel ? "bg-accent-purple border-accent-purple" : "bg-transparent border-dark-500"
                  }`}>
                  {sel && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-600/50 py-4 px-6 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="font-bold text-white">{selectedIds.length}</span> selected
          </p>
          <Link
            to="/dashboard"
            className={`inline-flex items-center gap-2 px-7 py-2.5 text-sm font-semibold rounded-lg transition-all ${selectedIds.length > 0
              ? "bg-accent-purple text-white hover:bg-accent-purple/90"
              : "bg-dark-700 text-gray-600 cursor-not-allowed"
              }`}
            onClick={(e) => selectedIds.length === 0 && e.preventDefault()}
          >
            Continue <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};