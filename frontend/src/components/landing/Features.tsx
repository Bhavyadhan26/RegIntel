import { motion } from "framer-motion";
import { zoomIn, fadeUp } from "../../lib/motionPresets";

const features = [
  {
    title: "Automated Monitoring",
    image: "/monitoring.jpg",
    list: [
      "MCA Circulars",
      "Company Law",
      "Tax Notifications",
      "GST Deadlines"
    ]
  },
  {
    title: "Tailored Alerts",
    image: "/tailoralerts.jpg",
    list: [
      "Amendments & Bills",
      "Circulars & Guidelines",
      "Banking & Finance"
    ]
  },
  {
    title: "Deadline Reminders",
    image: "/deadlinerem.jpg",
    list: [
      "Business Tenders",
      "Trade & Finance",
      "Announcements"
    ]
  }
];

const Features = () => {
  return (
    <section
      className="py-20 px-6 md:px-20 text-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/bg.png')` }}
    >
      <motion.h2 {...fadeUp} className="text-3xl font-semibold">
        Effortlessly Monitor & Stay Compliant
      </motion.h2>

      <div className="grid md:grid-cols-3 gap-6 mt-12">
        {features.map((card, i) => (
          <motion.div {...zoomIn} key={i}
            className="bg-white shadow-lg rounded-xl p-6 text-center border flex flex-col items-center"
          >
            {/* IMAGE */}
            <img
              src={card.image}
              alt={card.title}
              className="h-24 w-24 object-cover rounded-xl mb-3 shadow"
            />

            {/* TITLE */}
            <h3 className="text-xl font-semibold mb-2">{card.title}</h3>

            {/* LIST */}
            <ul className="text-gray-600 space-y-1 text-sm">
              {card.list.map((item, j) => (
                <li key={j}>✓ {item}</li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <hr className="border border-blue-300 mt-10" />
    </section>
  );
};

export default Features;
