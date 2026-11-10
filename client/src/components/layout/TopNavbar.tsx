import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Bot,
  Menu,
  Moon,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Sun,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useBrooky } from '../../context/BrookyContext';
import { NAV_ITEMS } from './Sidebar';
import { soundEngine } from '../../utils/soundEngine';
import type { DashboardPageId } from '../../types/cricket';

export const TopNavbar: React.FC = () => {
  const {
    activePage,
    setActivePage,
    setMobileNavOpen,
    theme,
    toggleTheme,
    soundEnabled,
    toggleSound,
    ttsEnabled,
    toggleTts,
    notifications,
    playerProfile,
    filterOptions,
    allMatches,
    applyFilters,
    setSelectedMatch,
    aiMode,
  } = useDashboard();
  const { sendMessage, openFloating } = useBrooky();

  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (rightRef.current && !rightRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
        setSettingsOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const currentNav = NAV_ITEMS.find((n) => n.id === activePage) ?? NAV_ITEMS[0];

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { pages: [], oppositions: [], venues: [], formats: [], matches: [] };

    const pages = NAV_ITEMS.filter(
      (n) => n.label.toLowerCase().includes(q) || n.shortLabel.toLowerCase().includes(q),
    );
    const oppositions = filterOptions.oppositions.filter((o) => o.toLowerCase().includes(q));
    const venues = filterOptions.venues.filter((v) => v.toLowerCase().includes(q));
    const formats = filterOptions.formats.filter((f) => f.toLowerCase().includes(q));
    const matches = allMatches
      .filter(
        (m) =>
          m.Match_ID.toLowerCase().includes(q) ||
          m.Opposition.toLowerCase().includes(q) ||
          m.Venue.toLowerCase().includes(q) ||
          String(m.Runs) === q,
      )
      .slice(0, 4);

    return { pages, oppositions, venues, formats, matches };
  }, [allMatches, filterOptions, searchQuery]);

  const hasSearchHits =
    searchResults.pages.length > 0 ||
    searchResults.oppositions.length > 0 ||
    searchResults.venues.length > 0 ||
    searchResults.formats.length > 0 ||
    searchResults.matches.length > 0;

  const handleAskFromSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    setSearchQuery('');
    openFloating();
    sendMessage(q);
  };

  return (
    <header
      className={[
        'sticky top-0 z-30 border-b backdrop-blur-md transition-colors',
        isDark
          ? 'bg-[#0B1424]/92 border-[#1E3557] text-white'
          : 'bg-white/92 border-[#E1E7F0] text-[#102B50]',
      ].join(' ')}
    >
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Mobile Menu + Active View Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.play('click');
              setMobileNavOpen(true);
            }}
            className={`lg:hidden p-2 rounded-xl border cursor-pointer ${
              isDark ? 'border-[#1E3557] hover:bg-[#173F70]/40' : 'border-[#E1E7F0] hover:bg-[#F3F5F9]'
            }`}
            aria-label="Open navigation menu"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight truncate">
                {currentNav.label}
              </h2>
              <span
                className={`hidden sm:inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full ${
                  isDark
                    ? 'bg-[#173F70]/60 text-blue-100 border border-[#2A5FA0]/50'
                    : 'bg-[#102B50]/8 text-[#102B50]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#D7193F]" />
                Harry Brook · England
              </span>
            </div>
          </div>
        </div>

        {/* Center: Global Search & Ask Brooky Command Input */}
        <div ref={searchRef} className="relative hidden md:block flex-1 max-w-md">
          <div
            className={[
              'flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all',
              isDark
                ? 'bg-[#111F38] border-[#1E3557] focus-within:border-[#D7193F]'
                : 'bg-[#F3F5F9] border-[#E1E7F0] focus-within:bg-white focus-within:border-[#173F70] focus-within:shadow-sm',
            ].join(' ')}
          >
            <Search className="w-4 h-4 opacity-55 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  handleAskFromSearch();
                }
              }}
              placeholder="Search opponents, venues, pages or ask Brooky..."
              className="w-full bg-transparent text-xs sm:text-[13px] outline-none placeholder:opacity-60"
            />
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={handleAskFromSearch}
                className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-[#D7193F] text-white text-[11px] font-semibold hover:bg-[#b81435] cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-white" />
                Ask
              </button>
            )}
          </div>

          <AnimatePresence>
            {searchOpen && searchQuery.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.16 }}
                className={[
                  'absolute left-0 right-0 mt-2 rounded-2xl border shadow-xl p-2 z-50 max-h-80 overflow-y-auto',
                  isDark ? 'bg-[#111F38] border-[#1E3557]' : 'bg-white border-[#E1E7F0]',
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={handleAskFromSearch}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold bg-[#102B50]/8 hover:bg-[#102B50]/15 text-[#102B50] dark:bg-[#173F70]/50 dark:text-white cursor-pointer mb-1"
                >
                  <Bot className="w-4 h-4 text-[#D7193F]" />
                  <span>Ask Brooky AI: &ldquo;{searchQuery.trim()}&rdquo;</span>
                </button>

                {hasSearchHits ? (
                  <div className="space-y-1 text-xs">
                    {searchResults.pages.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setActivePage(p.id as DashboardPageId);
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      >
                        <span className="font-medium">Go to {p.label}</span>
                        <span className="text-[10px] uppercase opacity-60">Page</span>
                      </button>
                    ))}
                    {searchResults.oppositions.map((opp) => (
                      <button
                        key={opp}
                        type="button"
                        onClick={() => {
                          applyFilters({ oppositions: [opp] }, false);
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      >
                        <span className="font-medium">Filter Opposition: {opp}</span>
                        <span className="text-[10px] uppercase text-[#D7193F] font-semibold">Filter</span>
                      </button>
                    ))}
                    {searchResults.venues.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          applyFilters({ venues: [v] }, false);
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      >
                        <span className="font-medium">Filter Venue: {v}</span>
                        <span className="text-[10px] uppercase text-[#D7193F] font-semibold">Filter</span>
                      </button>
                    ))}
                    {searchResults.formats.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          applyFilters({ formats: [f] }, false);
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      >
                        <span className="font-medium">Filter Format: {f}</span>
                        <span className="text-[10px] uppercase text-[#D7193F] font-semibold">Filter</span>
                      </button>
                    ))}
                    {searchResults.matches.map((m) => (
                      <button
                        key={m.Match_ID}
                        type="button"
                        onClick={() => {
                          soundEngine.play('click');
                          setSelectedMatch(m);
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      >
                        <span className="font-medium">
                          {m.Match_ID} — {m.Runs} ({m.Format} vs {m.Opposition})
                        </span>
                        <span className="text-[10px] uppercase opacity-60">Match</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-2 text-xs opacity-65">Press Enter to ask Brooky AI directly.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Controls: Sound ON/OFF, Theme, Notifications, Settings, Profile */}
        <div ref={rightRef} className="flex items-center gap-1.5 sm:gap-2 relative">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Mute UI sound effects' : 'Enable UI sound effects'}
            title={soundEnabled ? 'Sound Effects: ON' : 'Sound Effects: OFF'}
            className={[
              'flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer',
              soundEnabled
                ? isDark
                  ? 'bg-[#173F70]/65 border-[#2C62A3] text-white'
                  : 'bg-[#102B50]/8 border-[#102B50]/20 text-[#102B50]'
                : isDark
                  ? 'border-[#1E3557] text-slate-400 hover:text-white'
                  : 'border-[#E1E7F0] text-[#5E7290] hover:text-[#102B50]',
            ].join(' ')}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#D7193F]" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden xl:inline">{soundEnabled ? 'Sound On' : 'Muted'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            title={isDark ? 'Switch to Light England Theme' : 'Switch to Dark Navy Theme'}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#1E3557] hover:bg-[#173F70]/60 text-white'
                : 'border-[#E1E7F0] hover:bg-[#F3F5F9] text-[#102B50]'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4 text-[#D7193F]" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                soundEngine.play('click');
                setNotifOpen((p) => !p);
                setSettingsOpen(false);
                setProfileOpen(false);
              }}
              aria-label="Cricket intelligence notifications"
              className={`relative p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#1E3557] hover:bg-[#173F70]/60'
                  : 'border-[#E1E7F0] hover:bg-[#F3F5F9]'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D7193F]" />
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className={[
                    'absolute right-0 mt-2 w-80 rounded-2xl border shadow-xl p-3 z-50',
                    isDark ? 'bg-[#111F38] border-[#1E3557]' : 'bg-white border-[#E1E7F0]',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between px-1 pb-2 border-b border-black/8 dark:border-white/10">
                    <span className="text-xs font-bold uppercase tracking-wider">Dataset Alerts</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#102B50] text-white">
                      {notifications.length} Insights
                    </span>
                  </div>
                  <div className="mt-2 space-y-1.5 max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          if (n.actionPage) setActivePage(n.actionPage);
                          setNotifOpen(false);
                        }}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-[#F3F5F9] dark:hover:bg-[#173F70]/45 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold">{n.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#D7193F]/12 text-[#D7193F] font-semibold">
                            {n.tag}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-75 mt-1 leading-snug">{n.detail}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Settings */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                soundEngine.play('click');
                setSettingsOpen((p) => !p);
                setNotifOpen(false);
                setProfileOpen(false);
              }}
              aria-label="Platform settings"
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#1E3557] hover:bg-[#173F70]/60'
                  : 'border-[#E1E7F0] hover:bg-[#F3F5F9]'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className={[
                    'absolute right-0 mt-2 w-72 rounded-2xl border shadow-xl p-4 z-50 space-y-3',
                    isDark ? 'bg-[#111F38] border-[#1E3557]' : 'bg-white border-[#E1E7F0]',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2 pb-2 border-b border-black/8 dark:border-white/10">
                    <SlidersHorizontal className="w-4 h-4 text-[#D7193F]" />
                    <span className="text-xs font-bold uppercase tracking-wider">Preferences</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold">UI Sound Effects</p>
                      <p className="text-[11px] opacity-65">Subtle click & filter tones</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleSound}
                      className={`px-2.5 py-1 rounded-full font-bold text-[11px] cursor-pointer ${
                        soundEnabled ? 'bg-[#102B50] text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {soundEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold">Brooky Voice Output</p>
                      <p className="text-[11px] opacity-65">Read AI replies aloud</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleTts}
                      className={`px-2.5 py-1 rounded-full font-bold text-[11px] cursor-pointer ${
                        ttsEnabled ? 'bg-[#102B50] text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {ttsEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold">Appearance Theme</p>
                      <p className="text-[11px] opacity-65">Light White or Dark Navy</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-[#D7193F] text-white cursor-pointer"
                    >
                      {isDark ? 'Dark' : 'Light'}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-black/8 dark:border-white/10 text-[11px] opacity-75 flex items-center justify-between">
                    <span>AI Engine</span>
                    <span className="font-semibold text-[#D7193F]">
                      {aiMode === 'gemini' ? 'Gemini 3.8 Flash' : 'Smart Demo Mode'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                soundEngine.play('click');
                setProfileOpen((p) => !p);
                setNotifOpen(false);
                setSettingsOpen(false);
              }}
              className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#1E3557] hover:bg-[#173F70]/60'
                  : 'border-[#E1E7F0] hover:bg-[#F3F5F9]'
              }`}
            >
              <img
                src="/avatars/brooky-idle.jpg"
                alt="Harry Brook"
                className="w-7 h-7 rounded-lg object-cover object-top"
              />
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-xs font-bold">{playerProfile?.Player ?? 'Harry Brook'}</p>
                <p className="text-[10px] opacity-65">{playerProfile?.Team ?? 'England'}</p>
              </div>
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className={[
                    'absolute right-0 mt-2 w-72 rounded-2xl border shadow-xl p-4 z-50',
                    isDark ? 'bg-[#111F38] border-[#1E3557]' : 'bg-white border-[#E1E7F0]',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3 pb-3 border-b border-black/8 dark:border-white/10">
                    <img
                      src="/avatars/brooky-idle.jpg"
                      alt="Harry Brook"
                      className="w-12 h-12 rounded-xl object-cover object-top border-2 border-[#D7193F]"
                    />
                    <div>
                      <p className="text-sm font-bold">{playerProfile?.Full_Name ?? 'Harry Cherrington Brook'}</p>
                      <p className="text-xs text-[#D7193F] font-semibold">
                        {playerProfile?.Team ?? 'England'} · {playerProfile?.Role ?? 'Top-order batter'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="opacity-65 flex items-center gap-1"><User className="w-3.5 h-3.5" /> Batting</span>
                      <span className="font-semibold">{playerProfile?.Batting_Style ?? 'Right-hand bat'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-65">Born</span>
                      <span className="font-semibold">{playerProfile?.Date_of_Birth ?? '1999-02-22'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-65">Birthplace</span>
                      <span className="font-semibold">{playerProfile?.Birthplace ?? 'Keighley, England'}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-black/8 dark:border-white/10 text-[10.5px] opacity-70">
                    Status: {playerProfile?.Data_Status ?? 'Synthetic dashboard demonstration data'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
