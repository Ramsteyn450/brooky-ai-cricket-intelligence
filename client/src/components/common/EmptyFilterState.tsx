import React from 'react';
import { FilterX, RotateCcw } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export const EmptyFilterState: React.FC<{ message?: string }> = ({
  message = 'No innings match the current combination of filters.',
}) => {
  const { clearFilters, theme } = useDashboard();
  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-2xl border p-10 text-center flex flex-col items-center justify-center ${
        isDark
          ? 'bg-[#111F38] border-[#1E3557] text-white'
          : 'bg-white border-[#E1E7F0] text-[#102B50]'
      }`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#D7193F]/10 text-[#D7193F] flex items-center justify-center mb-3">
        <FilterX className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold">No Matching Innings</h3>
      <p className="text-xs opacity-70 mt-1 max-w-md">{message}</p>
      <button
        type="button"
        onClick={clearFilters}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#102B50] hover:bg-[#173F70] text-white text-xs font-bold transition-colors cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5 text-[#D7193F]" />
        Reset All Filters
      </button>
    </div>
  );
};
