import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export interface Publication {
  id: string;
  title: string;
  authority: string;
  description: string;
  date: string;
  type: 'Notice' | 'Circular' | 'Amendment' | 'Tender';
}

interface CardProps {
  data: Publication;
}

export const PublicationCard: React.FC<CardProps> = ({ data }) => {
  const tagColor = (type: string) => {
    switch (type) {
      case 'Circular': return 'bg-accent-purple/15 text-accent-purple';
      case 'Amendment': return 'bg-accent-amber/15 text-accent-amber';
      case 'Notice': return 'bg-accent-sky/15 text-accent-sky';
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
        <span className="text-xs text-gray-600">{data.date}</span>
      </div>

      <h3 className="text-base font-medium text-gray-200 leading-snug mb-2">{data.title}</h3>
      <p className="text-sm text-accent-purple font-medium mb-2">{data.authority}</p>
      <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">{data.description}</p>

      <button className="text-sm text-gray-400 font-medium flex items-center gap-1 group-hover:text-accent-purple transition-colors">
        View Details
        <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </div>
  );
};