import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Award, Flame, MapPin, TrendingUp } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { KpiCard } from '../components/common/KpiCard';
import { ChartCard } from '../components/common/ChartCard';
import { EmptyFilterState } from '../components/common/EmptyFilterState';
import { formatAverage } from '../utils/formatters';

export const VenueAnalysisPage: React.FC = () => {
  const { analytics, filteredMatches, applyFilters, theme } = useDashboard();
  const isDark = theme === 'dark';

  if (filteredMatches.length === 0) return <EmptyFilterState />;

  const { byVenue } = analytics;
  const mostRunsVenue = byVenue[0];
  const bestAvgVenue = [...byVenue]
    .filter((v) => v.average !== null)
    .sort((a, b) => (b.average ?? 0) - (a.average ?? 0))[0];
  const highestScoreVenue = [...byVenue].sort((a, b) => b.highestScore - a.highestScore)[0];

  const avgChartData = [...byVenue]
    .filter((v) => v.average !== null)
    .sort((a, b) => (b.average ?? 0) - (a.average ?? 0))
    .map((v) => ({ ...v, averageVal: v.average ?? 0 }));

  const axisColor = isDark ? '#9EB2CC' : '#4B607F';
  const gridColor = isDark ? '#1D3354' : '#E3E9F2';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Most Prolific Venue"
          displayText={mostRunsVenue?.key ?? '—'}
          badge={`${mostRunsVenue?.runs.toLocaleString() ?? 0} Runs`}
          subtitle={`${mostRunsVenue?.matches ?? 0} innings · Avg ${formatAverage(mostRunsVenue?.average ?? null)}`}
          icon={MapPin}
          variant="hero"
          delayIndex={0}
        />
        <KpiCard
          title="Highest Venue Average"
          displayText={bestAvgVenue?.key ?? '—'}
          badge={bestAvgVenue ? `Avg ${formatAverage(bestAvgVenue.average)}` : undefined}
          subtitle={`${bestAvgVenue?.runs.toLocaleString() ?? 0} runs in ${bestAvgVenue?.matches ?? 0} innings`}
          icon={TrendingUp}
          accent="red"
          delayIndex={1}
        />
        <KpiCard
          title="Highest Score Venue"
          displayText={highestScoreVenue?.key ?? '—'}
          badge={highestScoreVenue ? `HS ${highestScoreVenue.highestScoreLabel}` : undefined}
          subtitle={`Strike Rate ${highestScoreVenue?.strikeRate.toFixed(1) ?? '0.0'}`}
          icon={Flame}
          delayIndex={2}
        />
        <KpiCard
          title="Active Venues"
          numericValue={byVenue.length}
          subtitle="Grounds represented in selection"
          icon={Award}
          delayIndex={3}
        />
      </div>

      {/* Runs by Venue & Average by Venue */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard
          title="Runs by Venue"
          subtitle="Total runs scored across cricket grounds"
          delay={0.08}
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byVenue} layout="vertical" margin={{ top: 4, right: 18, left: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="key" width={90} tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#102B50',
                    border: '1px solid #D7193F',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#FFFFFF' }}
                  formatter={(v: number) => [`${v.toLocaleString()} runs`, 'Runs']}
                />
                <Bar dataKey="runs" radius={[0, 7, 7, 0]} maxBarSize={22}>
                  {byVenue.map((v, idx) => (
                    <Cell key={v.key} fill={idx === 0 ? '#D7193F' : '#102B50'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Batting Average by Venue"
          subtitle="Average runs per dismissal at each ground"
          delay={0.12}
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgChartData} margin={{ top: 8, right: 10, left: -12, bottom: 18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="key"
                  tick={{ fontSize: 10.5, fill: axisColor }}
                  angle={-22}
                  textAnchor="end"
                  interval={0}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#102B50',
                    border: '1px solid #D7193F',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#FFFFFF' }}
                  formatter={(v: number) => [v.toFixed(2), 'Average']}
                />
                <Bar dataKey="averageVal" radius={[6, 6, 0, 0]} maxBarSize={32}>
                  {avgChartData.map((v, idx) => (
                    <Cell key={v.key} fill={idx === 0 ? '#D7193F' : '#173F70'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Highest Score by Venue & Venue Matches Count */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard
          title="Highest Score & Matches Played by Venue"
          subtitle="Peak innings score at each ground"
          delay={0.16}
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byVenue} margin={{ top: 8, right: 10, left: -12, bottom: 18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="key"
                  tick={{ fontSize: 10.5, fill: axisColor }}
                  angle={-22}
                  textAnchor="end"
                  interval={0}
                  axisLine={false}
                  tickLine={false}
                />
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
                <Bar dataKey="highestScore" name="Highest Score" fill="#102B50" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="matches" name="Matches" fill="#D7193F" radius={[6, 6, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Venue Performance Matrix"
          subtitle="Click any venue row to focus dashboard filters on that ground"
          delay={0.2}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b text-[11px] uppercase tracking-wider ${isDark ? 'border-[#1E3557] text-blue-200/75' : 'border-[#E1E7F0] text-[#4B607F]'}`}>
                  <th className="py-2.5 px-2 font-bold">Venue</th>
                  <th className="py-2.5 px-2 font-bold text-right">Matches</th>
                  <th className="py-2.5 px-2 font-bold text-right">Runs</th>
                  <th className="py-2.5 px-2 font-bold text-right">Avg</th>
                  <th className="py-2.5 px-2 font-bold text-right">SR</th>
                  <th className="py-2.5 px-2 font-bold text-right">HS</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1A2E4D]' : 'divide-[#EDF1F7]'}`}>
                {byVenue.map((v) => (
                  <tr
                    key={v.key}
                    onClick={() => applyFilters({ venues: [v.key] }, false)}
                    className="hover:bg-[#102B50]/6 dark:hover:bg-[#173F70]/35 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-2 font-bold">{v.key}</td>
                    <td className="py-2.5 px-2 text-right font-mono-num">{v.matches}</td>
                    <td className="py-2.5 px-2 text-right font-mono-num font-bold text-[#173F70] dark:text-blue-300">{v.runs.toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-right font-mono-num">{formatAverage(v.average)}</td>
                    <td className="py-2.5 px-2 text-right font-mono-num">{v.strikeRate.toFixed(1)}</td>
                    <td className="py-2.5 px-2 text-right font-mono-num font-semibold text-[#D7193F]">{v.highestScoreLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};
