import React from 'react';
import { motion } from 'framer-motion';
import { useDashboard } from '../../context/DashboardContext';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  rightSlot,
  children,
  className = '',
  delay = 0,
}) => {
  const { theme } = useDashboard();
  const isDark = theme === 'dark';

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay, ease: [0.22, 1, 0.36, 1] }}
      className={[
        'rounded-2xl p-5 transition-colors',
        isDark
          ? 'bg-[#111F38] border border-[#1E3557] text-white'
          : 'bg-white border border-[#E1E7F0] text-[#102B50] shadow-[0_2px_10px_rgba(16,43,80,0.03)]',
        className,
      ].join(' ')}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-[15px] sm:text-base font-bold tracking-tight">{title}</h3>
          {subtitle && (
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#5E7290]'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>
      <div>{children}</div>
    </motion.section>
  );
};
