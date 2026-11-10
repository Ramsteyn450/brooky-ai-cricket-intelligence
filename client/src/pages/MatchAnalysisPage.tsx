import React, { useMemo, useState } from 'react';
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
import { ArrowUpDown, Search } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { ChartCard } from '../components/common/ChartCard';
import { EmptyFilterState } from '../components/common/EmptyFilterState';
import {
  formatAverage,
  formatShortDate,
  getFormatBadgeStyles,
  getResultBadgeStyles,
} from '../utils/formatters';
import { soundEngine } from '../utils/soundEngine';
import type { MatchRecord } from '../types/cricket';

type SortField = 'Match_Date' | 'Runs' | 'Balls_Faced' | 'Fours' | 'Sixes' | 'Strike_Rate';

export const MatchAnalysisPage: React.FC = () => {
  const { analytics, filteredMatches, setSelectedMatch, theme } = useDashboard();
  const [tableSearch, setTableSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('Match_Date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const isDark = theme === 'dark';

  const sortedRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    const searched = q
      ? filteredMatches.filter(
          (m) =>
            m.Match_ID.toLowerCase().includes(q) ||
            m.Opposition.toLowerCase().includes(q) ||
            m.Venue.toLowerCase().includes(q) ||
            m.Format.toLowerCase().includes(q) ||
            m.Dismissal.toLowerCase().includes(q),
        )
      : filteredMatches;

    return [...searched].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'Match_Date') {
        cmp = a.Match_Date.localeCompare(b.Match_Date);
        if (cmp === 0) cmp = a.Match_ID.localeCompare(b.Match_ID);
      } else {
        cmp = (a[sortField] as number) - (b[sortField] as number);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredMatches, sortDir, sortField, tableSearch]);

  if (filteredMatches.length === 0) return <EmptyFilterState />;

  const handleSort = (field: SortField) => {
    soundEngine.play('click');
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const { kpis, progression } = analytics;
  const axisColor = isDark ? '#9EB2CC' : '#4B607F';
  const gridColor = isDark ? '#1D3354' : '#E3E9F2';

  const onBarClick = (data: unknown) => {
    const payload = (data as { payload?: MatchRecord })?.payload ?? (data as MatchRecord);
    if (!payload?.Match_ID) return;
    const match = filteredMatches.find((m) => m.Match_ID === payload.Match_ID);
    if (match) {
      soundEngine.play('click');
      setSelectedMatch(match);
    }
  };

  return (
    <div className="space-y-6">
      {/* Compact Filtered Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Innings', value: String(kpis.totalMatches) },
          { label: 'Total Runs', value: kpis.totalRuns.toLocaleString() },
          { label: 'Average', value: formatAverage(kpis.battingAverage) },
          { label: 'Strike Rate', value: kpis.strikeRate.toFixed(1) },
          { label: 'Fours / Sixes', value: `${kpis.totalFours} / ${kpis.totalSixes}` },
          { label: 'Highest Score', value: kpis.highestScore?.label ?? '—' },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-xl px-4 py-3 border ${
              isDark ? 'bg-[#111F38] border-[#1E3557]' : 'bg-white border-[#E1E7F0]'
            }`}
          >
            <p className="text-[10.5px] uppercase tracking-wider opacity-65 font-bold">{item.label}</p>
            <p className="text-lg font-extrabold font-mono-num mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Match-by-Match Visual Timeline */}
      <ChartCard
        title="Innings-by-Innings Scoring Bars"
        subtitle="Red bars represent 100+ centuries, Secondary Blue bars represent 50–99 half-centuries — click any bar to inspect scorecard"
      >
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={progression} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="Match_Date"
                tickFormatter={(v: string) => v.slice(2, 7)}
                minTickGap={22}
                tick={{ fontSize: 10, fill: axisColor }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload;
                  return (
                    <div className="rounded-xl bg-[#102B50] text-white px-3 py-2 text-xs shadow-xl border border-[#D7193F]">
                      <p className="font-bold text-[#D7193F]">
                        {p.Match_ID} · {formatShortDate(p.Match_Date)}
                      </p>
                      <p>
                        {p.Format} vs {p.Opposition} ({p.Venue})
                      </p>
                      <p className="mt-1 font-mono-num">
                        Runs: <strong>{p.Runs}{p.Not_Out_Flag ? '*' : ''}</strong> ({p.Balls_Faced}b) · SR {p.Strike_Rate}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="Runs" radius={[4, 4, 0, 0]} maxBarSize={18} onClick={onBarClick} className="cursor-pointer">
                {progression.map((entry) => (
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

      {/* Complete Match Ledger Table */}
      <ChartCard
        title="Match-by-Match Ledger"
        subtitle={`Showing ${sortedRows.length} innings — click any row to inspect complete scorecard`}
        rightSlot={
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
              isDark ? 'bg-[#0B1424] border-[#1E3557]' : 'bg-[#F3F5F9] border-[#E1E7F0]'
            }`}
          >
            <Search className="w-3.5 h-3.5 opacity-60" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Filter ledger (ID, team, venue)..."
              className="bg-transparent outline-none w-44 sm:w-56"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className={`border-b text-[11px] uppercase tracking-wider ${
                  isDark ? 'border-[#1E3557] text-blue-200/75' : 'border-[#E1E7F0] text-[#4B607F]'
                }`}
              >
                <th className="py-3 px-2.5 font-bold">Match ID</th>
                <th className="py-3 px-2.5 font-bold">
                  <button type="button" onClick={() => handleSort('Match_Date')} className="inline-flex items-center gap-1 cursor-pointer hover:text-[#D7193F]">
                    Date <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-2.5 font-bold">Format</th>
                <th className="py-3 px-2.5 font-bold">Opposition</th>
                <th className="py-3 px-2.5 font-bold">Venue</th>
                <th className="py-3 px-2.5 font-bold text-right">
                  <button type="button" onClick={() => handleSort('Runs')} className="inline-flex items-center gap-1 cursor-pointer hover:text-[#D7193F]">
                    Runs <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-2.5 font-bold text-right">
                  <button type="button" onClick={() => handleSort('Balls_Faced')} className="inline-flex items-center gap-1 cursor-pointer hover:text-[#D7193F]">
                    Balls <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-2.5 font-bold text-right">
                  <button type="button" onClick={() => handleSort('Fours')} className="inline-flex items-center gap-1 cursor-pointer hover:text-[#D7193F]">
                    4s <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-2.5 font-bold text-right">
                  <button type="button" onClick={() => handleSort('Sixes')} className="inline-flex items-center gap-1 cursor-pointer hover:text-[#D7193F]">
                    6s <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-2.5 font-bold text-right">
                  <button type="button" onClick={() => handleSort('Strike_Rate')} className="inline-flex items-center gap-1 cursor-pointer hover:text-[#D7193F]">
                    SR <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-2.5 font-bold">Dismissal</th>
                <th className="py-3 px-2.5 font-bold">Result</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#1A2E4D]' : 'divide-[#EDF1F7]'}`}>
              {sortedRows.map((m) => (
                <tr
                  key={m.Match_ID}
                  onClick={() => {
                    soundEngine.play('click');
                    setSelectedMatch(m);
                  }}
                  className="hover:bg-[#102B50]/6 dark:hover:bg-[#173F70]/35 transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-2.5 font-mono-num font-semibold text-[#173F70] dark:text-blue-300">{m.Match_ID}</td>
                  <td className="py-2.5 px-2.5 whitespace-nowrap">{formatShortDate(m.Match_Date)}</td>
                  <td className="py-2.5 px-2.5">
                    <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-semibold ${getFormatBadgeStyles(m.Format, isDark)}`}>
                      {m.Format}
                    </span>
                  </td>
                  <td className="py-2.5 px-2.5 font-semibold">{m.Opposition}</td>
                  <td className="py-2.5 px-2.5">{m.Venue}</td>
                  <td className="py-2.5 px-2.5 text-right font-mono-num font-extrabold">
                    <span
                      className={
                        m.Runs >= 100
                          ? 'px-2 py-0.5 rounded-md bg-[#D7193F] text-white'
                          : m.Runs >= 50
                            ? 'text-[#173F70] dark:text-blue-300'
                            : ''
                      }
                    >
                      {m.Runs}
                      {m.Not_Out_Flag === 1 ? '*' : ''}
                    </span>
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono-num opacity-80">{m.Balls_Faced}</td>
                  <td className="py-2.5 px-2.5 text-right font-mono-num">{m.Fours}</td>
                  <td className="py-2.5 px-2.5 text-right font-mono-num">{m.Sixes}</td>
                  <td className="py-2.5 px-2.5 text-right font-mono-num font-semibold">{m.Strike_Rate.toFixed(1)}</td>
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
    </div>
  );
};
