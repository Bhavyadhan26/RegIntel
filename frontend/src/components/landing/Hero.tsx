import { motion } from "framer-motion";
import { fadeUp, fadeRight } from "../../lib/motionPresets";

const Hero = () => {
  return (
    <section
      className="w-full min-h-[90vh] flex items-center justify-start bg-cover bg-center px-6 md:px-16"
      style={{ backgroundImage: `url('/hero-bg.jpg')` }}
    >
      <div className="max-w-3xl text-white">
         <motion.h1 {...fadeUp} className="text-4xl md:text-6xl font-bold leading-tight mb-12">
          RegIntel
        </motion.h1>
        <motion.h1 {...fadeUp} className="text-4xl md:text-6xl font-bold leading-tight">
          Automated Regulatory<br />Tracking For Professionals
        </motion.h1>

        <motion.p {...fadeUp} className="mt-4 text-lg md:text-xl opacity-90">
          Stay informed and ahead of regulatory changes with tailored alerts and summaries.
        </motion.p>

        <motion.div {...fadeUp} className="mt-6 flex gap-4">
          <button className="px-6 py-3 bg-amber-600 rounded-lg text-indigo-950 font-medium hover:bg-amber-700 transition">
            Get Started
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
