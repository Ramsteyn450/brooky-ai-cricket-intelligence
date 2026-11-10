import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

interface AnimatedNumberProps {
  value: number | null;
  decimals?: number;
  suffix?: string;
  fallback?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 0,
  suffix = '',
  fallback = '—',
}) => {
  const [display, setDisplay] = useState<number>(value ?? 0);
  const prevRef = useRef<number>(value ?? 0);

  useEffect(() => {
    if (value === null) return;
    const startVal = prevRef.current;
    const endVal = value;
    if (startVal === endVal) {
      setDisplay(endVal);
      return;
    }

    let rafId = 0;
    const duration = 520;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * eased;
      setDisplay(current);
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        prevRef.current = endVal;
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  if (value === null) return <span>{fallback}</span>;

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toLocaleString('en-US');

  return (
    <span>
      {formatted}
      {suffix}
    </span>
  );
};

interface KpiCardProps {
  title: string;
  numericValue?: number | null;
  decimals?: number;
  displayText?: string;
  subtitle: string;
  badge?: string;
  icon: LucideIcon;
  variant?: 'hero' | 'default';
  accent?: 'navy' | 'red' | 'blue';
  delayIndex?: number;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  numericValue,
  decimals = 0,
  displayText,
  subtitle,
  badge,
  icon: Icon,
  variant = 'default',
  accent = 'navy',
  delayIndex = 0,
  onClick,
}) => {
  const { theme } = useDashboard();
  const isDark = theme === 'dark';
  const isHero = variant === 'hero';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: delayIndex * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      onClick={onClick}
      className={[
        'relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-200',
        onClick ? 'cursor-pointer' : '',
        isHero
          ? 'bg-[#102B50] text-white border border-[#173F70] shadow-md shadow-[#102B50]/20'
          : isDark
            ? 'bg-[#111F38] text-white border border-[#1E3557] hover:border-[#D7193F]/70'
            : 'bg-white text-[#102B50] border border-[#E1E7F0] shadow-[0_2px_10px_rgba(16,43,80,0.04)] hover:border-[#173F70]/50 hover:shadow-[0_8px_22px_rgba(16,43,80,0.09)]',
      ].join(' ')}
    >
      {/* Subtle red accent top bar on hero card */}
      {isHero && <span className="absolute top-0 left-0 right-0 h-1 bg-[#D7193F]" />}

      {isHero && (
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.14] pointer-events-none"
          viewBox="0 0 320 180"
          fill="none"
          preserveAspectRatio="none"
        >
          <path d="M-20 130 C 60 80, 140 160, 220 90 C 270 45, 310 75, 340 40" stroke="#D7193F" strokeWidth="1.6" />
          <path d="M-20 155 C 75 105, 160 175, 240 115 C 285 80, 315 100, 340 70" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx="275" cy="35" r="55" stroke="#FFFFFF" strokeWidth="0.9" />
        </svg>
      )}

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={[
              'text-xs font-semibold uppercase tracking-wider',
              isHero ? 'text-blue-100/90' : isDark ? 'text-blue-200/75' : 'text-[#4B607F]',
            ].join(' ')}
          >
            {title}
          </p>
        </div>

        <div
          className={[
            'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center',
            isHero
              ? 'bg-white/12 text-[#FFFFFF] border border-white/15'
              : accent === 'red'
                ? isDark
                  ? 'bg-[#D7193F]/20 text-rose-300'
                  : 'bg-[#D7193F]/10 text-[#D7193F]'
                : isDark
                  ? 'bg-[#173F70]/50 text-blue-200'
                  : 'bg-[#102B50]/8 text-[#102B50]',
          ].join(' ')}
        >
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>

      <div className="relative z-10 mt-3 flex items-baseline gap-2.5 flex-wrap">
        <div className="text-2xl sm:text-[28px] font-bold tracking-tight font-mono-num leading-none">
          {displayText !== undefined ? (
            <span>{displayText}</span>
          ) : (
            <AnimatedNumber value={numericValue ?? null} decimals={decimals} />
          )}
        </div>
        {badge && (
          <span
            className={[
              'text-[11px] font-semibold px-2 py-0.5 rounded-full font-mono-num',
              isHero
                ? 'bg-[#D7193F] text-white'
                : accent === 'red'
                  ? isDark
                    ? 'bg-[#D7193F]/25 text-rose-200'
                    : 'bg-[#D7193F]/12 text-[#D7193F]'
                  : isDark
                    ? 'bg-[#173F70] text-blue-100'
                    : 'bg-[#102B50]/10 text-[#102B50]',
            ].join(' ')}
          >
            {badge}
          </span>
        )}
      </div>

      <p
        className={[
          'relative z-10 mt-2.5 text-xs truncate',
          isHero ? 'text-blue-100/80' : isDark ? 'text-slate-400' : 'text-[#5E7290]',
        ].join(' ')}
      >
        {subtitle}
      </p>
    </motion.div>
  );
};
