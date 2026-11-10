import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, MapPin, Shield, Sparkles, Trophy, X } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { formatShortDate, getFormatBadgeStyles, getResultBadgeStyles } from '../../utils/formatters';
import { soundEngine } from '../../utils/soundEngine';

export const MatchDetailDrawer: React.FC = () => {
  const { selectedMatch, setSelectedMatch, applyFilters, theme } = useDashboard();
  const isDark = theme === 'dark';

  const boundaryRuns = selectedMatch ? selectedMatch.Fours * 4 + selectedMatch.Sixes * 6 : 0;
  const boundaryPct =
    selectedMatch && selectedMatch.Runs > 0
      ? Math.round((boundaryRuns / selectedMatch.Runs) * 100)
      : 0;

  return (
    <AnimatePresence>
      {selectedMatch && (
        <>
          <motion.div
            key="match-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              soundEngine.play('click');
              setSelectedMatch(null);
            }}
            className="fixed inset-0 z-50 bg-[#0B1424]/50 backdrop-blur-[2px]"
          />

          <motion.aside
            key="match-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            className={[
              'fixed top-0 right-0 bottom-0 z-50 w-full max-w-md flex flex-col shadow-2xl border-l',
              isDark
                ? 'bg-[#0B1424] border-[#1E3557] text-white'
                : 'bg-white border-[#E1E7F0] text-[#102B50]',
            ].join(' ')}
          >
            {/* Header */}
            <div className="bg-[#102B50] text-white p-6 relative overflow-hidden border-b-2 border-[#D7193F]">
              <svg
                className="absolute inset-0 w-full h-full opacity-15 pointer-events-none"
                viewBox="0 0 400 200"
                fill="none"
              >
                <circle cx="340" cy="40" r="90" stroke="#D7193F" strokeWidth="1.2" />
                <circle cx="340" cy="40" r="140" stroke="#FFFFFF" strokeWidth="0.7" />
              </svg>
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${getFormatBadgeStyles(selectedMatch.Format, true)}`}>
                      {selectedMatch.Format}
                    </span>
                    <span className="text-xs font-mono-num text-blue-200">
                      {selectedMatch.Match_ID}
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-bold tracking-tight">
                    vs {selectedMatch.Opposition}
                  </h2>
                  <p className="text-xs text-blue-100/80 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatShortDate(selectedMatch.Match_Date)} · {selectedMatch.Innings === 1 ? '1st' : '2nd'} Innings
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.play('click');
                    setSelectedMatch(null);
                  }}
                  aria-label="Close match detail"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative z-10 mt-5 flex items-end justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-blue-200/80 font-semibold">
                    Innings Score
                  </span>
                  <div className="text-4xl font-extrabold font-mono-num mt-0.5">
                    {selectedMatch.Runs}
                    {selectedMatch.Not_Out_Flag === 1 ? '*' : ''}
                    <span className="text-base font-medium text-blue-200 ml-2">
                      ({selectedMatch.Balls_Faced} balls)
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#D7193F] text-white">
                  {selectedMatch.Match_Result}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl p-3.5 border ${isDark ? 'bg-[#111F38] border-[#1E3557]' : 'bg-[#F3F5F9] border-[#E1E7F0]'}`}>
                  <p className="text-[11px] uppercase tracking-wider opacity-70 font-semibold">Strike Rate</p>
                  <p className="text-xl font-bold font-mono-num mt-1">{selectedMatch.Strike_Rate.toFixed(1)}</p>
                </div>
                <div className={`rounded-xl p-3.5 border ${isDark ? 'bg-[#111F38] border-[#1E3557]' : 'bg-[#F3F5F9] border-[#E1E7F0]'}`}>
                  <p className="text-[11px] uppercase tracking-wider opacity-70 font-semibold">Boundaries</p>
                  <p className="text-xl font-bold font-mono-num mt-1">
                    {selectedMatch.Fours}×4 <span className="text-sm font-normal opacity-60">·</span> {selectedMatch.Sixes}×6
                  </p>
                </div>
                <div className={`rounded-xl p-3.5 border ${isDark ? 'bg-[#111F38] border-[#1E3557]' : 'bg-[#F3F5F9] border-[#E1E7F0]'}`}>
                  <p className="text-[11px] uppercase tracking-wider opacity-70 font-semibold">Boundary Runs</p>
                  <p className="text-xl font-bold font-mono-num mt-1">
                    {boundaryRuns} <span className="text-xs font-medium opacity-70">({boundaryPct}%)</span>
                  </p>
                </div>
                <div className={`rounded-xl p-3.5 border ${isDark ? 'bg-[#111F38] border-[#1E3557]' : 'bg-[#F3F5F9] border-[#E1E7F0]'}`}>
                  <p className="text-[11px] uppercase tracking-wider opacity-70 font-semibold">Dismissal</p>
                  <p className="text-base font-bold mt-1.5">{selectedMatch.Dismissal}</p>
                </div>
              </div>

              <div className={`rounded-xl p-4 border space-y-2.5 ${isDark ? 'bg-[#111F38] border-[#1E3557]' : 'bg-white border-[#E1E7F0]'}`}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 opacity-75">
                    <MapPin className="w-4 h-4 text-[#173F70] dark:text-blue-300" /> Venue
                  </span>
                  <span className="font-semibold">{selectedMatch.Venue}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 opacity-75">
                    <Shield className="w-4 h-4 text-[#173F70] dark:text-blue-300" /> Opposition
                  </span>
                  <span className="font-semibold">{selectedMatch.Opposition}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 opacity-75">
                    <Trophy className="w-4 h-4 text-[#D7193F]" /> Outcome
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getResultBadgeStyles(selectedMatch.Match_Result, isDark)}`}>
                    {selectedMatch.Match_Result}
                  </span>
                </div>
              </div>

              {/* Quick Filter Actions */}
              <div className="pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D7193F]" /> Quick Drill-Down Filters
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      applyFilters({ oppositions: [selectedMatch.Opposition] });
                      setSelectedMatch(null);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#102B50] text-white hover:bg-[#173F70] transition-colors cursor-pointer"
                  >
                    Filter vs {selectedMatch.Opposition}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      applyFilters({ venues: [selectedMatch.Venue] });
                      setSelectedMatch(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      isDark
                        ? 'border-[#1E3557] hover:bg-[#173F70]/40'
                        : 'border-[#E1E7F0] hover:bg-[#F3F5F9]'
                    }`}
                  >
                    Filter at {selectedMatch.Venue}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      applyFilters({ formats: [selectedMatch.Format] });
                      setSelectedMatch(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      isDark
                        ? 'border-[#1E3557] hover:bg-[#173F70]/40'
                        : 'border-[#E1E7F0] hover:bg-[#F3F5F9]'
                    }`}
                  >
                    Filter {selectedMatch.Format}
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
