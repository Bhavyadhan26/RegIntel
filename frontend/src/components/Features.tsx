import {
  Bell, LayoutDashboard, TrendingUp, Globe, BarChart3, ShieldCheck
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

const features = [
  {
    icon: Bell,
    title: "Real-time Alerting",
    desc: "Stay ahead of regulatory changes with instant notifications tailored specifically to your industry and jurisdictions.",
    color: "bg-green-100 text-green-700"
  },
  {
    icon: LayoutDashboard,
    title: "Compliance Tracking",
    desc: "Monitor your status effortlessly across multiple global jurisdictions with our unified, intuitive dashboard system.",
    color: "bg-rose-100 text-rose-700"
  },
  {
    icon: TrendingUp,
    title: "Trend Analysis",
    desc: "Leverage predictive insights and historical data patterns to future-proof your long-term regulatory strategy.",
    color: "bg-green-100 text-green-700"
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-32 bg-background border-t border-border/40">
      {/* Upper Features Section (Value Proposition) */}
      <div className="w-full px-10 md:px-20">
        <div id="value-proposition" className="text-center mb-24">
          <span className="text-sm font-bold text-primary tracking-[0.2em] uppercase mb-4 block">Value Proposition</span>
          <h2 className="text-4xl md:text-5xl font-bold text-text-main leading-tight mb-6">
            What is RegIntel?
          </h2>
          <p className="text-text-muted max-w-3xl mx-auto leading-relaxed text-xl">
            A sophisticated compliance asset designed for the modern regulatory landscape. 
            We unify fragmented data into a cohesive intelligence layer that empowers 
            legal and compliance teams to lead with confidence.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((f, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="group bg-surface rounded-2xl p-10 border border-border/60 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2 hover:border-primary/20"
            >
              <div className={`w-14 h-14 ${f.color} rounded-xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-text-main mb-4">{f.title}</h3>
              <p className="text-text-muted leading-relaxed text-lg">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Redesigned Impact Section - Solution Grid Style */}
      <div id="impact" className="mt-40 w-full px-10 md:px-20">
        <div className="bg-slate-50/50 rounded-[3rem] py-24 px-10 md:px-20 border border-border/50">
          <div className="text-center mb-20">
            <span className="text-sm font-bold text-primary tracking-[0.2em] uppercase mb-4 block">Impact & Value</span>
            <h3 className="text-4xl md:text-5xl font-bold text-text-main mb-6">How RegIntel makes an impact</h3>
            <p className="text-text-muted text-xl max-w-2xl mx-auto">Empowering your compliance journey with intelligence.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Card 1: Streamline Compliance */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-10 rounded-2xl shadow-sm border border-border/40 flex flex-col items-start transition-shadow hover:shadow-md"
            >
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-8">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h4 className="text-2xl font-bold text-text-main mb-4">Streamline Compliance</h4>
              <p className="text-text-muted leading-relaxed text-lg mb-8">
                Simplify complex regulatory workflows with automated tracking and unified dashboards designed for efficiency.
              </p>
              {/* Visual Placeholder for Dashboard UI */}
              <div className="mt-auto w-full h-44 bg-slate-50 rounded-xl border border-slate-100 p-6 flex flex-col gap-3">
                <div className="h-3 w-2/3 bg-slate-200 rounded-full" />
                <div className="h-3 w-full bg-slate-100 rounded-full" />
                <div className="flex-1 flex items-center justify-center">
                   <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-green-500 animate-spin" />
                </div>
              </div>
            </motion.div>

            {/* Card 2: Actionable Insights */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-10 rounded-2xl shadow-sm border border-border/40 flex flex-col items-start transition-shadow hover:shadow-md"
            >
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-8">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h4 className="text-2xl font-bold text-text-main mb-4">Actionable Insights</h4>
              <p className="text-text-muted leading-relaxed text-lg mb-8">
                Turn raw regulatory data into strategic advantages with real-time analytics and trend reporting.
              </p>
              {/* Visual Placeholder for Bar Chart */}
              <div className="mt-auto w-full h-44 bg-slate-50 rounded-xl border border-slate-100 p-8 flex items-end gap-3">
                <div className="flex-1 bg-primary/20 h-[40%] rounded-t-md transition-all hover:h-[50%]" />
                <div className="flex-1 bg-primary/50 h-[65%] rounded-t-md transition-all hover:h-[75%]" />
                <div className="flex-1 bg-primary/100 h-[90%] rounded-t-md transition-all hover:h-[100%]" />
                <div className="flex-1 bg-primary/35 h-[75%] rounded-t-md transition-all hover:h-[85%]" />
              </div>
            </motion.div>

            {/* Card 3: Global Coverage */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-10 rounded-2xl shadow-sm border border-border/40 flex flex-col items-start transition-shadow hover:shadow-md"
            >
              <div className="w-14 h-14 bg-sky-50 text-green-600 rounded-xl flex items-center justify-center mb-8">
                <Globe className="w-7 h-7" />
              </div>
              <h4 className="text-2xl font-bold text-text-main mb-4">Global Coverage</h4>
              <p className="text-text-muted leading-relaxed text-lg mb-8">
                Monitor compliance requirements across 150+ jurisdictions with our interconnected global network.
              </p>
              {/* Visual Placeholder for Global Network */}
              <div className="mt-auto w-full h-44 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center relative overflow-hidden">
                <div className="relative w-24 h-24">
                  <Globe className="w-full h-full text-primary/50" />
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute inset-0 border-2 border-green-400 rounded-full" 
                  />
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-20 text-center">
            <Button size="lg" className="h-14 px-10 text-lg group shadow-lg shadow-primary/10">
              Explore All Solutions 
              <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};