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
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-orange-500 text-white'
          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
      }`}
    >
      {label}
    </button>
  );
};