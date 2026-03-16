import React, { useState } from 'react';
import { ArrowUpRight, ChevronDown } from 'lucide-react';

export interface Publication {
  id: string;
  title: string;
  authority: string;
  description: string;
  date: string;
  type: 'Notice' | 'Circular' | 'Amendment' | 'Tender' | 'Notifications' | 'Updates' | 'Tenders';
  url: string;
}

interface CardProps {
  data: Publication;
}

export const PublicationCard: React.FC<CardProps> = ({ data }) => {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const tagColor = (type: string) => {
    switch (type) {
      case 'Circular': return 'bg-accent-purple/15 text-accent-purple';
      case 'Updates': return 'bg-accent-purple/15 text-accent-purple';
      case 'Amendment': return 'bg-accent-amber/15 text-accent-amber';
      case 'Notifications': return 'bg-accent-sky/15 text-accent-sky';
      case 'Notice': return 'bg-accent-sky/15 text-accent-sky';
      case 'Tenders': return 'bg-accent-teal/15 text-accent-teal';
      case 'Tender': return 'bg-accent-teal/15 text-accent-teal';
      default: return 'bg-dark-700 text-gray-400';
    }
  };

  return (
    <div className="bg-dark-800/60 backdrop-blur-sm border border-dark-600/40 rounded-xl p-6 hover:border-dark-400/40 hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-3">
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${tagColor(data.type)}`}>
          {data.type}
        </span>
        <span className="text-xs text-black-600">{data.date}</span>
      </div>

      <div className="flex items-start justify-between gap-1 mb-2">
        <h3 className="text-base font-medium text-black-200 leading-snug flex-1">{data.title}</h3>
        <div className="relative shrink-0 group/summary">
          <button
            type="button"
            onClick={() => setIsSummaryOpen((prev) => !prev)}
            className="w-8 h-8 rounded-full border border-accent-purple/35 bg-accent-purple/10 text-accent-purple flex items-center justify-center hover:bg-accent-purple/20 hover:scale-105 hover:shadow-sm transition-all"
            aria-label={isSummaryOpen ? 'Hide summary' : 'View summary'}
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${isSummaryOpen ? 'rotate-180' : ''}`}
            />
          </button>
          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[calc(100%+6px)] px-2 py-1 rounded-md border border-dark-600/50 bg-dark-800/95 backdrop-blur-sm text-[11px] text-black opacity-0 group-hover/summary:opacity-100 transition-opacity whitespace-nowrap shadow-sm z-10">
            View Summary
          </span>
        </div>
      </div>

      {isSummaryOpen && (
        <div className="mb-3 p-3 rounded-lg border border-dark-600/40 bg-dark-700/40">
          <p className="text-xs uppercase tracking-wider text-accent-purple font-semibold mb-1">Summary</p>
          <p className="text-sm text-gray-400 leading-relaxed">{data.description}</p>
        </div>
      )}

      <p className="text-sm text-primary/100 font-medium mb-4">{data.authority}</p>

      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-gray-400 font-medium flex items-center gap-1 group-hover:text-accent-purple transition-colors"
      >
        View Details
        <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </a>
    </div>
  );
};