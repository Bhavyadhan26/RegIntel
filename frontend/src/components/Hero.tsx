import { Button } from "@/components/ui/Button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export const Hero = () => {
  return (
    // Changed: Added min-h-screen and flex to fill the viewport
    <section className="relative min-h-screen flex items-center overflow-hidden bg-background">
      {/* Changed: Removed max-w-7xl to allow content to span the full width */}
      <div className="w-full mx-auto px-10 grid lg:grid-cols-2 gap-0 items-stretch">
        
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          // Changed: Added flex and centering for a balanced look in a larger space
          className="flex flex-col justify-center py-20 lg:pr-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-6 w-fit">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Next-Gen Compliance
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-text-main leading-[1.05] tracking-tight mb-6">
            The platform that makes{" "}
            <span className="text-primary block">regulatory data</span>{" "}
            work for you
          </h1>

          <p className="text-xl text-text-muted leading-relaxed mb-8 max-w-xl">
            Transforming complex compliance into actionable intelligence with high-end,
            real-time analytics and predictive reporting.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="h-14 px-10 text-lg shadow-xl shadow-primary/20">
                Get Started
              </Button>
            </Link>
            <Link to="#platform">
              <Button variant="outline" size="lg" className="h-14 px-10 text-lg border-input bg-transparent text-text-main hover:bg-accent hover:text-accent-foreground">
                Explore Platform
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          // Changed: Made the image container take up the full height of the split
          className="relative hidden lg:block"
        >
          <div className="relative h-full w-full overflow-hidden rounded-l-3xl shadow-2xl border-l border-y border-gray-100 bg-white">
            <img
              src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
              alt="RegIntel Dashboard Preview"
              // Changed: Object-cover and h-full ensures it fills the entire right side
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
          </div>

          {/* Decor */}
          <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 rounded-full blur-[120px]" />
        </motion.div>
      </div>
    </section>
  );
};