import React from 'react';
import { useDashboard } from '../../context/DashboardContext';

export const DashboardSkeleton: React.FC = () => {
  const { theme } = useDashboard();
  const isDark = theme === 'dark';
  const block = isDark ? 'bg-[#173F70]/45' : 'bg-[#E3E9F2]';
  const card = isDark ? 'bg-[#111F38] border-[#1E3557]' : 'bg-white border-[#E1E7F0]';

  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className={`rounded-2xl p-5 border ${card}`}>
            <div className={`h-3 w-24 rounded ${block}`} />
            <div className={`h-8 w-28 rounded mt-4 ${block}`} />
            <div className={`h-2.5 w-36 rounded mt-3 ${block}`} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className={`xl:col-span-2 rounded-2xl p-5 border h-80 ${card}`}>
          <div className={`h-4 w-48 rounded ${block}`} />
          <div className={`h-56 w-full rounded-xl mt-5 ${block}`} />
        </div>
        <div className={`rounded-2xl p-5 border h-80 ${card}`}>
          <div className={`h-4 w-36 rounded ${block}`} />
          <div className={`h-56 w-full rounded-xl mt-5 ${block}`} />
        </div>
      </div>
    </div>
  );
};
