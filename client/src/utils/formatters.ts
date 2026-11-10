export function formatNumber(val: number): string {
  return val.toLocaleString('en-US');
}

export function formatAverage(avg: number | null): string {
  if (avg === null) return '—';
  return avg.toFixed(2);
}

export function formatStrikeRate(sr: number): string {
  return sr.toFixed(1);
}

export function formatShortDate(isoDate: string): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  const dt = new Date(Date.UTC(year, month - 1, day));
  return dt.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function getResultBadgeStyles(result: string, isDark = false): string {
  switch (result) {
    case 'Won':
      return isDark
        ? 'bg-[#173F70]/60 text-white border border-[#2C63A8]/60'
        : 'bg-[#102B50]/10 text-[#102B50] border border-[#102B50]/20';
    case 'Lost':
      return isDark
        ? 'bg-[#D7193F]/20 text-rose-200 border border-[#D7193F]/45'
        : 'bg-[#D7193F]/10 text-[#D7193F] border border-[#D7193F]/25';
    case 'Draw':
      return isDark
        ? 'bg-blue-900/40 text-blue-200 border border-blue-700/45'
        : 'bg-[#173F70]/12 text-[#173F70] border border-[#173F70]/25';
    default:
      return isDark
        ? 'bg-slate-800/60 text-slate-300 border border-slate-700/50'
        : 'bg-slate-100 text-slate-600 border border-slate-200';
  }
}

export function getFormatBadgeStyles(format: string, isDark = false): string {
  switch (format) {
    case 'Test':
      return isDark
        ? 'bg-[#173F70] text-white border border-blue-400/30'
        : 'bg-[#102B50] text-white';
    case 'ODI':
      return isDark
        ? 'bg-[#215394] text-white border border-blue-300/30'
        : 'bg-[#173F70] text-white';
    case 'T20I':
      return 'bg-[#D7193F] text-white font-semibold';
    default:
      return isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-800';
  }
}
