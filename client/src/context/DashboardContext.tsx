import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  computeDashboardAnalytics,
  countActiveFilters,
  EMPTY_FILTERS,
  filterMatches,
  getFilterOptions,
} from '../utils/analytics';
import { soundEngine } from '../utils/soundEngine';
import type {
  DashboardAnalytics,
  DashboardPageId,
  FilterOptions,
  FilterState,
  MatchRecord,
  PlayerProfile,
} from '../types/cricket';

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  tag: string;
  actionPage?: DashboardPageId;
}

interface DashboardContextValue {
  loading: boolean;
  error: string | null;
  showSplash: boolean;
  dismissSplash: () => void;
  playerProfile: PlayerProfile | null;
  allMatches: MatchRecord[];
  filteredMatches: MatchRecord[];
  filterOptions: FilterOptions;
  filters: FilterState;
  activeFilterCount: number;
  analytics: DashboardAnalytics;
  overallAnalytics: DashboardAnalytics;
  activePage: DashboardPageId;
  setActivePage: (page: DashboardPageId) => void;
  selectedMatch: MatchRecord | null;
  setSelectedMatch: (match: MatchRecord | null) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileNavOpen: boolean;
  setMobileNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  ttsEnabled: boolean;
  toggleTts: () => void;
  aiMode: 'gemini' | 'demo';
  sourceFile: string;
  notifications: NotificationItem[];
  toggleFilterValue: <K extends keyof FilterState>(key: K, value: FilterState[K][number]) => void;
  applyFilters: (partial: Partial<FilterState>, replace?: boolean) => void;
  clearFilters: () => void;
  reloadDataset: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  seasons: [],
  formats: [],
  oppositions: [],
  venues: [],
  matchResults: [],
  innings: [],
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [allMatches, setAllMatches] = useState<MatchRecord[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(DEFAULT_FILTER_OPTIONS);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [activePage, setActivePageState] = useState<DashboardPageId>('overview');
  const [selectedMatch, setSelectedMatch] = useState<MatchRecord | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('brooky_theme') === 'dark' ? 'dark' : 'light';
    }
    return 'light';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => soundEngine.isEnabled());
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('brooky_tts_enabled') !== 'false';
    }
    return true;
  });
  const [aiMode, setAiMode] = useState<'gemini' | 'demo'>('demo');
  const [sourceFile, setSourceFile] = useState('Harry_Brook_Tableau_Public_Corrected_Dataset.xlsx');

  const fetchDataset = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dataset');
      if (!res.ok) {
        throw new Error(`Dataset request failed (${res.status})`);
      }
      const data = await res.json();
      setPlayerProfile(data.playerProfile);
      setAllMatches(data.matches);
      setFilterOptions(data.filterOptions ?? getFilterOptions(data.matches));
      setAiMode(data.aiMode === 'gemini' ? 'gemini' : 'demo');
      if (data.sourceFile) setSourceFile(data.sourceFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load cricket dataset');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const startTime = Date.now();
    fetchDataset().then(() => {
      const elapsed = Date.now() - startTime;
      const minSplashMs = 1150;
      const remaining = Math.max(0, minSplashMs - elapsed);
      window.setTimeout(() => {
        setShowSplash(false);
      }, remaining);
    });
  }, [fetchDataset]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark-theme', theme === 'dark');
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('brooky_theme', theme);
    }
  }, [theme]);

  const filteredMatches = useMemo(() => filterMatches(allMatches, filters), [allMatches, filters]);
  const analytics = useMemo(() => computeDashboardAnalytics(filteredMatches), [filteredMatches]);
  const overallAnalytics = useMemo(() => computeDashboardAnalytics(allMatches), [allMatches]);
  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  const notifications = useMemo<NotificationItem[]>(() => {
    if (allMatches.length === 0) return [];
    const peakSeason = [...overallAnalytics.bySeason].sort((a, b) => b.runs - a.runs)[0];
    const bestAvgVenue = [...overallAnalytics.byVenue]
      .filter((v) => v.average !== null)
      .sort((a, b) => (b.average ?? 0) - (a.average ?? 0))[0];
    const latest = overallAnalytics.latestFive[0];
    const hs = overallAnalytics.kpis.highestScore;

    return [
      {
        id: 'peak-season',
        title: `Peak Season: ${peakSeason?.key ?? '2024'}`,
        detail: `${peakSeason?.runs.toLocaleString() ?? '986'} runs across ${peakSeason?.matches ?? 0} innings at Avg ${peakSeason?.average?.toFixed(2) ?? '—'}.`,
        tag: 'Performance',
        actionPage: 'performance',
      },
      {
        id: 'venue-leader',
        title: `Highest Venue Avg: ${bestAvgVenue?.key ?? 'Edgbaston'}`,
        detail: `Averaging ${bestAvgVenue?.average?.toFixed(2) ?? '—'} with ${bestAvgVenue?.runs.toLocaleString() ?? '0'} runs at this ground.`,
        tag: 'Venues',
        actionPage: 'venues',
      },
      {
        id: 'career-hs',
        title: `Career High Score: ${hs?.label ?? '150'}`,
        detail: hs ? `Scored vs ${hs.opposition} at ${hs.venue} (${hs.format}, ${hs.date}).` : '',
        tag: 'Milestone',
        actionPage: 'matches',
      },
      {
        id: 'latest-match',
        title: `Latest Match (${latest?.Match_Date ?? ''})`,
        detail: latest ? `${latest.Runs} (${latest.Balls_Faced}b) vs ${latest.Opposition} — ${latest.Match_Result}` : '',
        tag: 'Recent',
        actionPage: 'recent',
      },
    ];
  }, [allMatches.length, overallAnalytics]);

  const setActivePage = useCallback((page: DashboardPageId) => {
    soundEngine.markUserInteracted();
    soundEngine.play('nav');
    setActivePageState(page);
    setMobileNavOpen(false);
  }, []);

  const toggleFilterValue = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K][number]) => {
      soundEngine.markUserInteracted();
      soundEngine.play('filter');
      setFilters((prev) => {
        const list = prev[key] as Array<FilterState[K][number]>;
        const exists = list.includes(value);
        const nextList = exists ? list.filter((item) => item !== value) : [...list, value];
        return { ...prev, [key]: nextList };
      });
    },
    [],
  );

  const applyFilters = useCallback((partial: Partial<FilterState>, replace = true) => {
    soundEngine.markUserInteracted();
    soundEngine.play('filter');
    setFilters((prev) => ({
      ...(replace ? EMPTY_FILTERS : prev),
      ...partial,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    soundEngine.markUserInteracted();
    soundEngine.play('filter');
    setFilters(EMPTY_FILTERS);
  }, []);

  const toggleTheme = useCallback(() => {
    soundEngine.markUserInteracted();
    soundEngine.play('click');
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const toggleSound = useCallback(() => {
    soundEngine.markUserInteracted();
    const next = !soundEnabled;
    soundEngine.setEnabled(next);
    setSoundEnabled(next);
  }, [soundEnabled]);

  const toggleTts = useCallback(() => {
    soundEngine.markUserInteracted();
    soundEngine.play('click');
    setTtsEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('brooky_tts_enabled', String(next));
        if (!next && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      }
      return next;
    });
  }, []);

  const dismissSplash = useCallback(() => {
    soundEngine.markUserInteracted();
    setShowSplash(false);
  }, []);

  const value: DashboardContextValue = {
    loading,
    error,
    showSplash,
    dismissSplash,
    playerProfile,
    allMatches,
    filteredMatches,
    filterOptions,
    filters,
    activeFilterCount,
    analytics,
    overallAnalytics,
    activePage,
    setActivePage,
    selectedMatch,
    setSelectedMatch,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileNavOpen,
    setMobileNavOpen,
    theme,
    toggleTheme,
    soundEnabled,
    toggleSound,
    ttsEnabled,
    toggleTts,
    aiMode,
    sourceFile,
    notifications,
    toggleFilterValue,
    applyFilters,
    clearFilters,
    reloadDataset: fetchDataset,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}
