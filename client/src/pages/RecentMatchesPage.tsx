import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
import { Calendar, Clock, History, MapPin } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { ChartCard } from '../components/common/ChartCard';
import { EmptyFilterState } from '../components/common/EmptyFilterState';
import { sortMatchesByDateDesc } from '../utils/analytics';
import {
  formatShortDate,
  getFormatBadgeStyles,
  getResultBadgeStyles,
} from '../utils/formatters';
import { soundEngine } from '../utils/soundEngine';

export const RecentMatchesPage: React.FC = () => {
  const { analytics, filteredMatches, setSelectedMatch, theme } = useDashboard();
  const [showFullHistory, setShowFullHistory] = useState(false);
  const isDark = theme === 'dark';

  if (filteredMatches.length === 0) return <EmptyFilterState />;

  const latestFive = analytics.latestFive;
  const allSortedDesc = sortMatchesByDateDesc(filteredMatches);
  const displayedMatches = showFullHistory ? allSortedDesc : latestFive;

  const axisColor = isDark ? '#9EB2CC' : '#4B607F';
  const gridColor = isDark ? '#1D3354' : '#E3E9F2';

  const formChartData = [...latestFive]
    .reverse()
    .map((m) => ({
      name: `${m.Opposition.slice(0, 3).toUpperCase()} (${m.Match_Date.slice(5)})`,
      Runs: m.Runs,
      StrikeRate: m.Strike_Rate,
      Format: m.Format,
      Match_ID: m.Match_ID,
    }));

  const recentRunsTotal = latestFive.reduce((sum, m) => sum + m.Runs, 0);

  return (
    <div className="space-y-6">
      {/* Header Toggle Banner */}
      <div
        className={`rounded-2xl p-4 sm:p-5 border flex flex-wrap items-center justify-between gap-4 ${
          isDark ? 'bg-[#111F38] border-[#1E3557]' : 'bg-white border-[#E1E7F0]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#102B50] text-white border border-[#D7193F] flex items-center justify-center shrink-0">
            {showFullHistory ? <History className="w-5 h-5 text-[#D7193F]" /> : <Clock className="w-5 h-5 text-[#D7193F]" />}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold">
              {showFullHistory
                ? `Complete Match History (${allSortedDesc.length} Innings)`
                : `Latest Five Matches (${latestFive.length} Shown · ${recentRunsTotal} Runs)`}
            </h3>
            <p className="text-xs opacity-70">
              Sorted strictly by match date descending from most recent appearance
            </p>
          </div>
        </div>

        <div
          className={`inline-flex rounded-xl p-1 text-xs font-semibold ${
            isDark ? 'bg-[#0B1424] border border-[#1E3557]' : 'bg-[#F3F5F9] border border-[#E1E7F0]'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              soundEngine.play('click');
              setShowFullHistory(false);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              !showFullHistory ? 'bg-[#102B50] text-white' : 'opacity-75 hover:opacity-100'
            }`}
          >
            Latest 5 Matches
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.play('click');
              setShowFullHistory(true);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              showFullHistory ? 'bg-[#D7193F] text-white' : 'opacity-75 hover:opacity-100'
            }`}
          >
            Complete Match History ({allSortedDesc.length})
          </button>
        </div>
      </div>

      {/* Default View: Latest 5 Form Chart + Featured Cards */}
      {!showFullHistory ? (
        <>
          <ChartCard
            title="Recent 5 Innings Form Trajectory"
            subtitle="Ordered left-to-right from 5th most recent to latest match"
          >
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formChartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
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
                  />
                  <Bar dataKey="Runs" radius={[7, 7, 0, 0]} maxBarSize={44}>
                    {formChartData.map((entry) => (
                      <Cell
                        key={entry.Match_ID}
                        fill={entry.Runs >= 100 ? '#D7193F' : entry.Runs >= 50 ? '#173F70' : '#102B50'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {latestFive.map((m, idx) => (
              <motion.div
                key={m.Match_ID}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  soundEngine.play('click');
                  setSelectedMatch(m);
                }}
                className={[
                  'rounded-2xl p-4 border cursor-pointer transition-all hover:-translate-y-1 relative overflow-hidden',
                  idx === 0
                    ? 'bg-[#102B50] text-white border-[#173F70] shadow-md'
                    : isDark
                      ? 'bg-[#111F38] border-[#1E3557] hover:border-[#D7193F]'
                      : 'bg-white border-[#E1E7F0] hover:border-[#173F70] shadow-2xs',
                ].join(' ')}
              >
                {idx === 0 && <span className="absolute top-0 left-0 right-0 h-1 bg-[#D7193F]" />}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${getFormatBadgeStyles(m.Format, idx === 0 || isDark)}`}>
                    {m.Format}
                  </span>
                  <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                    idx === 0
                      ? 'bg-[#D7193F] text-white'
                      : getResultBadgeStyles(m.Match_Result, isDark)
                  }`}>
                    {m.Match_Result}
                  </span>
                </div>

                <div className="mt-3">
                  <p className={`text-[11px] font-mono-num ${idx === 0 ? 'text-blue-200' : 'opacity-65'}`}>
                    {idx === 0 ? 'LATEST MATCH · ' : `#${idx + 1} · `}
                    {m.Match_ID}
                  </p>
                  <h4 className="text-base font-bold mt-1">vs {m.Opposition}</h4>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono-num">
                    {m.Runs}
                    {m.Not_Out_Flag === 1 ? '*' : ''}
                  </span>
                  <span className={`text-xs ${idx === 0 ? 'text-blue-200' : 'opacity-70'}`}>
                    ({m.Balls_Faced} balls)
                  </span>
                </div>

                <div className={`mt-3 pt-3 border-t text-[11px] space-y-1 ${idx === 0 ? 'border-white/15 text-blue-100/85' : 'border-black/8 dark:border-white/10 opacity-80'}`}>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    {formatShortDate(m.Match_Date)}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {m.Venue} ({m.Innings === 1 ? '1st' : '2nd'} Inn)
                  </p>
                  <p className="font-mono-num font-semibold">
                    {m.Fours}×4s · {m.Sixes}×6s · SR {m.Strike_Rate.toFixed(1)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <ChartCard
          title="Complete Match History"
          subtitle={`All ${displayedMatches.length} filtered innings ordered most recent first — click any row for full scorecard`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b text-[11px] uppercase tracking-wider ${isDark ? 'border-[#1E3557] text-blue-200/75' : 'border-[#E1E7F0] text-[#4B607F]'}`}>
                  <th className="py-3 px-2.5 font-bold">Date</th>
                  <th className="py-3 px-2.5 font-bold">Match ID</th>
                  <th className="py-3 px-2.5 font-bold">Format</th>
                  <th className="py-3 px-2.5 font-bold">Opposition</th>
                  <th className="py-3 px-2.5 font-bold">Venue</th>
                  <th className="py-3 px-2.5 font-bold text-right">Runs</th>
                  <th className="py-3 px-2.5 font-bold text-right">Balls</th>
                  <th className="py-3 px-2.5 font-bold text-right">4s / 6s</th>
                  <th className="py-3 px-2.5 font-bold text-right">SR</th>
                  <th className="py-3 px-2.5 font-bold">Dismissal</th>
                  <th className="py-3 px-2.5 font-bold">Result</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1A2E4D]' : 'divide-[#EDF1F7]'}`}>
                {displayedMatches.map((m) => (
                  <tr
                    key={m.Match_ID}
                    onClick={() => {
                      soundEngine.play('click');
                      setSelectedMatch(m);
                    }}
                    className="hover:bg-[#102B50]/6 dark:hover:bg-[#173F70]/35 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-2.5 whitespace-nowrap font-medium">{formatShortDate(m.Match_Date)}</td>
                    <td className="py-2.5 px-2.5 font-mono-num text-[#173F70] dark:text-blue-300 font-semibold">{m.Match_ID}</td>
                    <td className="py-2.5 px-2.5">
                      <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-semibold ${getFormatBadgeStyles(m.Format, isDark)}`}>
                        {m.Format}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 font-semibold">{m.Opposition}</td>
                    <td className="py-2.5 px-2.5">{m.Venue}</td>
                    <td className="py-2.5 px-2.5 text-right font-mono-num font-bold">
                      {m.Runs}
                      {m.Not_Out_Flag === 1 ? '*' : ''}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono-num opacity-80">{m.Balls_Faced}</td>
                    <td className="py-2.5 px-2.5 text-right font-mono-num">
                      {m.Fours} / {m.Sixes}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono-num">{m.Strike_Rate.toFixed(1)}</td>
                    <td className="py-2.5 px-2.5 opacity-80">{m.Dismissal}</td>
                    <td className="py-2.5 px-2.5">
                      <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-semibold ${getResultBadgeStyles(m.Match_Result, isDark)}`}>
                        {m.Match_Result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}
    </div>
  );
};
