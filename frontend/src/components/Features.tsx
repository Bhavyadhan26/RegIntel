import { Bell, FileText, Clock, Calculator, Scale, Briefcase, CheckCircle2 } from "lucide-react";

export const Features = () => {
  const features = [
    { icon: Bell, title: "Real-time Alerts", desc: "Instant notifications for regulatory changes." },
    { icon: FileText, title: "Smart Publications", desc: "Access categorized notices and circulars." },
    { icon: Clock, title: "Deadline Tracking", desc: "Automated compliance reminders." }
  ];

  const professions = [
    { title: "Chartered Accountants", icon: Calculator, desc: "ICAI circulars & tax amendments.", checks: ["Real-time alerts", "Smart filtering"] },
    { title: "Lawyers", icon: Scale, desc: "Court notifications & legal updates.", checks: ["Real-time alerts", "Smart filtering"] },
    { title: "Consultants", icon: Briefcase, desc: "Cross-industry advisory requirements.", checks: ["Real-time alerts", "Smart filtering"] }
  ];

  return (
    <div className="bg-white">
      {/* SECTION 1: Features (Compact) */}
      <section className="py-12 bg-amber-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Regulatory Chaos Costs Time</h2>
            <p className="text-sm text-gray-600 max-w-xl mx-auto">
              Stop scanning multiple sources. RegIntel eliminates the burden.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-sky-200 p-6 rounded-xl shadow-2xl border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: Professionals (Compact) */}
      <section className="py-12 bg-amber-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Built for Your Profession</h2>
            <p className="text-sm text-gray-600">Tailored intelligence for your domain.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {professions.map((prof, idx) => (
              <div key={idx} className="bg-sky-200 p-6 rounded-xl border border-gray-200 shadow-2xl hover:border-blue-200 transition-colors group">
                <div className="w-12 h-12 mx-auto bg-slate-800 rounded-xl flex items-center justify-center mb-4 text-blue-400 group-hover:scale-105 transition-transform">
                  <prof.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">{prof.title}</h3>
                <p className="text-gray-600 text-center text-xs mb-6">{prof.desc}</p>
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  {prof.checks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                      <CheckCircle2 className="w-3 h-3 text-blue-500 shrink-0" />
                      <span>{check}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};