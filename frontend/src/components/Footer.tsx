import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-dark-950 border-t border-dark-700/50">
      {/* CTA Band */}
      <div className="py-20 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent-purple/5 rounded-full blur-[100px]" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-normal text-white mb-5">
            How RegIntel<br />makes an impact
          </h2>
          <p className="text-[15px] font-medium text-gray-400 mb-10 max-w-lg mx-auto">
            Real stories from compliance leaders who rely on our platform every day.
          </p>

          {/* Testimonial Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-16">
            {[
              {
                quote: "Transparency is key to a successful compliance program. RegIntel increases transparency for all stakeholders, prompting data-driven action before issues arise.",
                name: "Vikram Mehta",
                title: "Senior Tax Consultant",
                gradient: "from-dark-800 to-dark-900",
              },
              {
                quote: "If you don't have the resources to build risk metrics from the ground up, RegIntel can be that easy button for anyone looking to get insights from regulatory data.",
                name: "Priya Sharma",
                title: "Head of Compliance, TechFinance",
                gradient: "from-accent-teal/10 to-dark-900",
              },
              {
                quote: "RegIntel helps us recognize and address regulatory risk early and often. It sheds light on things that aren't immediately obvious in scattered data sources.",
                name: "Arun Reddy",
                title: "VP Legal & Governance",
                gradient: "from-dark-800 to-dark-900",
              },
            ].map((t, idx) => (
              <div
                key={idx}
                className={`bg-gradient-to-br ${t.gradient} border border-dark-600/40 rounded-xl p-7 text-left`}
              >
                <p className="text-sm text-gray-300 leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.title}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent-purple text-white text-base font-semibold rounded-lg hover:bg-accent-purple/90 transition-all"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-dark-700/50 py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="RegIntel" className="w-7 h-7 rounded-md" />
            <span className="text-sm font-semibold text-white">RegIntel</span>
          </div>
          <p className="text-xs text-gray-600">© 2024 RegIntel. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};