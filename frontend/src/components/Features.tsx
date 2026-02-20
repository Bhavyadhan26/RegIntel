import {
  Bell, LayoutDashboard, TrendingUp
} from "lucide-react";
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
    color: "bg-indigo-100 text-indigo-700"
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div id="value-proposition" className="text-center mb-20">
          <span className="text-xs font-bold text-primary tracking-widest uppercase mb-3 block">Value Proposition</span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-main leading-tight mb-4">
            What is RegIntel?
          </h2>
          <p className="text-text-muted max-w-2xl mx-auto leading-relaxed text-lg">
            A sophisticated compliance asset designed for the modern regulatory landscape.
            We unify fragmented data into a cohesive intelligence layer that empowers
            legal and compliance teams to lead with confidence.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-surface rounded-xl p-8 border border-border shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-200"
            >
              <div className={`w-12 h-12 ${f.color} rounded-lg flex items-center justify-center mb-6`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-text-main mb-3">{f.title}</h3>
              <p className="text-text-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Social Proof / Trust Section */}
      <div id="impact" className="mt-32 max-w-7xl mx-auto px-6 bg-light-100/50 rounded-3xl py-20 border border-border">
        <div className="text-center mb-16">
          <h3 className="text-2xl font-bold text-text-main mb-4">How RegIntel makes an impact</h3>
          <p className="text-text-muted">Trusted by global leaders in finance, healthcare, and technology.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: "Sarah Jenkins", role: "Head of Compliance, Fintech Corp", quote: "RegIntel has completely transformed how our team handles global updates. It's an indispensable tool for our daily compliance workflow." },
            { name: "Marcus Thorne", role: "Director of Legal Affairs, MedGen", quote: "The most intuitive regulatory platform I've used in 15 years. The trend analysis tool is particularly impressive for planning." },
            { name: "Elena Rodriguez", role: "Global Risk Officer, Nexus Group", quote: "Clean, professional, and powerful. It provides the clarity we need to stay compliant in an entirely complex market." }
          ].map((testimonial, i) => (
            <div key={i} className="bg-surface p-8 rounded-xl shadow-sm border border-border">
              <div className="flex text-amber-400 mb-4 gap-1">
                {[1, 2, 3, 4, 5].map(star => <span key={star}>★</span>)}
              </div>
              <p className="text-text-main italic mb-6 leading-relaxed">"{testimonial.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">
                  {testimonial.name[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-text-main">{testimonial.name}</p>
                  <p className="text-xs text-text-muted">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

