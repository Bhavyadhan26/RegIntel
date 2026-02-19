import { motion } from "framer-motion";
import {
  Bell, FileText, Calendar,
  LayoutDashboard, BarChart3
} from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-10 overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent-purple/8 rounded-full blur-[120px]" />
      <div className="absolute top-20 right-[15%] w-[200px] h-[300px] bg-accent-teal/5 rounded-full blur-[80px]" />
      <div className="absolute top-10 left-[10%] w-[150px] h-[250px] bg-accent-blue/5 rounded-full blur-[60px]" />

      {/* Light streak lines */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-40 bg-gradient-to-b from-transparent via-accent-teal/20 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-normal text-white leading-[1.1] tracking-tight mb-7"
          >
            The platform that makes{" "}
            <span className="text-accent-teal">regulatory data</span>{" "}
            work for you
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-[17px] font-medium text-gray-400 leading-relaxed mb-10 max-w-xl mx-auto"
          >
            We turn complexity into clarity by connecting your compliance systems
            into a single intelligent platform — so you can act faster and stay ahead.
          </motion.p>


        </div>

        {/* Vertical line */}
        <div className="flex justify-center my-10">
          <div className="w-px h-16 bg-gradient-to-b from-gray-600 to-transparent" />
        </div>

        {/* Dashboard Preview Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="max-w-4xl mx-auto bg-dark-900 border border-dark-600/60 rounded-2xl p-1 shadow-2xl shadow-accent-purple/5"
        >
          <div className="flex rounded-xl overflow-hidden bg-dark-800">
            {/* Mini Sidebar */}
            <div className="w-48 bg-dark-900 border-r border-dark-600/50 p-4 hidden md:block">
              <div className="flex items-center gap-2 mb-6">
                <img src="/logo.png" alt="RegIntel" className="w-6 h-6 rounded-md" />
                <span className="text-sm font-semibold text-white">RegIntel</span>
              </div>
              <div className="space-y-1">
                {[
                  { icon: LayoutDashboard, label: "Overview", active: true },
                  { icon: Bell, label: "Alerts" },
                  { icon: FileText, label: "Publications" },
                  { icon: Calendar, label: "Deadlines" },
                  { icon: BarChart3, label: "Analytics" },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs ${item.active ? "bg-dark-700 text-white" : "text-gray-500"
                    }`}>
                    <item.icon size={14} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="flex-1 p-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {/* Bar Chart Card */}
                <div className="bg-dark-900 rounded-lg p-4 border border-dark-600/40">
                  <div className="flex gap-1 items-end h-16 mb-2">
                    {[40, 65, 35, 80, 55, 90, 45].map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm" style={{
                        height: `${h}%`,
                        background: i === 5 ? '#2dd4bf' : i === 3 ? '#6366f1' : '#1a1d3a'
                      }} />
                    ))}
                  </div>
                  <div className="text-[10px] text-gray-500">Compliance Status</div>
                </div>

                {/* Line Chart Card */}
                <div className="bg-dark-900 rounded-lg p-4 border border-dark-600/40 md:col-span-2">
                  <svg viewBox="0 0 200 60" className="w-full h-16 mb-2">
                    <polyline
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="1.5"
                      points="0,45 25,40 50,20 75,30 100,15 125,25 150,10 175,18 200,5"
                    />
                    <polyline
                      fill="none"
                      stroke="#2dd4bf"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      points="0,50 25,48 50,35 75,40 100,30 125,35 150,25 175,28 200,20"
                    />
                    {[{ x: 100, y: 15 }, { x: 150, y: 10 }].map((pt, i) => (
                      <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#6366f1" />
                    ))}
                  </svg>
                  <div className="text-[10px] text-gray-500">Regulatory Trend Analysis</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Donut */}
                <div className="bg-dark-900 rounded-lg p-4 border border-dark-600/40 flex items-center gap-4">
                  <svg viewBox="0 0 40 40" className="w-12 h-12">
                    <circle cx="20" cy="20" r="15" fill="none" stroke="#1a1d3a" strokeWidth="5" />
                    <circle cx="20" cy="20" r="15" fill="none" stroke="#8b5cf6" strokeWidth="5"
                      strokeDasharray="70 30" strokeDashoffset="25" strokeLinecap="round" />
                    <circle cx="20" cy="20" r="15" fill="none" stroke="#2dd4bf" strokeWidth="5"
                      strokeDasharray="20 80" strokeDashoffset="55" strokeLinecap="round" />
                  </svg>
                  <div>
                    <div className="text-xs text-gray-400">Coverage</div>
                    <div className="text-sm font-semibold text-white">87%</div>
                  </div>
                </div>

                {/* Bar chart 2 */}
                <div className="bg-dark-900 rounded-lg p-4 border border-dark-600/40">
                  <div className="flex gap-1.5 items-end h-12 mb-2">
                    {[55, 70, 45, 85, 60, 40, 75, 50].map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm" style={{
                        height: `${h}%`,
                        background: i % 2 === 0 ? '#38bdf8' : '#1e2035'
                      }} />
                    ))}
                  </div>
                  <div className="text-[10px] text-gray-500">Alert Distribution</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};