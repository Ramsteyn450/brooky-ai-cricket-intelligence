export interface MatchRecord {
  Match_ID: string;
  Match_Date: string;
  Season: number;
  Format: string;
  Opposition: string;
  Venue: string;
  Innings: number;
  Runs: number;
  Balls_Faced: number;
  Fours: number;
  Sixes: number;
  Dismissal: string;
  Not_Out_Flag: number;
  Strike_Rate: number;
  Match_Result: string;
}

export interface PlayerProfile {
  Player: string;
  Full_Name: string;
  Team: string;
  Batting_Style: string;
  Role: string;
  Date_of_Birth: string;
  Birthplace: string;
  Data_Status: string;
}

export interface FilterState {
  seasons: number[];
  formats: string[];
  oppositions: string[];
  venues: string[];
  matchResults: string[];
  innings: number[];
}

export interface HighestScoreInfo {
  runs: number;
  notOut: boolean;
  label: string;
  matchId: string;
  opposition: string;
  venue: string;
  format: string;
  date: string;
}

export interface KpiSummary {
  totalMatches: number;
  totalRuns: number;
  totalBalls: number;
  notOuts: number;
  dismissals: number;
  battingAverage: number | null;
  strikeRate: number;
  centuries: number;
  halfCenturies: number;
  highestScore: HighestScoreInfo | null;
  totalFours: number;
  totalSixes: number;
  totalBoundaries: number;
  boundaryRuns: number;
  boundaryRunPct: number;
  winCount: number;
  lossCount: number;
  drawCount: number;
  noResultCount: number;
  winRate: number;
  fiftyPlusRate: number;
}

export interface GroupedPerformance {
  key: string;
  matches: number;
  runs: number;
  balls: number;
  notOuts: number;
  dismissals: number;
  average: number | null;
  strikeRate: number;
  highestScore: number;
  highestScoreNotOut: boolean;
  highestScoreLabel: string;
  centuries: number;
  halfCenturies: number;
  fours: number;
  sixes: number;
  wins: number;
  winRate: number;
}

export interface ProgressionPoint {
  index: number;
  Match_ID: string;
  Match_Date: string;
  label: string;
  Format: string;
  Opposition: string;
  Venue: string;
  Runs: number;
  Balls_Faced: number;
  Strike_Rate: number;
  Not_Out_Flag: number;
  Match_Result: string;
  cumulativeRuns: number;
  cumulativeAverage: number | null;
}

export interface DismissalStat {
  dismissal: string;
  count: number;
  percentage: number;
}

export interface ScoreBracketStat {
  bracket: string;
  count: number;
  runs: number;
  percentage: number;
}

export interface DashboardAnalytics {
  kpis: KpiSummary;
  bySeason: GroupedPerformance[];
  byFormat: GroupedPerformance[];
  byVenue: GroupedPerformance[];
  byOpposition: GroupedPerformance[];
  byInnings: GroupedPerformance[];
  byDismissal: DismissalStat[];
  scoreBrackets: ScoreBracketStat[];
  progression: ProgressionPoint[];
  latestFive: MatchRecord[];
}

export type DashboardPageId =
  | 'overview'
  | 'performance'
  | 'matches'
  | 'venues'
  | 'opposition'
  | 'formats'
  | 'recent'
  | 'brooky';

export interface BrookyAction {
  type: 'apply_filters' | 'clear_filters' | 'navigate';
  page?: DashboardPageId;
  filters?: Partial<FilterState>;
  label?: string;
}

export interface BrookyChartSpec {
  type: 'bar' | 'line' | 'pie' | 'comparison';
  title: string;
  subtitle?: string;
  dataKey: string;
  nameKey: string;
  data: Array<Record<string, string | number>>;
}

export interface BrookyChatResponse {
  reply: string;
  mode: 'gemini' | 'demo';
  action?: BrookyAction;
  suggestedChart?: BrookyChartSpec;
  highlights?: string[];
  followUpSuggestions?: string[];
}
