import { motion } from "framer-motion";
import { fadeUp, zoomIn } from "../../lib/motionPresets";

const trusted = [
  {
    icon: "📡",
    title: "We Monitor Portals",
    desc: "RegIntel scans over 50 regulatory portals daily for the latest updates.",
    btn: "Learn More"
  },
  {
    icon: "🗂️",
    title: "We Summarize Updates",
    desc: "Key updates are summarized and categorized for your profession.",
    btn: "Learn More"
  },
  {
    icon: "🔔",
    title: "You Get Alerted",
    desc: "Receive timely alerts tailored to your specific role and needs.",
    btn: "Get Started"
  }
];

const TrustedSection = () => {
  return (
    <section
      className="w-full py-20 text-center bg-cover bg-center bg-no-repeat px-6 md:px-20"
      style={{ backgroundImage: `url('/bg.png')` }}
    >
      <motion.h2 {...fadeUp} className="text-2xl md:text-3xl font-light mb-3 -mt-20 font-serif">
        Trusted by CAs, Lawyers, and Consultants
      </motion.h2>

      <motion.p {...fadeUp} className="text-gray-600 max-w-3xl mx-auto mb-10">
        Leading professionals trust RegIntel for unified regulatory intelligence all in-one place.
      </motion.p>

      <div className="grid md:grid-cols-3 gap-6">
        {trusted.map((item, index) => (
          <motion.div
            key={index}
            {...zoomIn}
            className="bg-white/80 backdrop-blur-lg shadow-lg rounded-xl p-6 border flex flex-col items-center space-y-3"
          >
            <div className="text-4xl">{item.icon}</div>
            <h3 className="font-semibold text-lg">{item.title}</h3>
            <p className="text-gray-600 text-sm text-center">{item.desc}</p>

            <button className="px-4 py-2 rounded-md border text-blue-600 hover:bg-blue-50 transition">
              {item.btn}
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default TrustedSection;
