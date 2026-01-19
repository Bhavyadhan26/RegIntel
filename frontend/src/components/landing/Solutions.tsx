import { motion } from "framer-motion";
import { fadeLeft, fadeRight } from "../../lib/motionPresets";

const Solutions = () => (
  <section className="py-20 px-6 md:px-20 grid md:grid-cols-2 gap-10">
    <motion.div {...fadeRight}>
      <h2 className="text-5xl mt-8 font-light font-serif">Dedicated Solutions for Your Profession</h2>
      <p className="mt-3 text-gray-600">
        RegIntel delivers tailored regulatory updates for CAs, Lawyers & Consultants.
      </p>

      <div className="flex gap-3 mt-5">
        <span className="px-4 py-2 rounded bg-gray-100 border">ICAI</span>
        <span className="px-4 py-2 rounded bg-gray-100 border">ICSI</span>
        <span className="px-4 py-2 rounded bg-gray-100 border">+ 200 More</span>
      </div>
    </motion.div>

    <motion.img
      {...fadeLeft}
      src="/professionals.jpg"
      className="rounded-xl shadow-lg h-72 w-full object-cover"
    /> <hr className="border border-blue-300 mt-10" />
  </section>
);

export default Solutions;
