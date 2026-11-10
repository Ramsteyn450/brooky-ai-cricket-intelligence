import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDashboard } from '../context/DashboardContext';
import { ChartCard } from '../components/common/ChartCard';
import { EmptyFilterState } from '../components/common/EmptyFilterState';
import { formatAverage, getFormatBadgeStyles } from '../utils/formatters';

export const FormatAnalysisPage: React.FC = () => {
  const { analytics, filteredMatches, applyFilters, theme } = useDashboard();
  const isDark = theme === 'dark';

  const seasonByFormat = useMemo(() => {
    const formats = Array.from(new Set(filteredMatches.map((m) => m.Format))).sort();
    const seasons = Array.from(new Set(filteredMatches.map((m) => m.Season))).sort((a, b) => a - b);
    return {
      formats,
      rows: seasons.map((season) => {
        const entry: Record<string, number | string> = { season: String(season) };
        for (const fmt of formats) {
          entry[fmt] = filteredMatches
            .filter((m) => m.Season === season && m.Format === fmt)
            .reduce((sum, m) => sum + m.Runs, 0);
        }
        return entry;
      }),
    };
  }, [filteredMatches]);

  if (filteredMatches.length === 0) return <EmptyFilterState />;

  const { byFormat } = analytics;
  const formatComparison = byFormat.map((f) => ({
    format: f.key,
    runs: f.runs,
    average: f.average ?? 0,
    strikeRate: f.strikeRate,
  }));

  const axisColor = isDark ? '#9EB2CC' : '#4B607F';
  const gridColor = isDark ? '#1D3354' : '#E3E9F2';

  const formatColors: Record<string, string> = {
    Test: '#102B50',
    ODI: '#173F70',
    T20I: '#D7193F',
  };

  return (
    <div className="space-y-6">
      {/* Side-by-side Format Cards (Test / ODI / T20I) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {byFormat.map((f, idx) => (
          <motion.div
            key={f.key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, delay: idx * 0.06 }}
            onClick={() => applyFilters({ formats: [f.key] }, false)}
            className={[
              'rounded-2xl p-5 border cursor-pointer transition-all hover:-translate-y-0.5 relative overflow-hidden',
              idx === 0
                ? 'bg-[#102B50] text-white border-[#173F70] shadow-md'
                : isDark
                  ? 'bg-[#111F38] text-white border-[#1E3557] hover:border-[#D7193F]'
                  : 'bg-white text-[#102B50] border-[#E1E7F0] hover:border-[#173F70]',
            ].join(' ')}
          >
            {idx === 0 && <span className="absolute top-0 left-0 right-0 h-1 bg-[#D7193F]" />}
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${getFormatBadgeStyles(f.key, idx === 0 || isDark)}`}>
                {f.key === 'T20I' ? 'T20 / T20I' : f.key}
              </span>
              <span className={`text-xs font-mono-num font-semibold ${idx === 0 ? 'text-blue-200' : 'opacity-70'}`}>
                {f.matches} Innings
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <p className={`text-[11px] uppercase tracking-wider font-semibold ${idx === 0 ? 'text-blue-200/80' : 'opacity-65'}`}>
                  Total Runs
                </p>
                <p className="text-3xl font-extrabold font-mono-num mt-0.5">{f.runs.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className={`text-[11px] uppercase tracking-wider font-semibold ${idx === 0 ? 'text-blue-200/80' : 'opacity-65'}`}>
                  Highest Score
                </p>
                <p className={`text-2xl font-extrabold font-mono-num mt-0.5 ${idx === 0 ? 'text-[#D7193F] bg-white px-2 py-0.5 rounded-lg' : 'text-[#D7193F]'}`}>
                  {f.highestScoreLabel}
                </p>
              </div>
            </div>

            <div className={`mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-xs ${idx === 0 ? 'border-white/15' : 'border-black/8 dark:border-white/10'}`}>
              <div>
                <p className="opacity-70 text-[10.5px]">Average</p>
                <p className="font-bold font-mono-num mt-0.5">{formatAverage(f.average)}</p>
              </div>
              <div>
                <p className="opacity-70 text-[10.5px]">Strike Rate</p>
                <p className="font-bold font-mono-num mt-0.5">{f.strikeRate.toFixed(1)}</p>
              </div>
              <div>
                <p className="opacity-70 text-[10.5px]">100s / 50s</p>
                <p className="font-bold font-mono-num mt-0.5">
                  {f.centuries} / {f.halfCenturies}
                </p>
              </div>
            </div>

            <div className={`mt-3 flex items-center justify-between text-[11px] ${idx === 0 ? 'text-blue-100/80' : 'opacity-70'}`}>
              <span>Boundaries: {f.fours}×4s · {f.sixes}×6s</span>
              <span className="font-semibold">Win Rate: {f.winRate}%</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Multi-Format Comparison Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard
          title="Format Efficiency Comparison (Average vs Strike Rate)"
          subtitle="Comparing batting average and strike rate across Test, ODI, and T20I"
          delay={0.1}
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formatComparison} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="format" tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#102B50',
                    border: '1px solid #D7193F',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="average" name="Batting Average" fill="#102B50" radius={[6, 6, 0, 0]} maxBarSize={42} />
                <Bar dataKey="strikeRate" name="Strike Rate" fill="#D7193F" radius={[6, 6, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Season-by-Format Runs Breakdown"
          subtitle="Annual scoring contribution across formats"
          delay={0.14}
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seasonByFormat.rows} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="season" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#102B50',
                    border: '1px solid #D7193F',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {seasonByFormat.formats.map((fmt, idx) => (
                  <Bar
                    key={fmt}
                    dataKey={fmt}
                    stackId="formatRuns"
                    fill={formatColors[fmt] ?? (idx % 2 === 0 ? '#102B50' : '#173F70')}
                    radius={idx === seasonByFormat.formats.length - 1 ? [5, 5, 0, 0] : [0, 0, 0, 0]}
                    maxBarSize={36}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};
