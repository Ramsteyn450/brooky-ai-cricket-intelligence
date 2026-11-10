import { GoogleGenAI } from '@google/genai';
import {
  computeDashboardAnalytics,
  EMPTY_FILTERS,
  filterMatches,
  getFilterOptions,
  sortMatchesByDateDesc,
} from '../analytics/engine.js';
import type {
  BrookyAction,
  BrookyChartSpec,
  BrookyChatResponse,
  DashboardPageId,
  FilterState,
  MatchRecord,
  PlayerProfile,
} from '../types.js';

export interface BrookyChatRequest {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
  activeFilters?: Partial<FilterState>;
  currentPage?: DashboardPageId;
}

function normalizeFilters(raw?: Partial<FilterState>): FilterState {
  return {
    seasons: raw?.seasons ?? [],
    formats: raw?.formats ?? [],
    oppositions: raw?.oppositions ?? [],
    venues: raw?.venues ?? [],
    matchResults: raw?.matchResults ?? [],
    innings: raw?.innings ?? [],
  };
}

function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.seasons.length > 0 ||
    filters.formats.length > 0 ||
    filters.oppositions.length > 0 ||
    filters.venues.length > 0 ||
    filters.matchResults.length > 0 ||
    filters.innings.length > 0
  );
}

function describeFilters(filters: FilterState): string {
  const parts: string[] = [];
  if (filters.seasons.length) parts.push(`Season: ${filters.seasons.join(', ')}`);
  if (filters.formats.length) parts.push(`Format: ${filters.formats.join(', ')}`);
  if (filters.oppositions.length) parts.push(`Opposition: ${filters.oppositions.join(', ')}`);
  if (filters.venues.length) parts.push(`Venue: ${filters.venues.join(', ')}`);
  if (filters.matchResults.length) parts.push(`Match Result: ${filters.matchResults.join(', ')}`);
  if (filters.innings.length) parts.push(`Innings: ${filters.innings.join(', ')}`);
  return parts.length > 0 ? parts.join(' | ') : 'All Matches (No active filters)';
}

function fmtAvg(avg: number | null): string {
  return avg === null ? 'N/A (all unbeaten)' : avg.toFixed(2);
}

function buildChartForKey(
  key: string,
  matches: MatchRecord[],
): BrookyChartSpec | undefined {
  const analytics = computeDashboardAnalytics(matches);

  switch (key) {
    case 'format_comparison':
      return {
        type: 'comparison',
        title: 'Runs & Strike Rate by Format',
        subtitle: 'Calculated from active dataset slice',
        nameKey: 'name',
        dataKey: 'runs',
        data: analytics.byFormat.map((f) => ({
          name: f.key,
          runs: f.runs,
          average: f.average ?? 0,
          strikeRate: f.strikeRate,
        })),
      };
    case 'season_runs':
      return {
        type: 'bar',
        title: 'Runs by Season',
        subtitle: 'Season-wise scoring output',
        nameKey: 'name',
        dataKey: 'runs',
        data: analytics.bySeason.map((s) => ({
          name: s.key,
          runs: s.runs,
          average: s.average ?? 0,
        })),
      };
    case 'venue_average':
      return {
        type: 'bar',
        title: 'Batting Average by Venue',
        subtitle: 'Sorted by batting average',
        nameKey: 'name',
        dataKey: 'average',
        data: [...analytics.byVenue]
          .filter((v) => v.average !== null)
          .sort((a, b) => (b.average ?? 0) - (a.average ?? 0))
          .slice(0, 6)
          .map((v) => ({
            name: v.key,
            average: v.average ?? 0,
            runs: v.runs,
          })),
      };
    case 'opposition_runs':
      return {
        type: 'bar',
        title: 'Runs Against Opposition',
        subtitle: 'Total runs across opponents',
        nameKey: 'name',
        dataKey: 'runs',
        data: analytics.byOpposition.map((o) => ({
          name: o.key,
          runs: o.runs,
          average: o.average ?? 0,
        })),
      };
    case 'recent_five':
      return {
        type: 'bar',
        title: 'Latest 5 Innings Runs',
        subtitle: 'Ordered most recent first',
        nameKey: 'name',
        dataKey: 'runs',
        data: analytics.latestFive.map((m) => ({
          name: `${m.Opposition.slice(0, 3).toUpperCase()} (${m.Format})`,
          runs: m.Runs,
          strikeRate: m.Strike_Rate,
        })),
      };
    default:
      return undefined;
  }
}

function detectIntentAndRespondDemo(
  query: string,
  allMatches: MatchRecord[],
  playerProfile: PlayerProfile,
  activeFilters: FilterState,
  currentPage: DashboardPageId,
): BrookyChatResponse {
  const q = query.trim();
  const lower = q.toLowerCase();
  const options = getFilterOptions(allMatches);

  const filteredMatches = filterMatches(allMatches, activeFilters);
  const filteredStats = computeDashboardAnalytics(filteredMatches);
  const overallStats = computeDashboardAnalytics(allMatches);
  const isFiltered = hasActiveFilters(activeFilters);

  // Check if user wants to clear filters
  if (/(clear|reset|remove)\s+(all\s+)?filters?|show all matches/i.test(lower)) {
    return {
      reply: `Done! I've cleared all active filters so you're back to Harry Brook's complete dataset: **${overallStats.kpis.totalRuns.toLocaleString()} runs** across **${overallStats.kpis.totalMatches} innings** at an average of **${fmtAvg(overallStats.kpis.battingAverage)}** and strike rate of **${overallStats.kpis.strikeRate.toFixed(1)}**.`,
      mode: 'demo',
      action: { type: 'clear_filters', label: 'Cleared all filters' },
      suggestedChart: buildChartForKey('season_runs', allMatches),
      highlights: [
        `${overallStats.kpis.totalRuns.toLocaleString()} Total Runs`,
        `${overallStats.kpis.centuries} Centuries / ${overallStats.kpis.halfCenturies} Fifties`,
      ],
      followUpSuggestions: [
        'Which season was his best?',
        'Compare his Test and ODI performance',
        'Show his last five matches',
      ],
    };
  }

  // Check explicit filter command ("filter to ODI", "filter by Australia", "show 2024", etc.)
  const wantsFilterCommand =
    /\b(filter|switch|set|apply)\b/i.test(lower) ||
    /\bshow\s+(his\s+)?(performance\s+)?(against|vs|at|in|for)\b/i.test(lower) ||
    /\bshow\s+(only\s+)?(test|odi|t20|t20i)\b/i.test(lower);

  const matchedFormats = options.formats.filter((f) => {
    if (f === 'T20I') return /\bt20i?\b/i.test(lower);
    return new RegExp(`\\b${f.toLowerCase()}\\b`, 'i').test(lower);
  });
  const matchedSeasons = options.seasons.filter((s) => lower.includes(String(s)));
  const matchedOppositions = options.oppositions.filter((o) =>
    lower.includes(o.toLowerCase()),
  );
  const matchedVenues = options.venues.filter((v) =>
    lower.includes(v.toLowerCase().replace("'", '')),
  );
  const matchedResults = options.matchResults.filter((r) =>
    new RegExp(`\\b${r.toLowerCase()}\\b`, 'i').test(lower),
  );

  // Greeting
  if (/^(hey|hi|hello|yo|good\s+(morning|afternoon|evening)|brooky)\b[!.?\s]*$/i.test(lower) || lower === 'hey brooky') {
    return {
      reply: `Hey there! I'm **Brooky**, your Cricket Intelligence Analyst. Right now we're viewing **${describeFilters(activeFilters)}** on the **${currentPage}** view — **${filteredStats.kpis.totalRuns.toLocaleString()} runs** in **${filteredStats.kpis.totalMatches} innings** (Avg **${fmtAvg(filteredStats.kpis.battingAverage)}**, SR **${filteredStats.kpis.strikeRate.toFixed(1)}**). Ask me about formats, venues, seasons, opposition matchups, or tell me to filter the dashboard!`,
      mode: 'demo',
      highlights: [
        `${filteredStats.kpis.totalRuns.toLocaleString()} Runs`,
        `Avg ${fmtAvg(filteredStats.kpis.battingAverage)}`,
        `SR ${filteredStats.kpis.strikeRate.toFixed(1)}`,
      ],
      followUpSuggestions: [
        'How many runs did Harry Brook score?',
        'Which venue has his highest average?',
        'Compare his Test and ODI performance',
        'Filter the dashboard to ODI',
      ],
    };
  }

  // Unavailable data check (bowling, wickets, catches, IPL, salary, etc.)
  if (/\b(bowl|bowling|wickets|economy|overs|salary|auction|ipl|psl|bbl|hundred\s+league|catches|stumpings\s+taken)\b/i.test(lower)) {
    return {
      reply: `Good question, though this dataset focuses strictly on Harry Brook's **batting innings** across **${options.formats.join(', ')}** (${options.seasons[0]}–${options.seasons[options.seasons.length - 1]}). It includes columns for Match ID, Date, Season, Format, Opposition, Venue, Innings, Runs, Balls Faced, Fours, Sixes, Dismissal, Not Out Flag, Strike Rate, and Match Result — so bowling, fielding, or franchise auction figures are not contained in the dataset.`,
      mode: 'demo',
      followUpSuggestions: [
        'How many runs did Harry Brook score?',
        'Show his dismissal breakdown',
        'Which season was his best?',
      ],
    };
  }

  // Latest five matches
  if (/(last|latest|recent)\s+(5|five)\s+matches|recent\s+matches/i.test(lower)) {
    const source = filteredMatches.length > 0 ? filteredMatches : allMatches;
    const latest5 = sortMatchesByDateDesc(source).slice(0, 5);
    const lines = latest5
      .map(
        (m, i) =>
          `${i + 1}. **${m.Match_Date}** vs **${m.Opposition}** (${m.Format}, ${m.Venue}) — **${m.Runs}${m.Not_Out_Flag ? '*' : ''} (${m.Balls_Faced}b)**, SR ${m.Strike_Rate}, *${m.Match_Result}*`,
      )
      .join('\n');
    const latestRuns = latest5.reduce((s, m) => s + m.Runs, 0);

    return {
      reply: `Here are Harry Brook's **latest ${latest5.length} matches**${isFiltered ? ` (under ${describeFilters(activeFilters)})` : ''}, totaling **${latestRuns} runs**:\n\n${lines}\n\nI've also opened the **Recent Matches** view for you.`,
      mode: 'demo',
      action: { type: 'navigate', page: 'recent', label: 'Opened Recent Matches' },
      suggestedChart: buildChartForKey('recent_five', source),
      highlights: [`${latestRuns} runs in last ${latest5.length}`, `Latest: ${latest5[0]?.Match_Date}`],
      followUpSuggestions: [
        'Explain the current dashboard',
        'Which venue has his highest average?',
      ],
    };
  }

  // Explain current dashboard
  if (/explain\s+(the\s+)?(current\s+)?dashboard|what\s+am\s+i\s+looking\s+at|summarize\s+(this|current)/i.test(lower)) {
    const k = filteredStats.kpis;
    const topSeason = [...filteredStats.bySeason].sort((a, b) => b.runs - a.runs)[0];
    const topVenue = filteredStats.byVenue[0];
    const topOpp = filteredStats.byOpposition[0];
    const topFmt = filteredStats.byFormat[0];

    return {
      reply: `You're currently on the **${currentPage.toUpperCase()}** view with **${describeFilters(activeFilters)}**.\n\nAcross **${k.totalMatches} innings**, Harry Brook has scored **${k.totalRuns.toLocaleString()} runs** off **${k.totalBalls.toLocaleString()} balls** (Average: **${fmtAvg(k.battingAverage)}**, Strike Rate: **${k.strikeRate.toFixed(1)}**), hitting **${k.centuries} hundreds**, **${k.halfCenturies} fifties**, **${k.totalFours} fours**, and **${k.totalSixes} sixes** with a highest score of **${k.highestScore?.label ?? '—'}**.\n\n• **Top Format:** ${topFmt ? `${topFmt.key} (${topFmt.runs.toLocaleString()} runs)` : 'N/A'}\n• **Peak Season:** ${topSeason ? `${topSeason.key} (${topSeason.runs.toLocaleString()} runs)` : 'N/A'}\n• **Leading Venue:** ${topVenue ? `${topVenue.key} (${topVenue.runs.toLocaleString()} runs)` : 'N/A'}\n• **Leading Opponent:** ${topOpp ? `${topOpp.key} (${topOpp.runs.toLocaleString()} runs)` : 'N/A'}`,
      mode: 'demo',
      suggestedChart: buildChartForKey('format_comparison', filteredMatches),
      highlights: [
        `${k.totalMatches} Innings`,
        `${k.totalRuns.toLocaleString()} Runs`,
        `Win Rate ${k.winRate}%`,
      ],
      followUpSuggestions: [
        'Which season was his best?',
        'Which venue has his highest average?',
        'Filter the dashboard to ODI',
      ],
    };
  }

  // Filter / Show specific slice (format, season, opposition, venue, matchResult)
  if (
    wantsFilterCommand &&
    (matchedFormats.length > 0 ||
      matchedSeasons.length > 0 ||
      matchedOppositions.length > 0 ||
      matchedVenues.length > 0 ||
      matchedResults.length > 0)
  ) {
    const nextFilters: Partial<FilterState> = {};
    if (matchedFormats.length) nextFilters.formats = matchedFormats;
    if (matchedSeasons.length) nextFilters.seasons = matchedSeasons;
    if (matchedOppositions.length) nextFilters.oppositions = matchedOppositions;
    if (matchedVenues.length) nextFilters.venues = matchedVenues;
    if (matchedResults.length) nextFilters.matchResults = matchedResults;

    const mergedFilters: FilterState = {
      ...EMPTY_FILTERS,
      ...nextFilters,
    };
    const slice = filterMatches(allMatches, mergedFilters);
    const sliceStats = computeDashboardAnalytics(slice);
    const k = sliceStats.kpis;

    let targetPage: DashboardPageId | undefined;
    if (matchedOppositions.length && !matchedFormats.length && !matchedVenues.length) {
      targetPage = 'opposition';
    } else if (matchedVenues.length && !matchedOppositions.length) {
      targetPage = 'venues';
    } else if (matchedFormats.length && !matchedOppositions.length && !matchedVenues.length) {
      targetPage = 'formats';
    }

    const filterLabel = describeFilters(mergedFilters);
    if (slice.length === 0) {
      return {
        reply: `I applied **${filterLabel}**, though there are **0 matching innings** in the dataset for that exact combination. Try clearing one of the filters to widen the view.`,
        mode: 'demo',
        action: { type: 'apply_filters', filters: mergedFilters, page: targetPage, label: `Filtered: ${filterLabel}` },
      };
    }

    return {
      reply: `I've updated the dashboard to **${filterLabel}**${targetPage ? ` and switched to the **${targetPage}** view` : ''}.\n\nIn this selection (**${k.totalMatches} innings**), Harry Brook scored **${k.totalRuns.toLocaleString()} runs** at an average of **${fmtAvg(k.battingAverage)}** and a strike rate of **${k.strikeRate.toFixed(1)}**, with **${k.centuries} hundreds**, **${k.halfCenturies} fifties**, and a highest score of **${k.highestScore?.label ?? '—'}** (**${k.winRate}% win rate**).`,
      mode: 'demo',
      action: {
        type: 'apply_filters',
        filters: mergedFilters,
        page: targetPage,
        label: `Filtered: ${filterLabel}`,
      },
      suggestedChart:
        matchedOppositions.length
          ? buildChartForKey('season_runs', slice)
          : buildChartForKey('format_comparison', slice),
      highlights: [
        `${k.totalRuns.toLocaleString()} Runs`,
        `Avg ${fmtAvg(k.battingAverage)}`,
        `HS ${k.highestScore?.label ?? '—'}`,
      ],
      followUpSuggestions: [
        'Show his last five matches',
        'Clear all filters',
      ],
    };
  }

  // Compare formats (Test vs ODI, etc.)
  if (/compar(e|ing)|versus|\bvs\b/i.test(lower) && matchedFormats.length >= 2) {
    const scope = filteredMatches.length > 0 ? filteredMatches : allMatches;
    const stats = computeDashboardAnalytics(scope);
    const chosen = stats.byFormat.filter((f) => matchedFormats.includes(f.key));
    const breakdown = chosen
      .map(
        (f) =>
          `• **${f.key}**: **${f.runs.toLocaleString()} runs** in **${f.matches} innings**, Avg **${fmtAvg(f.average)}**, SR **${f.strikeRate.toFixed(1)}**, HS **${f.highestScoreLabel}**, ${f.centuries}×100 / ${f.halfCenturies}×50`,
      )
      .join('\n');

    return {
      reply: `Here's Harry Brook's **${matchedFormats.join(' vs ')}** comparison${isFiltered ? ` (under active filters)` : ''}:\n\n${breakdown}`,
      mode: 'demo',
      suggestedChart: {
        type: 'comparison',
        title: `${matchedFormats.join(' vs ')} Performance`,
        subtitle: 'Runs & Batting Average',
        nameKey: 'name',
        dataKey: 'runs',
        data: chosen.map((f) => ({
          name: f.key,
          runs: f.runs,
          average: f.average ?? 0,
          strikeRate: f.strikeRate,
        })),
      },
      highlights: chosen.map((f) => `${f.key}: ${f.runs.toLocaleString()} runs`),
      followUpSuggestions: [
        'Open Format Analysis page',
        'Filter the dashboard to ODI',
      ],
    };
  }

  // General format question
  if (/\b(format|formats|test|odi|t20|t20i)\b/i.test(lower) && !matchedOppositions.length && !matchedVenues.length) {
    const scope = filteredMatches.length > 0 ? filteredMatches : allMatches;
    const stats = computeDashboardAnalytics(scope);
    const breakdown = stats.byFormat
      .map(
        (f) =>
          `• **${f.key}**: **${f.runs.toLocaleString()} runs** (${f.matches} inn, Avg **${fmtAvg(f.average)}**, SR **${f.strikeRate.toFixed(1)}**, HS **${f.highestScoreLabel}**)`,
      )
      .join('\n');

    return {
      reply: `Across formats${isFiltered ? ` (current filters)` : ''}, ODI is Harry Brook's highest-volume format:\n\n${breakdown}`,
      mode: 'demo',
      suggestedChart: buildChartForKey('format_comparison', scope),
      highlights: stats.byFormat.map((f) => `${f.key}: ${f.runs} runs`),
      followUpSuggestions: [
        'Compare his Test and ODI performance',
        'Filter the dashboard to Test',
      ],
    };
  }

  // Venue highest average / venue performance
  if (/\b(venue|venues|ground|grounds|stadium|edgbaston|headingley|lord|oval|chennai|bristol|cardiff|birmingham|trent bridge|old trafford)\b/i.test(lower)) {
    const scope = filteredMatches.length > 0 ? filteredMatches : allMatches;
    const stats = computeDashboardAnalytics(scope);

    if (matchedVenues.length === 1) {
      const v = stats.byVenue.find((item) => item.key === matchedVenues[0]);
      if (v) {
        return {
          reply: `At **${v.key}**, Harry Brook has scored **${v.runs.toLocaleString()} runs** in **${v.matches} innings** at an average of **${fmtAvg(v.average)}** and a strike rate of **${v.strikeRate.toFixed(1)}** (HS **${v.highestScoreLabel}**, ${v.centuries}×100, ${v.halfCenturies}×50).`,
          mode: 'demo',
          suggestedChart: buildChartForKey('venue_average', scope),
          highlights: [`${v.key}: ${v.runs} runs`, `Avg ${fmtAvg(v.average)}`],
          followUpSuggestions: [`Filter the dashboard to ${v.key}`, 'Which venue has his highest average?'],
        };
      }
    }

    const withAvg = [...stats.byVenue].filter((v) => v.average !== null);
    const bestAvgVenue = [...withAvg].sort((a, b) => (b.average ?? 0) - (a.average ?? 0))[0];
    const mostRunsVenue = stats.byVenue[0];

    return {
      reply: `**${bestAvgVenue?.key ?? '—'}** holds Harry Brook's highest batting average at **${fmtAvg(bestAvgVenue?.average ?? null)}** (**${bestAvgVenue?.runs.toLocaleString()} runs** in ${bestAvgVenue?.matches} innings, HS **${bestAvgVenue?.highestScoreLabel}**).\n\nBy total volume, **${mostRunsVenue?.key ?? '—'}** leads with **${mostRunsVenue?.runs.toLocaleString()} runs** across ${mostRunsVenue?.matches} innings (Avg **${fmtAvg(mostRunsVenue?.average ?? null)}**).`,
      mode: 'demo',
      suggestedChart: buildChartForKey('venue_average', scope),
      highlights: [
        `Best Avg: ${bestAvgVenue?.key} (${fmtAvg(bestAvgVenue?.average ?? null)})`,
        `Most Runs: ${mostRunsVenue?.key} (${mostRunsVenue?.runs})`,
      ],
      followUpSuggestions: [
        'Which season was his best?',
        'Show his performance against Australia',
      ],
    };
  }

  // Best season / seasons
  if (/\b(season|seasons|year|years|2018|2019|2020|2021|2022|2023|2024|2025|2026)\b/i.test(lower)) {
    const scope = filteredMatches.length > 0 ? filteredMatches : allMatches;
    const stats = computeDashboardAnalytics(scope);

    if (matchedSeasons.length === 1) {
      const s = stats.bySeason.find((item) => Number(item.key) === matchedSeasons[0]);
      if (s) {
        return {
          reply: `In **${s.key}**, Harry Brook compiled **${s.runs.toLocaleString()} runs** across **${s.matches} innings** at an average of **${fmtAvg(s.average)}** and strike rate of **${s.strikeRate.toFixed(1)}** (HS **${s.highestScoreLabel}**, ${s.centuries} hundreds, ${s.halfCenturies} fifties).`,
          mode: 'demo',
          suggestedChart: buildChartForKey('season_runs', scope),
          highlights: [`${s.key}: ${s.runs} runs`, `Avg ${fmtAvg(s.average)}`],
          followUpSuggestions: [`Filter the dashboard to ${s.key}`, 'Which season was his best?'],
        };
      }
    }

    const bestRunsSeason = [...stats.bySeason].sort((a, b) => b.runs - a.runs)[0];
    const bestAvgSeason = [...stats.bySeason]
      .filter((s) => s.average !== null)
      .sort((a, b) => (b.average ?? 0) - (a.average ?? 0))[0];

    return {
      reply: `**${bestRunsSeason?.key ?? '—'}** was Harry Brook's standout season by run volume with **${bestRunsSeason?.runs.toLocaleString()} runs** in **${bestRunsSeason?.matches} innings** (Avg **${fmtAvg(bestRunsSeason?.average ?? null)}**, SR **${bestRunsSeason?.strikeRate.toFixed(1)}**, ${bestRunsSeason?.centuries}×100, ${bestRunsSeason?.halfCenturies}×50).${bestAvgSeason && bestAvgSeason.key !== bestRunsSeason?.key ? `\n\nBy batting average alone, **${bestAvgSeason.key}** topped the chart at **${fmtAvg(bestAvgSeason.average)}** (${bestAvgSeason.runs} runs across ${bestAvgSeason.matches} innings).` : ''}`,
      mode: 'demo',
      suggestedChart: buildChartForKey('season_runs', scope),
      highlights: [
        `Peak Season: ${bestRunsSeason?.key} (${bestRunsSeason?.runs} runs)`,
        `Best Avg Season: ${bestAvgSeason?.key} (${fmtAvg(bestAvgSeason?.average ?? null)})`,
      ],
      followUpSuggestions: [
        `Filter the dashboard to ${bestRunsSeason?.key}`,
        'Compare his Test and ODI performance',
      ],
    };
  }

  // Opposition query (specific opponent or general opposition)
  if (matchedOppositions.length > 0 || /\b(opponent|opponents|opposition|against|team|teams)\b/i.test(lower)) {
    const scope = filteredMatches.length > 0 ? filteredMatches : allMatches;
    const stats = computeDashboardAnalytics(scope);

    if (matchedOppositions.length === 1) {
      const oppName = matchedOppositions[0];
      const o = stats.byOpposition.find((item) => item.key === oppName);
      if (o) {
        return {
          reply: `Against **${o.key}**${isFiltered ? ' (current filters)' : ''}, Harry Brook has recorded **${o.runs.toLocaleString()} runs** in **${o.matches} innings** at an average of **${fmtAvg(o.average)}** and a strike rate of **${o.strikeRate.toFixed(1)}**, with a top score of **${o.highestScoreLabel}** (${o.centuries}×100, ${o.halfCenturies}×50, **${o.winRate}% win rate**).`,
          mode: 'demo',
          suggestedChart: buildChartForKey('opposition_runs', scope),
          highlights: [`vs ${o.key}: ${o.runs} runs`, `Avg ${fmtAvg(o.average)}`],
          followUpSuggestions: [
            `Filter the dashboard to ${o.key}`,
            'Which venue has his highest average?',
          ],
        };
      }
    }

    const bestOppRuns = stats.byOpposition[0];
    const bestOppAvg = [...stats.byOpposition]
      .filter((o) => o.average !== null)
      .sort((a, b) => (b.average ?? 0) - (a.average ?? 0))[0];

    return {
      reply: `Harry Brook's leading opponent by runs is **${bestOppRuns?.key ?? '—'}** (**${bestOppRuns?.runs.toLocaleString()} runs** in ${bestOppRuns?.matches} innings, Avg **${fmtAvg(bestOppRuns?.average ?? null)}**), while **${bestOppAvg?.key ?? '—'}** holds his highest batting average at **${fmtAvg(bestOppAvg?.average ?? null)}** (**${bestOppAvg?.runs.toLocaleString()} runs**).`,
      mode: 'demo',
      suggestedChart: buildChartForKey('opposition_runs', scope),
      highlights: [
        `Top Runs: vs ${bestOppRuns?.key} (${bestOppRuns?.runs})`,
        `Top Avg: vs ${bestOppAvg?.key} (${fmtAvg(bestOppAvg?.average ?? null)})`,
      ],
      followUpSuggestions: [
        'Show his performance against Australia',
        'Show his performance against India',
      ],
    };
  }

  // Runs / Average / Strike rate / Centuries / Fifties / Highest score / Profile / Dismissals
  if (/\b(dismiss|out|caught|bowled|lbw|stumped|run out)\b/i.test(lower)) {
    const scope = filteredMatches.length > 0 ? filteredMatches : allMatches;
    const stats = computeDashboardAnalytics(scope);
    const lines = stats.byDismissal.map((d) => `• **${d.dismissal}**: ${d.count} (${d.percentage}%)`).join('\n');
    return {
      reply: `Here is Harry Brook's dismissal profile across **${stats.kpis.totalMatches} innings**:\n\n${lines}`,
      mode: 'demo',
      highlights: stats.byDismissal.slice(0, 3).map((d) => `${d.dismissal}: ${d.count}`),
    };
  }

  if (/\b(who|profile|birth|age|style|role|dataset|authentic|real|synthetic)\b/i.test(lower)) {
    return {
      reply: `**${playerProfile.Full_Name}** (${playerProfile.Team}) is a **${playerProfile.Batting_Style}** **${playerProfile.Role}** born **${playerProfile.Date_of_Birth}** in **${playerProfile.Birthplace}**.\n\n*Dataset note:* ${playerProfile.Data_Status} — containing **${allMatches.length} batting innings** from ${options.seasons[0]} to ${options.seasons[options.seasons.length - 1]}.`,
      mode: 'demo',
      highlights: [playerProfile.Batting_Style, playerProfile.Role, `${allMatches.length} Innings`],
    };
  }

  // Default career / filtered stats summary (covers "How many runs did Harry Brook score?", "What is his average?", etc.)
  const k = filteredStats.kpis;
  const scopeLabel = isFiltered ? `under **${describeFilters(activeFilters)}**` : 'across the complete dataset';
  return {
    reply: `${scopeLabel.charAt(0).toUpperCase() + scopeLabel.slice(1)}, Harry Brook has scored **${k.totalRuns.toLocaleString()} runs** in **${k.totalMatches} innings** (${k.notOuts} not out) at a batting average of **${fmtAvg(k.battingAverage)}** and a strike rate of **${k.strikeRate.toFixed(1)}**.\n\nHe has hit **${k.centuries} centuries**, **${k.halfCenturies} half-centuries**, **${k.totalFours} fours**, and **${k.totalSixes} sixes**, with a highest score of **${k.highestScore?.label ?? '—'}**${k.highestScore ? ` vs ${k.highestScore.opposition} at ${k.highestScore.venue}` : ''}.`,
    mode: 'demo',
    suggestedChart: buildChartForKey('season_runs', filteredMatches),
    highlights: [
      `${k.totalRuns.toLocaleString()} Runs`,
      `Avg ${fmtAvg(k.battingAverage)}`,
      `SR ${k.strikeRate.toFixed(1)}`,
      `HS ${k.highestScore?.label ?? '—'}`,
    ],
    followUpSuggestions: [
      'Show his last five matches',
      'Which venue has his highest average?',
      'Compare his Test and ODI performance',
      'Which season was his best?',
    ],
  };
}

export async function askBrookyAI(
  req: BrookyChatRequest,
  allMatches: MatchRecord[],
  playerProfile: PlayerProfile,
): Promise<BrookyChatResponse> {
  const activeFilters = normalizeFilters(req.activeFilters);
  const currentPage: DashboardPageId = req.currentPage ?? 'overview';
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return detectIntentAndRespondDemo(req.message, allMatches, playerProfile, activeFilters, currentPage);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const filteredMatches = filterMatches(allMatches, activeFilters);
    const filteredAnalytics = computeDashboardAnalytics(filteredMatches);
    const overallAnalytics = computeDashboardAnalytics(allMatches);
    const filterOptions = getFilterOptions(allMatches);

    const dataContext = {
      playerProfile,
      currentPage,
      activeFilters: describeFilters(activeFilters),
      filterOptions,
      filteredSummary: {
        kpis: filteredAnalytics.kpis,
        byFormat: filteredAnalytics.byFormat,
        bySeason: filteredAnalytics.bySeason,
        byVenue: filteredAnalytics.byVenue,
        byOpposition: filteredAnalytics.byOpposition,
        byDismissal: filteredAnalytics.byDismissal,
        latestFive: filteredAnalytics.latestFive,
      },
      overallSummary: {
        kpis: overallAnalytics.kpis,
        byFormat: overallAnalytics.byFormat,
        bySeason: overallAnalytics.bySeason,
        byVenue: overallAnalytics.byVenue,
        byOpposition: overallAnalytics.byOpposition,
        latestFive: overallAnalytics.latestFive,
      },
    };

    const systemInstruction = `You are BROOKY, an intelligent, friendly, confident cricket performance analyst inspired by England batter Harry Brook.
STRICT RULES:
1. Only cite statistics explicitly present in the provided JSON dataContext. NEVER invent or estimate cricket statistics.
2. If the user asks for information not in the dataset (e.g., bowling, fielding, IPL salary, matches outside the dataset), politely explain that the dataset only tracks these ${allMatches.length} batting innings and list what fields are available.
3. Notice Data_Status: "${playerProfile.Data_Status}". Stay transparent if asked about data authenticity.
4. Keep responses concise, sharp, insightful, and conversational (suitable both to read and to be spoken aloud via text-to-speech).
5. You can trigger dashboard actions when the user asks to filter or navigate (e.g. "Filter the dashboard to ODI", "Show his last five matches", "Show his performance against Australia").`;

    const conversationExcerpt = (req.history ?? [])
      .slice(-6)
      .map((h) => `${h.role === 'user' ? 'User' : 'Brooky'}: ${h.text}`)
      .join('\n');

    const prompt = `${conversationExcerpt ? `Recent conversation:\n${conversationExcerpt}\n\n` : ''}Verified Dashboard Data Snapshot:\n${JSON.stringify(dataContext)}\n\nUser question: "${req.message}"`;

    const response = await ai.interactions.create({
      model: 'gemini-3.8-flash',
      system_instruction: systemInstruction,
      input: prompt,
      response_format: {
        type: 'object',
        properties: {
          reply: { type: 'string', description: 'Natural language response using exact figures from the dataset.' },
          actionType: { type: 'string', enum: ['none', 'apply_filters', 'clear_filters', 'navigate'] },
          actionPage: {
            type: 'string',
            enum: ['none', 'overview', 'performance', 'matches', 'venues', 'opposition', 'formats', 'recent', 'brooky'],
          },
          filterFormat: { type: 'array', items: { type: 'string' } },
          filterSeason: { type: 'array', items: { type: 'number' } },
          filterOpposition: { type: 'array', items: { type: 'string' } },
          filterVenue: { type: 'array', items: { type: 'string' } },
          filterMatchResult: { type: 'array', items: { type: 'string' } },
          suggestedChartKey: {
            type: 'string',
            enum: ['none', 'format_comparison', 'season_runs', 'venue_average', 'opposition_runs', 'recent_five'],
          },
          highlights: { type: 'array', items: { type: 'string' } },
          followUpSuggestions: { type: 'array', items: { type: 'string' } },
        },
        required: ['reply', 'actionType', 'actionPage', 'suggestedChartKey'],
      },
    });

    const rawText = response.output_text ?? '';
    const parsed = JSON.parse(rawText) as {
      reply: string;
      actionType: 'none' | 'apply_filters' | 'clear_filters' | 'navigate';
      actionPage: DashboardPageId | 'none';
      filterFormat?: string[];
      filterSeason?: number[];
      filterOpposition?: string[];
      filterVenue?: string[];
      filterMatchResult?: string[];
      suggestedChartKey: string;
      highlights?: string[];
      followUpSuggestions?: string[];
    };

    let action: BrookyAction | undefined;
    if (parsed.actionType === 'clear_filters') {
      action = { type: 'clear_filters', label: 'Cleared all filters' };
    } else if (parsed.actionType === 'apply_filters') {
      const nextFilters: Partial<FilterState> = {
        formats: (parsed.filterFormat ?? []).filter((f) => filterOptions.formats.includes(f)),
        seasons: (parsed.filterSeason ?? []).filter((s) => filterOptions.seasons.includes(s)),
        oppositions: (parsed.filterOpposition ?? []).filter((o) => filterOptions.oppositions.includes(o)),
        venues: (parsed.filterVenue ?? []).filter((v) => filterOptions.venues.includes(v)),
        matchResults: (parsed.filterMatchResult ?? []).filter((r) => filterOptions.matchResults.includes(r)),
      };
      action = {
        type: 'apply_filters',
        filters: nextFilters,
        page: parsed.actionPage !== 'none' ? parsed.actionPage : undefined,
        label: `Applied filters`,
      };
    } else if (parsed.actionType === 'navigate' && parsed.actionPage !== 'none') {
      action = {
        type: 'navigate',
        page: parsed.actionPage,
        label: `Navigated to ${parsed.actionPage}`,
      };
    }

    const chartSource =
      action?.type === 'apply_filters'
        ? filterMatches(allMatches, { ...EMPTY_FILTERS, ...action.filters })
        : action?.type === 'clear_filters'
          ? allMatches
          : filteredMatches;

    return {
      reply: parsed.reply,
      mode: 'gemini',
      action,
      suggestedChart:
        parsed.suggestedChartKey !== 'none'
          ? buildChartForKey(parsed.suggestedChartKey, chartSource)
          : undefined,
      highlights: parsed.highlights?.slice(0, 4),
      followUpSuggestions: parsed.followUpSuggestions?.slice(0, 4),
    };
  } catch (err) {
    console.warn('Gemini call failed, falling back to Smart Analytics Demonstration Mode:', err);
    return detectIntentAndRespondDemo(req.message, allMatches, playerProfile, activeFilters, currentPage);
  }
}
