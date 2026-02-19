import {
  Bell, FileText, Clock, Shield, TrendingUp, BarChart3,
  Calculator, Scale, Briefcase, Check
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const features = [
  { icon: Bell, title: "Alerting", desc: "Instant push alerts when rules change", span: "", accent: "accent-teal", shadow: "shadow-accent-teal/10", iconBg: "bg-accent-teal/15", iconColor: "text-accent-teal" },
  { icon: Shield, title: "Compliance Tracking", desc: "Monitor compliance status across all areas", span: "", accent: "accent-purple", shadow: "shadow-accent-purple/10", iconBg: "bg-accent-purple/15", iconColor: "text-accent-purple" },
  { icon: TrendingUp, title: "Trend Analysis", desc: "Spot regulatory trends before they impact you", span: "md:col-span-2", accent: "accent-blue", shadow: "shadow-accent-blue/10", iconBg: "bg-accent-blue/15", iconColor: "text-accent-blue" },
  { icon: BarChart3, title: "Portfolio Health", desc: "Know your compliance score at a glance", span: "", accent: "accent-rose", shadow: "shadow-accent-rose/10", iconBg: "bg-accent-rose/15", iconColor: "text-accent-rose" },
  { icon: FileText, title: "Publication Feed", desc: "Every circular, notice, and amendment in one place", span: "md:col-span-2", accent: "accent-amber", shadow: "shadow-accent-amber/10", iconBg: "bg-accent-amber/15", iconColor: "text-accent-amber" },
  { icon: Clock, title: "Deadline Manager", desc: "Never miss a single filing deadline", span: "", accent: "accent-sky", shadow: "shadow-accent-sky/10", iconBg: "bg-accent-sky/15", iconColor: "text-accent-sky" },
];

const professions = [
  { title: "Chartered Accountants", icon: Calculator, desc: "ICAI circulars, tax amendments, & audit standards." },
  { title: "Lawyers", icon: Scale, desc: "Court notifications, legal updates & amendments." },
  { title: "Consultants", icon: Briefcase, desc: "Cross-industry regulations & advisory updates." },
];

export const Features = () => {
  return (
    <>
      {/* What can RegIntel do */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-normal text-white leading-tight mb-5"
            >
              What can RegIntel<br />do for you?
            </motion.h2>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((f, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className={`bg-dark-800/80 backdrop-blur-sm border border-dark-600/50 rounded-2xl p-8 shadow-lg hover:shadow-xl hover:-translate-y-1 hover:border-dark-400/60 transition-all duration-300 group ${f.span} ${f.shadow}`}
              >
                <div className={`w-12 h-12 ${f.iconBg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-[15px] text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What is RegIntel */}
      <section id="professions" className="py-24 relative">
        <div className="absolute inset-0 bg-dark-950" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-purple/5 rounded-full blur-[120px]" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-normal text-white leading-tight mb-5"
            >
              What is RegIntel?
            </motion.h2>
            <p className="text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
              Your most powerful digital compliance asset — seamlessly integrating key
              data sources, uncovering regulatory blind spots, and transforming scattered
              information into actionable intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Left: Profession cards */}
            <div className="space-y-3">
              {professions.map((prof, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-dark-800/60 backdrop-blur-sm border border-dark-600/40 rounded-xl p-6 hover:border-dark-400/50 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <prof.icon className="w-5 h-5 text-gray-400 group-hover:text-accent-teal transition-colors" />
                    <h3 className="text-base font-semibold text-white">{prof.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 pl-8">{prof.desc}</p>
                  <div className="flex gap-5 mt-3 pl-8">
                    {["Real-time alerts", "Smart filtering"].map((check, i) => (
                      <span key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Check className="w-3.5 h-3.5 text-accent-teal" strokeWidth={3} />
                        {check}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}

              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent-purple text-white text-sm font-semibold rounded-lg hover:bg-accent-purple/90 transition-all mt-4"
              >
                Choose Your Profession →
              </Link>
            </div>

            {/* Right: Mini dashboard preview */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-dark-900 border border-dark-600/50 rounded-xl p-5"
            >
              {/* Table header */}
              <div className="grid grid-cols-4 gap-2 text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-3 px-2">
                <span>Body</span><span>Health</span><span>Schedule</span><span>Budget</span>
              </div>
              <div className="space-y-2">
                {[
                  { name: "SEBI", health: "Healthy", sched: "85%", budget: "70%", color: "text-accent-teal" },
                  { name: "RBI", health: "Critical", sched: "44%", budget: "56%", color: "text-accent-rose" },
                  { name: "MCA", health: "Moderate", sched: "67%", budget: "82%", color: "text-accent-amber" },
                  { name: "CBDT", health: "Healthy", sched: "91%", budget: "88%", color: "text-accent-teal" },
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 bg-dark-800 rounded-lg px-3 py-2.5 text-xs">
                    <span className="text-gray-300 font-medium">{row.name}</span>
                    <span className={`${row.color} font-medium`}>{row.health}</span>
                    <span className="text-gray-400">{row.sched}</span>
                    <span className="text-gray-400">{row.budget}</span>
                  </div>
                ))}
              </div>

              {/* Floating badge */}
              <div className="mt-4 flex justify-end">
                <div className="bg-accent-teal/20 border border-accent-teal/30 rounded-lg px-4 py-2.5 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent-teal" />
                  <span className="text-xs font-semibold text-accent-teal">98% Compliance Score</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

import { CheckCircle } from "lucide-react";