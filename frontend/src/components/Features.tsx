import {
  Bell, LayoutDashboard, TrendingUp, Globe, BarChart3, ShieldCheck, Check
} from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { motion } from "framer-motion";

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
    <section id="features" className="border-t border-border/40 bg-background py-16 md:py-20">
      <div className="mx-auto max-w-7xl">
        <FadeIn direction="up">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div id="value-proposition" className="mb-16 text-center md:mb-24">
              <span className="mb-4 block text-sm font-bold uppercase tracking-[0.2em] text-primary">FEATURES</span>
              <h2 className="mb-6 text-3xl font-bold leading-tight text-text-main md:text-4xl lg:text-5xl">
                What is RegIntel?
              </h2>
              <p className="mx-auto max-w-3xl text-lg leading-relaxed text-text-muted md:text-xl">
                A sophisticated compliance asset designed for the modern regulatory landscape.
                We unify fragmented data into a cohesive intelligence layer that empowers
                legal and compliance teams to lead with confidence.
              </p>
            </div>
          </div>
        </FadeIn>

        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((f, idx) => (
              <FadeIn
                key={idx}
                delay={idx * 0.1}
              >
                <div className="group bg-surface rounded-2xl p-10 border border-border/60 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2 hover:border-primary/20 h-full">
                  <div className={`w-14 h-14 ${f.color} rounded-xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-text-main mb-4">{f.title}</h3>
                  <p className="text-text-muted leading-relaxed text-lg">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>

      {/* Redesigned Impact Section - Solution Grid Style */}
      <FadeIn direction="up">
        <div id="impact" className="mt-16 px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-border/50 bg-slate-50/50 px-6 py-12 sm:px-10 md:px-14 md:py-16 lg:rounded-[3rem] lg:px-12">
            <FadeIn>
              <div className="mb-16 text-center md:mb-20">
                <span className="mb-4 block text-sm font-bold uppercase tracking-[0.2em] text-primary">Impact & Value</span>
                <h3 className="mb-6 text-3xl font-bold text-text-main md:text-4xl">How RegIntel makes an impact</h3>
                <p className="mx-auto max-w-2xl text-lg text-text-muted">Empowering your compliance journey with intelligence.</p>
              </div>
            </FadeIn>

            <div className="grid gap-8 lg:grid-cols-3">
            {/* Card 1: Streamline Compliance */}
            <FadeIn delay={0.1}>
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-border/40 flex flex-col items-start transition-shadow hover:shadow-md hover:-translate-y-1 duration-300 h-full">
              <div className="relative mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[0_18px_40px_-24px_rgba(15,23,42,0.28)] ring-1 ring-primary/15">
                <ShieldCheck className="h-8 w-8" />
                <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-sm ring-4 ring-white">
                  <Check className="h-3.5 w-3.5" />
                </div>
              </div>
              <h4 className="text-2xl font-bold text-text-main mb-4">Streamline Compliance</h4>
              <p className="text-text-muted leading-relaxed text-lg mb-8">
                Simplify complex regulatory workflows with automated tracking and unified dashboards designed for efficiency.
              </p>
              {/* Visual Placeholder for Dashboard UI */}
              <div className="mt-auto flex h-44 w-full flex-col gap-4 rounded-xl border border-slate-100 bg-[linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(241,245,249,0.72)_100%)] p-6">
                <div className="h-3 w-2/3 rounded-full bg-slate-200" />
                <div className="h-3 w-full rounded-full bg-slate-100" />
                <div className="flex flex-1 items-center justify-center gap-3">
                  <div className="h-16 w-14 rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm">
                    <div className="mb-2 h-2 w-7 rounded-full bg-emerald-100" />
                    <div className="h-2 w-5 rounded-full bg-slate-100" />
                  </div>
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15">
                    <ShieldCheck className="h-7 w-7" />
                    <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary ring-4 ring-slate-50" />
                  </div>
                  <div className="h-16 w-14 rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm">
                    <div className="mb-2 h-2 w-6 rounded-full bg-slate-200" />
                    <div className="flex gap-1">
                      <div className="h-6 w-2 rounded-full bg-primary-200" />
                      <div className="h-4 w-2 rounded-full bg-primary-300" />
                      <div className="h-7 w-2 rounded-full bg-primary-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </FadeIn>

            {/* Card 2: Actionable Insights */}
            <FadeIn delay={0.2}>
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-border/40 flex flex-col items-start transition-shadow hover:shadow-md hover:-translate-y-1 duration-300 h-full">
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
            </div>
            </FadeIn>

            {/* Card 3: Global Coverage */}
            <FadeIn delay={0.3}>
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-border/40 flex flex-col items-start transition-shadow hover:shadow-md hover:-translate-y-1 duration-300 h-full">
              <div className="w-14 h-14 bg-sky-50 text-green-600 rounded-xl flex items-center justify-center mb-8">
                <Globe className="w-7 h-7" />
              </div>
              <h4 className="text-2xl font-bold text-text-main mb-4">Global Coverage</h4>
              <p className="text-text-muted leading-relaxed text-lg mb-8">
                Monitor compliance requirements across jurisdictions with our interconnected global network.
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
            </div>
            </FadeIn>
          </div>
        </div>
        </div>
      </FadeIn>
    </section>
  );
};