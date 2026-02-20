import { useState } from "react";
import {
  Calculator, Scale, Briefcase, Check, ArrowRight
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";

const professions = [
  {
    id: "ca",
    title: "Chartered Accountant",
    desc: "Focus on taxation, audit compliance, and financial reporting standards.",
    icon: Calculator,
    iconBg: "bg-blue-100 text-blue-700"
  },
  {
    id: "legal",
    title: "Legal Professional",
    desc: "Focus on litigation, corporate law, and regulatory advisory services.",
    icon: Scale,
    iconBg: "bg-primary/20 text-primary"
  },
  {
    id: "cs",
    title: "Company Secretary",
    desc: "Focus on governance, secretarial standards, and compliance management.",
    icon: Briefcase,
    iconBg: "bg-indigo-100 text-indigo-700"
  },
];

export const ProfessionSelection = () => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>("legal"); // Default selected for demo per image

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 flex justify-between items-center bg-transparent">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" /></svg>
          </div>
          <span className="text-xl font-bold text-text-main">RegIntel</span>
        </Link>

        <div className="flex gap-6 text-sm font-medium text-text-muted">
          <button className="hover:text-text-main">Support</button>
          <button onClick={() => navigate('/')} className="hover:text-text-main">Sign Out</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-text-main mb-4 tracking-tight">Welcome to RegIntel.</h1>
          <p className="text-xl text-text-muted">
            Tailor your regulatory intelligence experience. Which best describes your profession?
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full mb-12">
          {professions.map((p) => {
            const isSelected = selectedId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`
                                    relative p-8 rounded-xl border cursor-pointer transition-all duration-300 h-full flex flex-col
                                    ${isSelected
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                    : "border-gray-200 bg-white hover:border-gray-300 shadow-sm"}
                                `}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 ${p.iconBg}`}>
                  <p.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-text-main mb-3">{p.title}</h3>
                <p className="text-text-muted leading-relaxed mb-4 flex-1">
                  {p.desc}
                </p>

                {isSelected && (
                  <div className="mt-auto flex items-center gap-1.5 text-xs font-bold text-primary tracking-wider uppercase">
                    Selected <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="text-center space-y-4">
          <Button
            size="lg"
            className="px-8 h-12 text-base shadow-xl shadow-primary/20"
            disabled={!selectedId}
            onClick={() => navigate('/dashboard')}
          >
            Continue to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <p className="text-xs text-text-muted">
            You can change your preference later in settings.
          </p>
        </div>
      </div>
    </div>
  );
};
