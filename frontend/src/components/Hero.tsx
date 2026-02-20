import { Button } from "@/components/ui/Button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Next-Gen Compliance
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-text-main leading-[1.1] tracking-tight mb-6">
            The platform that makes{" "}
            <span className="text-primary block">regulatory data</span>{" "}
            work for you
          </h1>

          <p className="text-lg text-text-muted leading-relaxed mb-8 max-w-lg">
            Transforming complex compliance into actionable intelligence with high-end,
            real-time analytics and predictive reporting.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20">
                Get Started
              </Button>
            </Link>
            <Link to="#platform">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base border-input bg-transparent text-text-main hover:bg-accent hover:text-accent-foreground">
                Explore Platform
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/50 border border-gray-100 bg-white">
            <img
              src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
              alt="RegIntel Dashboard Preview"
              className="w-full h-auto object-cover"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent mix-blend-multiply opacity-20" />
          </div>

          {/* Decor */}
          <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-[100px]" />
        </motion.div>
      </div>
    </section>
  );
};
