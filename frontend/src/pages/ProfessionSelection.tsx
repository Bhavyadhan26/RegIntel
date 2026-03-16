import { useState } from "react";
import {
  Calculator, Scale, Briefcase, Check, ArrowRight, ShieldCheck, Landmark
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { professionOptions } from "../lib/cbicData";

const iconById = {
  ca: Calculator,
  legal: Scale,
  'cost-accountant': Briefcase,
  'banking-finance': ShieldCheck,
  'indirect-taxes': Landmark,
};

export const ProfessionSelection = () => {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>(["legal"]);

  const toggleProfessionSelection = (id: string) => {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((selectedId) => selectedId !== id)
        : [...previous, id]
    );
  };

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 bg-transparent px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" /></svg>
          </div>
          <span className="text-xl font-bold text-text-main">RegIntel</span>
        </Link>

        <div className="flex flex-wrap gap-4 text-sm font-medium text-text-muted sm:gap-6">
          <button className="hover:text-text-main">Support</button>
          <button onClick={() => navigate('/')} className="hover:text-text-main">Sign Out</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-text-main sm:text-4xl">Welcome to RegIntel.</h1>
          <p className="text-lg text-text-muted sm:text-xl">
            Tailor your regulatory intelligence experience. Which best describes your profession?
          </p>
        </div>

        <div className="mb-12 grid w-full max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {professionOptions.map((p) => {
            const isSelected = selectedIds.includes(p.id);
            const Icon = iconById[p.id as keyof typeof iconById] ?? Briefcase;
            return (
              <div
                key={p.id}
                onClick={() => toggleProfessionSelection(p.id)}
                className={`
                                    relative p-8 rounded-xl border cursor-pointer transition-all duration-300 h-full flex flex-col
                                    ${isSelected
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                    : "border-gray-200 bg-white hover:border-gray-300 shadow-sm"}
                                `}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 ${p.iconBg}`}>
                  <Icon size={24} />
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
            disabled={selectedIds.length === 0}
            onClick={() => navigate('/dashboard', { state: { showInfo: true } })}
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
