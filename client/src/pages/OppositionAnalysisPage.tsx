import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Crown, Shield, Swords, Zap } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { KpiCard } from '../components/common/KpiCard';
import { ChartCard } from '../components/common/ChartCard';
import { EmptyFilterState } from '../components/common/EmptyFilterState';
import { formatAverage } from '../utils/formatters';

export const OppositionAnalysisPage: React.FC = () => {
  const { analytics, filteredMatches, applyFilters, theme } = useDashboard();
  const isDark = theme === 'dark';

  if (filteredMatches.length === 0) return <EmptyFilterState />;

  const { byOpposition } = analytics;
  const topRunsOpp = byOpposition[0];
  const bestAvgOpp = [...byOpposition]
    .filter((o) => o.average !== null)
    .sort((a, b) => (b.average ?? 0) - (a.average ?? 0))[0];
  const fastestSrOpp = [...byOpposition].sort((a, b) => b.strikeRate - a.strikeRate)[0];
  const bestWinOpp = [...byOpposition].sort((a, b) => b.winRate - a.winRate)[0];

  const chartData = byOpposition.map((o) => ({
    ...o,
    averageVal: o.average ?? 0,
  }));

  const axisColor = isDark ? '#9EB2CC' : '#4B607F';
  const gridColor = isDark ? '#1D3354' : '#E3E9F2';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Best Opposition (Runs)"
          displayText={topRunsOpp?.key ?? '—'}
          badge={`${topRunsOpp?.runs.toLocaleString() ?? 0} Runs`}
          subtitle={`${topRunsOpp?.matches ?? 0} innings · Avg ${formatAverage(topRunsOpp?.average ?? null)}`}
          icon={Swords}
          variant="hero"
          delayIndex={0}
        />
        <KpiCard
          title="Best Opposition (Avg)"
          displayText={bestAvgOpp?.key ?? '—'}
          badge={bestAvgOpp ? `Avg ${formatAverage(bestAvgOpp.average)}` : undefined}
          subtitle={`${bestAvgOpp?.runs.toLocaleString() ?? 0} runs · HS ${bestAvgOpp?.highestScoreLabel ?? '—'}`}
          icon={Crown}
          accent="red"
          delayIndex={1}
        />
        <KpiCard
          title="Highest Strike Rate vs"
          displayText={fastestSrOpp?.key ?? '—'}
          badge={fastestSrOpp ? `SR ${fastestSrOpp.strikeRate.toFixed(1)}` : undefined}
          subtitle={`${fastestSrOpp?.fours ?? 0}×4s · ${fastestSrOpp?.sixes ?? 0}×6s`}
          icon={Zap}
          delayIndex={2}
        />
        <KpiCard
          title="Highest Win Rate vs"
          displayText={bestWinOpp?.key ?? '—'}
          badge={bestWinOpp ? `${bestWinOpp.winRate}% Won` : undefined}
          subtitle={`${bestWinOpp?.wins ?? 0} wins in ${bestWinOpp?.matches ?? 0} innings`}
          icon={Shield}
          delayIndex={3}
        />
      </div>

      {/* Runs vs Opposition & Average vs Strike Rate Comparison */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard
          title="Runs Against Each Opponent"
          subtitle="Total runs compiled across international opponents"
          delay={0.08}
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="key" width={92} tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
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
                  {chartData.map((o, idx) => (
                    <Cell key={o.key} fill={idx === 0 ? '#D7193F' : '#102B50'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Average & Strike Rate Against Opponents"
          subtitle="Side-by-side efficiency metrics per opponent"
          delay={0.12}
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 10, left: -12, bottom: 18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="key"
                  tick={{ fontSize: 10.5, fill: axisColor }}
                  angle={-20}
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
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="averageVal" name="Batting Average" fill="#173F70" radius={[5, 5, 0, 0]} maxBarSize={24} />
                <Bar dataKey="strikeRate" name="Strike Rate" fill="#D7193F" radius={[5, 5, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Opposition Matrix Table */}
      <ChartCard
        title="Head-to-Head Opposition Breakdown"
        subtitle="Click any opponent row to apply a quick opposition filter"
        delay={0.16}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b text-[11px] uppercase tracking-wider ${isDark ? 'border-[#1E3557] text-blue-200/75' : 'border-[#E1E7F0] text-[#4B607F]'}`}>
                <th className="py-3 px-2.5 font-bold">Opposition</th>
                <th className="py-3 px-2.5 font-bold text-right">Innings</th>
                <th className="py-3 px-2.5 font-bold text-right">Runs</th>
                <th className="py-3 px-2.5 font-bold text-right">Average</th>
                <th className="py-3 px-2.5 font-bold text-right">Strike Rate</th>
                <th className="py-3 px-2.5 font-bold text-right">HS</th>
                <th className="py-3 px-2.5 font-bold text-right">100s / 50s</th>
                <th className="py-3 px-2.5 font-bold text-right">4s / 6s</th>
                <th className="py-3 px-2.5 font-bold text-right">Win %</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#1A2E4D]' : 'divide-[#EDF1F7]'}`}>
              {byOpposition.map((o) => (
                <tr
                  key={o.key}
                  onClick={() => applyFilters({ oppositions: [o.key] }, false)}
                  className="hover:bg-[#102B50]/6 dark:hover:bg-[#173F70]/35 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-2.5 font-bold">{o.key}</td>
                  <td className="py-2.5 px-2.5 text-right font-mono-num">{o.matches}</td>
                  <td className="py-2.5 px-2.5 text-right font-mono-num font-bold text-[#173F70] dark:text-blue-300">
                    {o.runs.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono-num">{formatAverage(o.average)}</td>
                  <td className="py-2.5 px-2.5 text-right font-mono-num">{o.strikeRate.toFixed(1)}</td>
                  <td className="py-2.5 px-2.5 text-right font-mono-num font-semibold text-[#D7193F]">{o.highestScoreLabel}</td>
                  <td className="py-2.5 px-2.5 text-right font-mono-num">
                    {o.centuries} / {o.halfCenturies}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono-num">
                    {o.fours} / {o.sixes}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono-num font-semibold">{o.winRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
};
