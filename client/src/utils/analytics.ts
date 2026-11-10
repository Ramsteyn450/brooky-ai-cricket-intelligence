import type {
  DashboardAnalytics,
  DismissalStat,
  FilterOptions,
  FilterState,
  GroupedPerformance,
  HighestScoreInfo,
  KpiSummary,
  MatchRecord,
  ProgressionPoint,
  ScoreBracketStat,
} from '../types/cricket';

export const EMPTY_FILTERS: FilterState = {
  seasons: [],
  formats: [],
  oppositions: [],
  venues: [],
  matchResults: [],
  innings: [],
};

const round1 = (val: number): number => Math.round(val * 10) / 10;
const round2 = (val: number): number => Math.round(val * 100) / 100;

export function filterMatches(matches: MatchRecord[], filters: Partial<FilterState> = {}): MatchRecord[] {
  const seasons = filters.seasons ?? [];
  const formats = filters.formats ?? [];
  const oppositions = filters.oppositions ?? [];
  const venues = filters.venues ?? [];
  const matchResults = filters.matchResults ?? [];
  const innings = filters.innings ?? [];

  return matches.filter((m) => {
    if (seasons.length > 0 && !seasons.includes(m.Season)) return false;
    if (formats.length > 0 && !formats.includes(m.Format)) return false;
    if (oppositions.length > 0 && !oppositions.includes(m.Opposition)) return false;
    if (venues.length > 0 && !venues.includes(m.Venue)) return false;
    if (matchResults.length > 0 && !matchResults.includes(m.Match_Result)) return false;
    if (innings.length > 0 && !innings.includes(m.Innings)) return false;
    return true;
  });
}

export function sortMatchesByDateDesc(matches: MatchRecord[]): MatchRecord[] {
  return [...matches].sort((a, b) => {
    const dateDiff = b.Match_Date.localeCompare(a.Match_Date);
    if (dateDiff !== 0) return dateDiff;
    return b.Match_ID.localeCompare(a.Match_ID);
  });
}

export function sortMatchesByDateAsc(matches: MatchRecord[]): MatchRecord[] {
  return [...matches].sort((a, b) => {
    const dateDiff = a.Match_Date.localeCompare(b.Match_Date);
    if (dateDiff !== 0) return dateDiff;
    return a.Match_ID.localeCompare(b.Match_ID);
  });
}

export function computeKpis(matches: MatchRecord[]): KpiSummary {
  const totalMatches = matches.length;
  let totalRuns = 0;
  let totalBalls = 0;
  let notOuts = 0;
  let totalFours = 0;
  let totalSixes = 0;
  let centuries = 0;
  let halfCenturies = 0;
  let winCount = 0;
  let lossCount = 0;
  let drawCount = 0;
  let noResultCount = 0;
  let bestRow: MatchRecord | null = null;

  for (const m of matches) {
    totalRuns += m.Runs;
    totalBalls += m.Balls_Faced;
    notOuts += m.Not_Out_Flag;
    totalFours += m.Fours;
    totalSixes += m.Sixes;
    if (m.Runs >= 100) centuries += 1;
    else if (m.Runs >= 50) halfCenturies += 1;

    if (m.Match_Result === 'Won') winCount += 1;
    else if (m.Match_Result === 'Lost') lossCount += 1;
    else if (m.Match_Result === 'Draw') drawCount += 1;
    else noResultCount += 1;

    if (
      !bestRow ||
      m.Runs > bestRow.Runs ||
      (m.Runs === bestRow.Runs && m.Not_Out_Flag > bestRow.Not_Out_Flag) ||
      (m.Runs === bestRow.Runs && m.Not_Out_Flag === bestRow.Not_Out_Flag && m.Match_Date > bestRow.Match_Date)
    ) {
      bestRow = m;
    }
  }

  const dismissals = totalMatches - notOuts;
  const battingAverage = dismissals > 0 ? round2(totalRuns / dismissals) : null;
  const strikeRate = totalBalls > 0 ? round2((totalRuns / totalBalls) * 100) : 0;
  const totalBoundaries = totalFours + totalSixes;
  const boundaryRuns = totalFours * 4 + totalSixes * 6;
  const boundaryRunPct = totalRuns > 0 ? round1((boundaryRuns / totalRuns) * 100) : 0;
  const winRate = totalMatches > 0 ? round1((winCount / totalMatches) * 100) : 0;
  const fiftyPlusRate = totalMatches > 0 ? round1(((centuries + halfCenturies) / totalMatches) * 100) : 0;

  const highestScore: HighestScoreInfo | null = bestRow
    ? {
        runs: bestRow.Runs,
        notOut: bestRow.Not_Out_Flag === 1,
        label: `${bestRow.Runs}${bestRow.Not_Out_Flag === 1 ? '*' : ''}`,
        matchId: bestRow.Match_ID,
        opposition: bestRow.Opposition,
        venue: bestRow.Venue,
        format: bestRow.Format,
        date: bestRow.Match_Date,
      }
    : null;

  return {
    totalMatches,
    totalRuns,
    totalBalls,
    notOuts,
    dismissals,
    battingAverage,
    strikeRate,
    centuries,
    halfCenturies,
    highestScore,
    totalFours,
    totalSixes,
    totalBoundaries,
    boundaryRuns,
    boundaryRunPct,
    winCount,
    lossCount,
    drawCount,
    noResultCount,
    winRate,
    fiftyPlusRate,
  };
}

export function groupPerformance(
  matches: MatchRecord[],
  keyFn: (m: MatchRecord) => string,
  sortMode: 'runsDesc' | 'keyAsc' = 'runsDesc',
): GroupedPerformance[] {
  const buckets = new Map<string, MatchRecord[]>();
  for (const m of matches) {
    const key = keyFn(m);
    const arr = buckets.get(key);
    if (arr) arr.push(m);
    else buckets.set(key, [m]);
  }

  const results: GroupedPerformance[] = [];
  for (const [key, group] of buckets.entries()) {
    const kpi = computeKpis(group);
    results.push({
      key,
      matches: kpi.totalMatches,
      runs: kpi.totalRuns,
      balls: kpi.totalBalls,
      notOuts: kpi.notOuts,
      dismissals: kpi.dismissals,
      average: kpi.battingAverage,
      strikeRate: kpi.strikeRate,
      highestScore: kpi.highestScore?.runs ?? 0,
      highestScoreNotOut: kpi.highestScore?.notOut ?? false,
      highestScoreLabel: kpi.highestScore?.label ?? '0',
      centuries: kpi.centuries,
      halfCenturies: kpi.halfCenturies,
      fours: kpi.totalFours,
      sixes: kpi.totalSixes,
      wins: kpi.winCount,
      winRate: kpi.winRate,
    });
  }

  if (sortMode === 'keyAsc') {
    results.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
  } else {
    results.sort((a, b) => b.runs - a.runs || b.matches - a.matches || a.key.localeCompare(b.key));
  }

  return results;
}

export function computeProgression(matches: MatchRecord[]): ProgressionPoint[] {
  const ordered = sortMatchesByDateAsc(matches);
  let cumulativeRuns = 0;
  let cumulativeNotOuts = 0;

  return ordered.map((m, idx) => {
    cumulativeRuns += m.Runs;
    cumulativeNotOuts += m.Not_Out_Flag;
    const dismissals = idx + 1 - cumulativeNotOuts;
    return {
      index: idx + 1,
      Match_ID: m.Match_ID,
      Match_Date: m.Match_Date,
      label: m.Match_Date.slice(0, 7),
      Format: m.Format,
      Opposition: m.Opposition,
      Venue: m.Venue,
      Runs: m.Runs,
      Balls_Faced: m.Balls_Faced,
      Strike_Rate: m.Strike_Rate,
      Not_Out_Flag: m.Not_Out_Flag,
      Match_Result: m.Match_Result,
      cumulativeRuns,
      cumulativeAverage: dismissals > 0 ? round2(cumulativeRuns / dismissals) : null,
    };
  });
}

export function computeDismissalBreakdown(matches: MatchRecord[]): DismissalStat[] {
  const counts = new Map<string, number>();
  for (const m of matches) {
    counts.set(m.Dismissal, (counts.get(m.Dismissal) ?? 0) + 1);
  }
  const total = matches.length;
  return Array.from(counts.entries())
    .map(([dismissal, count]) => ({
      dismissal,
      count,
      percentage: total > 0 ? round1((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count || a.dismissal.localeCompare(b.dismissal));
}

export function computeScoreBrackets(matches: MatchRecord[]): ScoreBracketStat[] {
  const brackets = [
    { label: '0–19', min: 0, max: 19 },
    { label: '20–49', min: 20, max: 49 },
    { label: '50–99 (50s)', min: 50, max: 99 },
    { label: '100+ (100s)', min: 100, max: Infinity },
  ];
  const total = matches.length;
  return brackets.map((b) => {
    const matched = matches.filter((m) => m.Runs >= b.min && m.Runs <= b.max);
    return {
      bracket: b.label,
      count: matched.length,
      runs: matched.reduce((acc, m) => acc + m.Runs, 0),
      percentage: total > 0 ? round1((matched.length / total) * 100) : 0,
    };
  });
}

export function computeDashboardAnalytics(matches: MatchRecord[]): DashboardAnalytics {
  const kpis = computeKpis(matches);
  const bySeason = groupPerformance(matches, (m) => String(m.Season), 'keyAsc');
  const byFormat = groupPerformance(matches, (m) => m.Format, 'runsDesc');
  const byVenue = groupPerformance(matches, (m) => m.Venue, 'runsDesc');
  const byOpposition = groupPerformance(matches, (m) => m.Opposition, 'runsDesc');
  const byInnings = groupPerformance(matches, (m) => `${m.Innings === 1 ? '1st' : '2nd'} Innings`, 'keyAsc');
  const byDismissal = computeDismissalBreakdown(matches);
  const scoreBrackets = computeScoreBrackets(matches);
  const progression = computeProgression(matches);
  const latestFive = sortMatchesByDateDesc(matches).slice(0, 5);

  return {
    kpis,
    bySeason,
    byFormat,
    byVenue,
    byOpposition,
    byInnings,
    byDismissal,
    scoreBrackets,
    progression,
    latestFive,
  };
}

export function getFilterOptions(matches: MatchRecord[]): FilterOptions {
  const seasons = Array.from(new Set(matches.map((m) => m.Season))).sort((a, b) => a - b);
  const formats = Array.from(new Set(matches.map((m) => m.Format))).sort();
  const oppositions = Array.from(new Set(matches.map((m) => m.Opposition))).sort();
  const venues = Array.from(new Set(matches.map((m) => m.Venue))).sort();
  const matchResults = Array.from(new Set(matches.map((m) => m.Match_Result))).sort();
  const innings = Array.from(new Set(matches.map((m) => m.Innings))).sort((a, b) => a - b);
  return { seasons, formats, oppositions, venues, matchResults, innings };
}

export function countActiveFilters(filters: FilterState): number {
  return (
    filters.seasons.length +
    filters.formats.length +
    filters.oppositions.length +
    filters.venues.length +
    filters.matchResults.length +
    filters.innings.length
  );
}
