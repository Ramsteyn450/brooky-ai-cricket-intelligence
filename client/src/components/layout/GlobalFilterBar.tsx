import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Filter, RotateCcw, X } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { soundEngine } from '../../utils/soundEngine';

interface MultiSelectDropdownProps {
  label: string;
  options: Array<{ value: string | number; label: string }>;
  selected: Array<string | number>;
  onToggle: (value: string | number) => void;
  isDark: boolean;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  options,
  selected,
  onToggle,
  isDark,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hasSelected = selected.length > 0;
  const summaryText =
    selected.length === 0
      ? `All ${label}s`
      : selected.length === 1
        ? String(options.find((o) => o.value === selected[0])?.label ?? selected[0])
        : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          soundEngine.play('click');
          setOpen((prev) => !prev);
        }}
        className={[
          'flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs font-medium min-w-[138px] transition-all cursor-pointer',
          hasSelected
            ? 'bg-[#102B50] text-white border-[#102B50] shadow-sm'
            : isDark
              ? 'bg-[#111F38] border-[#1E3557] text-slate-200 hover:border-[#D7193F]/70'
              : 'bg-white border-[#E1E7F0] text-[#102B50] hover:border-[#173F70]',
        ].join(' ')}
      >
        <div className="flex flex-col items-start text-left leading-tight">
          <span className={`text-[9.5px] uppercase tracking-wider font-bold ${hasSelected ? 'text-[#D7193F]' : 'opacity-55'}`}>
            {label}
          </span>
          <span className="truncate max-w-[125px] mt-0.5 font-semibold">{summaryText}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={[
              'absolute left-0 mt-1.5 w-56 rounded-2xl border shadow-xl p-1.5 z-40 max-h-64 overflow-y-auto',
              isDark ? 'bg-[#111F38] border-[#1E3557] text-white' : 'bg-white border-[#E1E7F0] text-[#102B50]',
            ].join(' ')}
          >
            {options.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => onToggle(opt.value)}
                  className={[
                    'w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer',
                    checked
                      ? 'bg-[#102B50]/10 text-[#102B50] dark:bg-[#173F70]/60 dark:text-white font-semibold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5',
                  ].join(' ')}
                >
                  <span className="truncate">{opt.label}</span>
                  <span
                    className={[
                      'w-4 h-4 rounded-md flex items-center justify-center border shrink-0',
                      checked
                        ? 'bg-[#D7193F] border-[#D7193F] text-white'
                        : isDark
                          ? 'border-[#2B4A77]'
                          : 'border-[#CBD5E4]',
                    ].join(' ')}
                  >
                    {checked && <Check className="w-3 h-3" />}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface MatchTypeDropdownProps {
  selectedResults: string[];
  selectedInnings: number[];
  resultOptions: string[];
  inningsOptions: number[];
  onToggleResult: (val: string) => void;
  onToggleInnings: (val: number) => void;
  isDark: boolean;
}

const MatchTypeDropdown: React.FC<MatchTypeDropdownProps> = ({
  selectedResults,
  selectedInnings,
  resultOptions,
  inningsOptions,
  onToggleResult,
  onToggleInnings,
  isDark,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const totalSelected = selectedResults.length + selectedInnings.length;
  const summaryText =
    totalSelected === 0
      ? 'All Results & Inn'
      : totalSelected === 1
        ? selectedResults[0] ?? `${selectedInnings[0] === 1 ? '1st' : '2nd'} Innings`
        : `${totalSelected} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          soundEngine.play('click');
          setOpen((prev) => !prev);
        }}
        className={[
          'flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs font-medium min-w-[146px] transition-all cursor-pointer',
          totalSelected > 0
            ? 'bg-[#102B50] text-white border-[#102B50] shadow-sm'
            : isDark
              ? 'bg-[#111F38] border-[#1E3557] text-slate-200 hover:border-[#D7193F]/70'
              : 'bg-white border-[#E1E7F0] text-[#102B50] hover:border-[#173F70]',
        ].join(' ')}
      >
        <div className="flex flex-col items-start text-left leading-tight">
          <span className={`text-[9.5px] uppercase tracking-wider font-bold ${totalSelected > 0 ? 'text-[#D7193F]' : 'opacity-55'}`}>
            Match Type
          </span>
          <span className="truncate max-w-[130px] mt-0.5 font-semibold">{summaryText}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={[
              'absolute left-0 mt-1.5 w-56 rounded-2xl border shadow-xl p-2 z-40',
              isDark ? 'bg-[#111F38] border-[#1E3557] text-white' : 'bg-white border-[#E1E7F0] text-[#102B50]',
            ].join(' ')}
          >
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider opacity-60">
              Match Result
            </div>
            {resultOptions.map((r) => {
              const checked = selectedResults.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => onToggleResult(r)}
                  className={[
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer',
                    checked
                      ? 'bg-[#102B50]/10 text-[#102B50] dark:bg-[#173F70]/60 dark:text-white font-semibold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5',
                  ].join(' ')}
                >
                  <span>{r}</span>
                  <span
                    className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                      checked ? 'bg-[#D7193F] border-[#D7193F] text-white' : isDark ? 'border-[#2B4A77]' : 'border-[#CBD5E4]'
                    }`}
                  >
                    {checked && <Check className="w-3 h-3" />}
                  </span>
                </button>
              );
            })}

            <div className="my-1.5 border-t border-black/8 dark:border-white/10" />
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider opacity-60">
              Batting Innings
            </div>
            {inningsOptions.map((inn) => {
              const checked = selectedInnings.includes(inn);
              return (
                <button
                  key={inn}
                  type="button"
                  onClick={() => onToggleInnings(inn)}
                  className={[
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer',
                    checked
                      ? 'bg-[#102B50]/10 text-[#102B50] dark:bg-[#173F70]/60 dark:text-white font-semibold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5',
                  ].join(' ')}
                >
                  <span>{inn === 1 ? '1st Innings' : '2nd Innings'}</span>
                  <span
                    className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                      checked ? 'bg-[#D7193F] border-[#D7193F] text-white' : isDark ? 'border-[#2B4A77]' : 'border-[#CBD5E4]'
                    }`}
                  >
                    {checked && <Check className="w-3 h-3" />}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const GlobalFilterBar: React.FC = () => {
  const {
    filters,
    filterOptions,
    activeFilterCount,
    filteredMatches,
    allMatches,
    toggleFilterValue,
    clearFilters,
    theme,
  } = useDashboard();

  const isDark = theme === 'dark';

  const activeChips: Array<{ label: string; onRemove: () => void }> = [
    ...filters.seasons.map((s) => ({
      label: `Season: ${s}`,
      onRemove: () => toggleFilterValue('seasons', s),
    })),
    ...filters.formats.map((f) => ({
      label: `Format: ${f}`,
      onRemove: () => toggleFilterValue('formats', f),
    })),
    ...filters.oppositions.map((o) => ({
      label: `vs ${o}`,
      onRemove: () => toggleFilterValue('oppositions', o),
    })),
    ...filters.venues.map((v) => ({
      label: `Venue: ${v}`,
      onRemove: () => toggleFilterValue('venues', v),
    })),
    ...filters.matchResults.map((r) => ({
      label: `Result: ${r}`,
      onRemove: () => toggleFilterValue('matchResults', r),
    })),
    ...filters.innings.map((inn) => ({
      label: `${inn === 1 ? '1st' : '2nd'} Innings`,
      onRemove: () => toggleFilterValue('innings', inn),
    })),
  ];

  return (
    <section
      aria-label="Global dashboard filters"
      className={[
        'border-b px-4 sm:px-6 py-3 transition-colors',
        isDark
          ? 'bg-[#0E192D] border-[#1E3557] text-white'
          : 'bg-[#F3F5F9] border-[#E1E7F0] text-[#102B50]',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 mr-1 text-xs font-bold uppercase tracking-wider text-[#102B50] dark:text-blue-200">
            <Filter className="w-3.5 h-3.5 text-[#D7193F]" />
            <span>Filters</span>
          </div>

          <MultiSelectDropdown
            label="Season"
            options={filterOptions.seasons.map((s) => ({ value: s, label: String(s) }))}
            selected={filters.seasons}
            onToggle={(v) => toggleFilterValue('seasons', Number(v))}
            isDark={isDark}
          />

          <MultiSelectDropdown
            label="Format"
            options={filterOptions.formats.map((f) => ({ value: f, label: f }))}
            selected={filters.formats}
            onToggle={(v) => toggleFilterValue('formats', String(v))}
            isDark={isDark}
          />

          <MultiSelectDropdown
            label="Opposition"
            options={filterOptions.oppositions.map((o) => ({ value: o, label: o }))}
            selected={filters.oppositions}
            onToggle={(v) => toggleFilterValue('oppositions', String(v))}
            isDark={isDark}
          />

          <MultiSelectDropdown
            label="Venue"
            options={filterOptions.venues.map((v) => ({ value: v, label: v }))}
            selected={filters.venues}
            onToggle={(v) => toggleFilterValue('venues', String(v))}
            isDark={isDark}
          />

          <MatchTypeDropdown
            selectedResults={filters.matchResults}
            selectedInnings={filters.innings}
            resultOptions={filterOptions.matchResults}
            inningsOptions={filterOptions.innings}
            onToggleResult={(val) => toggleFilterValue('matchResults', val)}
            onToggleInnings={(val) => toggleFilterValue('innings', val)}
            isDark={isDark}
          />
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          <span
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl font-mono-num ${
              isDark ? 'bg-[#111F38] text-blue-200 border border-[#1E3557]' : 'bg-white text-[#102B50] border border-[#E1E7F0]'
            }`}
          >
            {filteredMatches.length} / {allMatches.length} Innings
          </span>

          {activeFilterCount > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D7193F] hover:bg-[#b81435] text-white shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Currently Selected Filter Chips */}
      <AnimatePresence>
        {activeChips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-1.5 pt-2.5 overflow-hidden"
          >
            <span className="text-[11px] font-semibold opacity-65 mr-1">Active:</span>
            {activeChips.map((chip) => (
              <motion.span
                key={chip.label}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  isDark
                    ? 'bg-[#173F70] text-white border border-[#2C62A3]'
                    : 'bg-white text-[#102B50] border border-[#102B50]/20 shadow-2xs'
                }`}
              >
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  aria-label={`Remove ${chip.label}`}
                  className="hover:text-[#D7193F] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
