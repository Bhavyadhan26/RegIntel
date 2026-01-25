import { ShieldCheck} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-16 min-h-[80vh] flex items-center overflow-hidden bg-slate-800">
      
      {/* --- BACKGROUND COLOR (Gradient instead of Image) --- */}
      {/* This creates a professional 'spotlight' effect in dark blue */}
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-black" />
      
      {/* Optional: A subtle grid pattern overlay for a 'tech' feel */}
      <div className="absolute inset-0 -z-10 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/50 text-blue-200 border border-blue-500/30 text-[10px] font-bold mb-6 backdrop-blur-md"
        >
          <ShieldCheck className="w-3 h-3" />
          Trusted by 10,000+ professionals
        </motion.div>

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-4 drop-shadow-lg"
        >
          Global Regulatory <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            Intelligence Platform
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base text-blue-100/90 mb-8 max-w-2xl mx-auto leading-relaxed font-medium"
        >
          Navigate the complex landscape of global regulations with AI-powered tracking, real-time compliance alerts, and automated impact analysis.
        </motion.p>

        {/* Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link to="/alerts" className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg border border-white/20 hover:bg-amber-700 transition-all flex items-center justify-center gap-2 text-sm">
  Alerts 
</Link>

<Link to="/dashboard" className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg border border-white/20 hover:bg-amber-700 transition-all flex items-center justify-center gap-2 text-sm">
  Dashboard 
</Link>

<Link to="/deadlines" className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg border border-white/20 hover:bg-amber-700 transition-all flex items-center justify-center gap-2 text-sm">
  Deadlines
</Link>

<Link to="/publications" className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg border border-white/20 hover:bg-amber-700 transition-all flex items-center justify-center gap-2 text-sm">
  Publications
</Link>

<Link to="/feedback" className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg border border-white/20 hover:bg-amber-700 transition-all flex items-center justify-center gap-2 text-sm">
  Feedbacks
</Link>
        </motion.div>
      </div>
    </section>
  );
};