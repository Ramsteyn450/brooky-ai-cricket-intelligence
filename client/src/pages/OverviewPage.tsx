import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Award,
  BarChart3,
  Crown,
  Flame,
  Hash,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { KpiCard } from '../components/common/KpiCard';
import { ChartCard } from '../components/common/ChartCard';
import { EmptyFilterState } from '../components/common/EmptyFilterState';
import {
  formatAverage,
  formatShortDate,
  getFormatBadgeStyles,
  getResultBadgeStyles,
} from '../utils/formatters';
import { soundEngine } from '../utils/soundEngine';

const FORMAT_COLORS: Record<string, string> = {
  ODI: '#173F70',
  Test: '#102B50',
  T20I: '#D7193F',
};

export const OverviewPage: React.FC = () => {
  const { analytics, filteredMatches, setSelectedMatch, setActivePage, applyFilters, theme } =
    useDashboard();
  const [progressionMode, setProgressionMode] = useState<'cumulative' | 'match'>('cumulative');
  const isDark = theme === 'dark';

  if (filteredMatches.length === 0) {
    return <EmptyFilterState />;
  }

  const { kpis, byFormat, bySeason, byVenue, byOpposition, progression, latestFive } = analytics;
  const peakSeasonKey = [...bySeason].sort((a, b) => b.runs - a.runs)[0]?.key;
  const topVenues = byVenue.slice(0, 6);
  const topOppositions = byOpposition.slice(0, 6);

  const axisColor = isDark ? '#9EB2CC' : '#4B607F';
  const gridColor = isDark ? '#1D3354' : '#E3E9F2';

  return (
    <div className="space-y-6">
      {/* 8 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Runs"
          numericValue={kpis.totalRuns}
          badge={`${kpis.boundaryRunPct}% Boundaries`}
          subtitle={`${kpis.totalBalls.toLocaleString()} balls faced across ${kpis.totalMatches} innings`}
          icon={TrendingUp}
          variant="hero"
          delayIndex={0}
        />

        <KpiCard
          title="Batting Average"
          numericValue={kpis.battingAverage}
          decimals={2}
          displayText={kpis.battingAverage === null ? '—' : undefined}
          badge={`${kpis.notOuts} NO`}
          subtitle={`${kpis.dismissals} dismissals · ${kpis.fiftyPlusRate}% 50+ conversion`}
          icon={Target}
          delayIndex={1}
        />

        <KpiCard
          title="Strike Rate"
          numericValue={kpis.strikeRate}
          decimals={1}
          badge={kpis.strikeRate >= 100 ? 'Aggressive' : 'Balanced'}
          subtitle="Runs scored per 100 balls faced"
          icon={Zap}
          accent="red"
          delayIndex={2}
        />

        <KpiCard
          title="Total Matches"
          numericValue={kpis.totalMatches}
          badge={`${kpis.winRate}% Won`}
          subtitle={`${kpis.winCount}W · ${kpis.lossCount}L · ${kpis.drawCount}D · ${kpis.noResultCount}NR`}
          icon={Hash}
          delayIndex={3}
        />

        <KpiCard
          title="Centuries (100s)"
          numericValue={kpis.centuries}
          accent="red"
          badge={kpis.centuries > 0 ? 'Milestone' : undefined}
          subtitle="Innings with 100+ runs scored"
          icon={Crown}
          delayIndex={4}
        />

        <KpiCard
          title="Half Centuries (50s)"
          numericValue={kpis.halfCenturies}
          subtitle="Innings between 50 and 99 runs"
          icon={Award}
          delayIndex={5}
        />

        <KpiCard
          title="Highest Score"
          displayText={kpis.highestScore?.label ?? '—'}
          badge={kpis.highestScore?.format}
          subtitle={
            kpis.highestScore
              ? `vs ${kpis.highestScore.opposition} at ${kpis.highestScore.venue}`
              : 'No innings'
          }
          icon={Flame}
          accent="red"
          delayIndex={6}
          onClick={() => {
            if (!kpis.highestScore) return;
            const match = filteredMatches.find((m) => m.Match_ID === kpis.highestScore?.matchId);
            if (match) {
              soundEngine.play('click');
              setSelectedMatch(match);
            }
          }}
        />

        <KpiCard
          title="Total Fours & Sixes"
          numericValue={kpis.totalBoundaries}
          badge={`${kpis.boundaryRuns.toLocaleString()} Runs`}
          subtitle={`${kpis.totalFours} Fours (4s) · ${kpis.totalSixes} Sixes (6s)`}
          icon={BarChart3}
          delayIndex={7}
        />
      </div>

      {/* Row 1: Runs Progression + Runs by Format */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <ChartCard
          title="Runs Progression Over Time"
          subtitle={
            progressionMode === 'cumulative'
              ? 'Chronological cumulative run accumulation across innings'
              : 'Match-by-match runs scored ordered chronologically'
          }
          className="xl:col-span-2"
          delay={0.08}
          rightSlot={
            <div
              className={`inline-flex rounded-xl p-1 text-xs font-semibold ${
                isDark ? 'bg-[#0B1424] border border-[#1E3557]' : 'bg-[#F3F5F9] border border-[#E1E7F0]'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  soundEngine.play('click');
                  setProgressionMode('cumulative');
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  progressionMode === 'cumulative' ? 'bg-[#102B50] text-white' : 'opacity-70 hover:opacity-100'
                }`}
              >
                Cumulative
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.play('click');
                  setProgressionMode('match');
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  progressionMode === 'match' ? 'bg-[#D7193F] text-white' : 'opacity-70 hover:opacity-100'
                }`}
              >
                Per Innings
              </button>
            </div>
          }
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progression} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="brookyNavyArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#173F70" stopOpacity={0.36} />
                    <stop offset="95%" stopColor="#173F70" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="Match_Date"
                  tick={{ fontSize: 11, fill: axisColor }}
                  tickFormatter={(v: string) => v.slice(0, 4)}
                  minTickGap={28}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload;
                    return (
                      <div className="rounded-xl bg-[#102B50] text-white px-3.5 py-2.5 shadow-xl text-xs border border-[#D7193F]">
                        <p className="font-bold text-[#D7193F]">
                          {formatShortDate(p.Match_Date)} · {p.Format}
                        </p>
                        <p className="mt-0.5 font-semibold">
                          vs {p.Opposition} ({p.Venue})
                        </p>
                        <div className="mt-1.5 space-y-0.5 font-mono-num text-[11px] text-blue-100">
                          <p>Innings Score: <strong className="text-white">{p.Runs}{p.Not_Out_Flag ? '*' : ''} ({p.Balls_Faced}b)</strong></p>
                          <p>Cumulative Runs: <strong className="text-white">{p.cumulativeRuns.toLocaleString()}</strong></p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={progressionMode === 'cumulative' ? 'cumulativeRuns' : 'Runs'}
                  stroke="#102B50"
                  strokeWidth={2.5}
                  fill="url(#brookyNavyArea)"
                  activeDot={{ r: 5, fill: '#D7193F', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Runs by Format"
          subtitle="Click a format slice or row to filter"
          delay={0.12}
          rightSlot={
            <button
              type="button"
              onClick={() => setActivePage('formats')}
              className="text-xs font-semibold text-[#D7193F] hover:underline cursor-pointer"
            >
              Compare →
            </button>
          }
        >
          <div className="relative h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byFormat}
                  dataKey="runs"
                  nameKey="key"
                  innerRadius={56}
                  outerRadius={82}
                  paddingAngle={3}
                  onClick={(entry) => {
                    if (entry?.key) {
                      applyFilters({ formats: [String(entry.key)] }, false);
                    }
                  }}
                  className="cursor-pointer outline-none"
                >
                  {byFormat.map((entry, idx) => (
                    <Cell
                      key={entry.key}
                      fill={FORMAT_COLORS[entry.key] ?? (idx % 2 === 0 ? '#102B50' : '#173F70')}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value.toLocaleString()} runs`, name]}
                  contentStyle={{
                    backgroundColor: '#102B50',
                    border: '1px solid #D7193F',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#FFFFFF' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Total</span>
              <span className="text-xl font-extrabold font-mono-num">
                {kpis.totalRuns.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-2 space-y-1.5">
            {byFormat.map((f) => {
              const pct = kpis.totalRuns > 0 ? Math.round((f.runs / kpis.totalRuns) * 100) : 0;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => applyFilters({ formats: [f.key] }, false)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-[#F3F5F9] dark:hover:bg-[#173F70]/40 text-xs transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: FORMAT_COLORS[f.key] ?? '#173F70' }}
                    />
                    {f.key}
                  </span>
                  <span className="font-mono-num text-[11.5px]">
                    <strong>{f.runs.toLocaleString()}</strong> runs · {pct}% (Avg {formatAverage(f.average)})
                  </span>
                </button>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {/* Row 2: Performance by Season + Top Venues + Top Opponents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard
          title="Performance by Season"
          subtitle="England Red highlights peak scoring season"
          delay={0.14}
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySeason} margin={{ top: 8, right: 6, left: -12, bottom: 0 }}>
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
                  itemStyle={{ color: '#FFFFFF' }}
                  formatter={(value: number) => [`${value.toLocaleString()} runs`, 'Runs']}
                />
                <Bar dataKey="runs" radius={[7, 7, 0, 0]} maxBarSize={34}>
                  {bySeason.map((s) => (
                    <Cell
                      key={s.key}
                      fill={s.key === peakSeasonKey ? '#D7193F' : '#102B50'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Top Venues"
          subtitle="Highest run-scoring grounds"
          delay={0.18}
          rightSlot={
            <button
              type="button"
              onClick={() => setActivePage('venues')}
              className="text-xs font-semibold text-[#D7193F] hover:underline cursor-pointer"
            >
              All Venues →
            </button>
          }
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topVenues}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="key"
                  width={84}
                  tick={{ fontSize: 11, fill: axisColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#102B50',
                    border: '1px solid #D7193F',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#FFFFFF' }}
                  formatter={(value: number) => [`${value.toLocaleString()} runs`, 'Runs']}
                />
                <Bar dataKey="runs" radius={[0, 7, 7, 0]} maxBarSize={22}>
                  {topVenues.map((v, idx) => (
                    <Cell key={v.key} fill={idx === 0 ? '#D7193F' : '#173F70'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Top Opposition Teams"
          subtitle="Runs compiled by opponent"
          delay={0.22}
          rightSlot={
            <button
              type="button"
              onClick={() => setActivePage('opposition')}
              className="text-xs font-semibold text-[#D7193F] hover:underline cursor-pointer"
            >
              Matchups →
            </button>
          }
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topOppositions}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="key"
                  width={88}
                  tick={{ fontSize: 11, fill: axisColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#102B50',
                    border: '1px solid #D7193F',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#FFFFFF' }}
                  formatter={(value: number) => [`${value.toLocaleString()} runs`, 'Runs']}
                />
                <Bar dataKey="runs" radius={[0, 7, 7, 0]} maxBarSize={22}>
                  {topOppositions.map((o, idx) => (
                    <Cell key={o.key} fill={idx === 0 ? '#D7193F' : '#102B50'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Row 3: Recent Match Performance (Latest 5) */}
      <ChartCard
        title="Recent Match Performance (Latest 5 Innings)"
        subtitle="Chronologically sorted latest five appearances — click any card for full scorecard"
        delay={0.26}
        rightSlot={
          <button
            type="button"
            onClick={() => setActivePage('recent')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#102B50] text-white hover:bg-[#D7193F] transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Open Recent Matches
          </button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {latestFive.map((m) => (
            <button
              key={m.Match_ID}
              type="button"
              onClick={() => {
                soundEngine.play('click');
                setSelectedMatch(m);
              }}
              className={[
                'text-left rounded-xl p-3.5 border transition-all cursor-pointer hover:-translate-y-0.5',
                isDark
                  ? 'bg-[#0B1424] border-[#1E3557] hover:border-[#D7193F]'
                  : 'bg-[#F3F5F9] border-[#E1E7F0] hover:bg-white hover:border-[#173F70] hover:shadow-sm',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getFormatBadgeStyles(m.Format, isDark)}`}>
                  {m.Format}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getResultBadgeStyles(m.Match_Result, isDark)}`}>
                  {m.Match_Result}
                </span>
              </div>
              <div className="mt-2.5">
                <p className="text-xs font-bold truncate">vs {m.Opposition}</p>
                <p className="text-[10.5px] opacity-65 truncate">
                  {m.Venue} · {formatShortDate(m.Match_Date)}
                </p>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold font-mono-num">
                  {m.Runs}
                  {m.Not_Out_Flag === 1 ? '*' : ''}
                  <span className="text-xs font-normal opacity-65 ml-1">({m.Balls_Faced}b)</span>
                </span>
                <span className="text-[11px] font-mono-num font-semibold text-[#D7193F]">
                  SR {m.Strike_Rate.toFixed(1)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </ChartCard>
    </div>
  );
};
