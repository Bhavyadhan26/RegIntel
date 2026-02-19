import React from 'react';

interface FilterButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export const FilterButton: React.FC<FilterButtonProps> = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${active
          ? 'bg-accent-purple text-white'
          : 'bg-dark-800 text-gray-400 border border-dark-600/40 hover:bg-dark-700 hover:text-gray-300'
        }`}
    >
      {label}
    </button>
  );
};