import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, Flame, Layers, Target, TrendingUp } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { KpiCard } from '../components/common/KpiCard';
import { ChartCard } from '../components/common/ChartCard';
import { EmptyFilterState } from '../components/common/EmptyFilterState';
import { formatAverage } from '../utils/formatters';
import { soundEngine } from '../utils/soundEngine';

const DISMISSAL_COLORS = ['#102B50', '#D7193F', '#173F70', '#2E5D98', '#5280BA', '#82A6D2', '#B7CCE6'];

export const PerformanceAnalysisPage: React.FC = () => {
  const { analytics, filteredMatches, theme } = useDashboard();
  const [seasonMetric, setSeasonMetric] = useState<'average' | 'strikeRate'>('average');
  const isDark = theme === 'dark';

  if (filteredMatches.length === 0) return <EmptyFilterState />;

  const { kpis, bySeason, byDismissal, scoreBrackets, byInnings, progression } = analytics;
  const axisColor = isDark ? '#9EB2CC' : '#4B607F';
  const gridColor = isDark ? '#1D3354' : '#E3E9F2';

  const seasonChartData = bySeason.map((s) => ({
    ...s,
    averageVal: s.average ?? 0,
    nonBoundaryRuns: Math.max(0, s.runs - (s.fours * 4 + s.sixes * 6)),
    boundaryRuns: s.fours * 4 + s.sixes * 6,
  }));

  const boundaryVsRunning = [
    { name: 'Fours (4s)', value: kpis.totalFours * 4, count: kpis.totalFours },
    { name: 'Sixes (6s)', value: kpis.totalSixes * 6, count: kpis.totalSixes },
    {
      name: 'Running Runs (1s/2s/3s)',
      value: Math.max(0, kpis.totalRuns - kpis.boundaryRuns),
      count: 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Analytical Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Boundary Run Share"
          numericValue={kpis.boundaryRunPct}
          decimals={1}
          displayText={`${kpis.boundaryRunPct}%`}
          badge={`${kpis.boundaryRuns.toLocaleString()} Runs`}
          subtitle={`${kpis.totalFours} fours + ${kpis.totalSixes} sixes`}
          icon={Flame}
          variant="hero"
          delayIndex={0}
        />
        <KpiCard
          title="50+ Conversion Rate"
          numericValue={kpis.fiftyPlusRate}
          decimals={1}
          displayText={`${kpis.fiftyPlusRate}%`}
          badge={`${kpis.centuries + kpis.halfCenturies} Innings`}
          subtitle={`${kpis.centuries} hundreds · ${kpis.halfCenturies} fifties`}
          icon={Target}
          accent="red"
          delayIndex={1}
        />
        <KpiCard
          title="Runs Per Boundary"
          displayText={
            kpis.totalBoundaries > 0
              ? (kpis.totalRuns / kpis.totalBoundaries).toFixed(1)
              : '—'
          }
          subtitle={`${kpis.totalBoundaries} total boundaries hit`}
          icon={Activity}
          delayIndex={2}
        />
        <KpiCard
          title="Innings Split"
          displayText={`${byInnings[0]?.runs.toLocaleString() ?? 0} / ${byInnings[1]?.runs.toLocaleString() ?? 0}`}
          subtitle={`1st Inn (${byInnings[0]?.matches ?? 0}) vs 2nd Inn (${byInnings[1]?.matches ?? 0})`}
          icon={Layers}
          delayIndex={3}
        />
      </div>

      {/* Runs by Season + Composed Average/Strike Rate */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard
          title="Runs by Season & Scoring Rate Overlay"
          subtitle="Seasonal total runs alongside batting average or strike rate"
          delay={0.08}
          rightSlot={
            <div className={`inline-flex rounded-xl p-1 text-xs font-semibold ${isDark ? 'bg-[#0B1424] border border-[#1E3557]' : 'bg-[#F3F5F9] border border-[#E1E7F0]'}`}>
              <button
                type="button"
                onClick={() => {
                  soundEngine.play('click');
                  setSeasonMetric('average');
                }}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${seasonMetric === 'average' ? 'bg-[#102B50] text-white' : 'opacity-70'}`}
              >
                Avg Line
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.play('click');
                  setSeasonMetric('strikeRate');
                }}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${seasonMetric === 'strikeRate' ? 'bg-[#D7193F] text-white' : 'opacity-70'}`}
              >
                SR Line
              </button>
            </div>
          }
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={seasonChartData} margin={{ top: 10, right: 10, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="key" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
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
                <Bar yAxisId="left" dataKey="runs" name="Season Runs" fill="#102B50" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey={seasonMetric === 'average' ? 'averageVal' : 'strikeRate'}
                  name={seasonMetric === 'average' ? 'Batting Average' : 'Strike Rate'}
                  stroke="#D7193F"
                  strokeWidth={2.8}
                  dot={{ r: 4, fill: '#D7193F', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Batting Average Trends"
          subtitle="Cumulative career batting average evolution across chronological innings"
          delay={0.12}
          rightSlot={<TrendingUp className="w-4 h-4 text-[#D7193F]" />}
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progression.filter((p) => p.cumulativeAverage !== null)} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="Match_Date"
                  tickFormatter={(v: string) => v.slice(0, 4)}
                  minTickGap={30}
                  tick={{ fontSize: 11, fill: axisColor }}
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
                  formatter={(v: number) => [v.toFixed(2), 'Cumulative Avg']}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeAverage"
                  stroke="#173F70"
                  strokeWidth={2.6}
                  dot={false}
                  activeDot={{ r: 5, fill: '#D7193F', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Strike Rate Progression + Boundaries Analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard
          title="Strike Rate Progression"
          subtitle="Match-by-match scoring tempo across filtered innings"
          delay={0.16}
        >
          <div className="h-68 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progression} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="srRedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D7193F" stopOpacity={0.34} />
                    <stop offset="95%" stopColor="#D7193F" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="Match_Date"
                  tickFormatter={(v: string) => v.slice(0, 4)}
                  minTickGap={30}
                  tick={{ fontSize: 11, fill: axisColor }}
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
                  formatter={(v: number) => [v.toFixed(1), 'Strike Rate']}
                />
                <Area
                  type="monotone"
                  dataKey="Strike_Rate"
                  stroke="#D7193F"
                  strokeWidth={2.2}
                  fill="url(#srRedAreaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Boundaries Analysis (Fours vs Sixes by Season)"
          subtitle="Boundary frequency and run composition"
          delay={0.2}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            <div className="md:col-span-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seasonChartData} margin={{ top: 8, right: 6, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="key" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
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
                  <Bar dataKey="fours" name="Fours (4s)" fill="#102B50" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sixes" name="Sixes (6s)" fill="#D7193F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="md:col-span-2 flex flex-col items-center">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={boundaryVsRunning}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={38}
                      outerRadius={60}
                      paddingAngle={3}
                    >
                      <Cell fill="#102B50" />
                      <Cell fill="#D7193F" />
                      <Cell fill="#8CA8CE" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#102B50',
                        border: '1px solid #D7193F',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                      formatter={(v: number) => [`${v.toLocaleString()} runs`, 'Source']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[11px] space-y-1 w-full px-2">
                {boundaryVsRunning.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: ['#102B50', '#D7193F', '#8CA8CE'][i] }}
                      />
                      {item.name}
                    </span>
                    <span className="font-mono-num font-bold">{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Scoring Consistency (Score Brackets) + Dismissal Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard
          title="Runs Distribution & Scoring Consistency"
          subtitle="Innings distribution across run milestones"
          delay={0.24}
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBrackets} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="bracket" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#102B50',
                    border: '1px solid #D7193F',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(v: number, _name: string, item: { payload?: { runs: number; percentage: number } }) => [
                    `${v} innings (${item?.payload?.percentage ?? 0}% · ${item?.payload?.runs ?? 0} runs)`,
                    'Bracket',
                  ]}
                />
                <Bar dataKey="count" radius={[7, 7, 0, 0]} maxBarSize={48}>
                  {scoreBrackets.map((b, idx) => (
                    <Cell
                      key={b.bracket}
                      fill={idx === 3 ? '#D7193F' : idx === 2 ? '#173F70' : '#102B50'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Dismissal Pattern & Innings Split"
          subtitle="How innings end across the filtered sample"
          delay={0.28}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byDismissal}
                    dataKey="count"
                    nameKey="dismissal"
                    innerRadius={45}
                    outerRadius={76}
                    paddingAngle={2}
                  >
                    {byDismissal.map((entry, idx) => (
                      <Cell key={entry.dismissal} fill={DISMISSAL_COLORS[idx % DISMISSAL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#102B50',
                      border: '1px solid #D7193F',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(v: number, name: string) => [`${v} innings`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-xs">
              {byDismissal.map((d, idx) => (
                <div key={d.dismissal} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: DISMISSAL_COLORS[idx % DISMISSAL_COLORS.length] }}
                    />
                    {d.dismissal}
                  </span>
                  <span className="font-mono-num font-bold">
                    {d.count} <span className="font-normal opacity-65">({d.percentage}%)</span>
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-black/8 dark:border-white/10 text-[11px] opacity-75">
                1st Innings Avg: <strong>{formatAverage(byInnings[0]?.average ?? null)}</strong> · 2nd Innings Avg:{' '}
                <strong>{formatAverage(byInnings[1]?.average ?? null)}</strong>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};
