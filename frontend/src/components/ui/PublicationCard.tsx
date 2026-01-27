import React from 'react';
import { ArrowRight } from 'lucide-react';

// Define the shape of a Publication object
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
  // Helper to color-code the tags based on type
  const getTagColor = (type: string) => {
    switch (type) {
      case 'Circular': return 'bg-purple-100 text-purple-700';
      case 'Amendment': return 'bg-yellow-100 text-yellow-700';
      case 'Notice': return 'bg-blue-100 text-blue-700';
      case 'Tender': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-slate-800 leading-tight flex-1 pr-4">
          {data.title}
        </h3>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${getTagColor(data.type)}`}>
          {data.type}
        </span>
      </div>
      
      <p className="text-sm text-orange-500 font-medium mb-3">{data.authority}</p>
      
      <p className="text-slate-600 text-sm mb-4 line-clamp-2">
        {data.description}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-xs text-slate-400">{data.date}</span>
        <button className="text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1 group">
          View Details 
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};