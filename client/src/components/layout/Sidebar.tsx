import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Bot,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Swords,
  X,
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import type { DashboardPageId } from '../../types/cricket';
import { soundEngine } from '../../utils/soundEngine';

export interface NavItem {
  id: DashboardPageId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: LayoutDashboard },
  { id: 'performance', label: 'Performance Analysis', shortLabel: 'Performance', icon: Activity },
  { id: 'matches', label: 'Match Analysis', shortLabel: 'Matches', icon: ListChecks },
  { id: 'venues', label: 'Venue Analysis', shortLabel: 'Venues', icon: MapPin },
  { id: 'opposition', label: 'Opposition Analysis', shortLabel: 'Opposition', icon: Swords },
  { id: 'formats', label: 'Format Analysis', shortLabel: 'Formats', icon: Layers },
  { id: 'recent', label: 'Recent Matches', shortLabel: 'Recent', icon: Clock, badge: '5' },
  { id: 'brooky', label: 'Brooky AI Assistant', shortLabel: 'Brooky AI', icon: Bot, badge: 'AI' },
];

export const Sidebar: React.FC = () => {
  const {
    activePage,
    setActivePage,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileNavOpen,
    setMobileNavOpen,
    playerProfile,
    allMatches,
  } = useDashboard();

  const renderNavContent = (mobile = false) => {
    const collapsed = !mobile && sidebarCollapsed;

    return (
      <div className="flex flex-col h-full justify-between py-4 px-3 select-none text-white">
        <div>
          {/* Brand Header */}
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-2 mb-6`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#D7193F] text-white flex items-center justify-center font-extrabold text-sm shadow-sm shrink-0 border border-white/20">
                HB
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="font-display font-extrabold text-[15px] tracking-tight leading-none flex items-center gap-1.5 text-white">
                    <span>BROOKY</span>
                    <span className="text-[#D7193F]">AI</span>
                  </div>
                  <p className="text-[10.5px] font-medium truncate mt-0.5 text-blue-200/80">
                    Cricket Intelligence Platform
                  </p>
                </div>
              )}
            </div>

            {mobile ? (
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundEngine.play('click');
                  setSidebarCollapsed((prev) => !prev);
                }}
                className="p-1.5 rounded-lg border border-white/15 hover:bg-[#173F70] text-blue-100 transition-colors cursor-pointer"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* Menu section label */}
          {!collapsed && (
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-200/60">
              England Analytics
            </div>
          )}

          {/* Nav items */}
          <nav className="space-y-1" aria-label="Dashboard modules">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePage(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={[
                    'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors cursor-pointer',
                    collapsed ? 'justify-center' : 'justify-between',
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-blue-100/80 hover:text-white hover:bg-[#173F70]/75',
                  ].join(' ')}
                >
                  {isActive && (
                    <motion.span
                      layoutId={mobile ? 'mobileSidebarActivePill' : 'sidebarActivePill'}
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-xl bg-[#D7193F] shadow-md shadow-[#D7193F]/25"
                    />
                  )}

                  <span className="relative z-10 flex items-center gap-3 min-w-0">
                    <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-white' : 'text-blue-200'}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </span>

                  {!collapsed && item.badge && (
                    <span
                      className={[
                        'relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono-num',
                        isActive
                          ? 'bg-white text-[#D7193F]'
                          : item.id === 'brooky'
                            ? 'bg-[#D7193F] text-white'
                            : 'bg-[#173F70] text-blue-100',
                      ].join(' ')}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Player & Brooky Spotlight Card */}
        {!collapsed ? (
          <div className="mt-6 rounded-2xl bg-[#173F70] text-white p-4 relative overflow-hidden border border-white/15">
            <svg
              className="absolute inset-0 w-full h-full opacity-15 pointer-events-none"
              viewBox="0 0 240 160"
              fill="none"
            >
              <circle cx="200" cy="25" r="55" stroke="#D7193F" strokeWidth="1.2" />
              <path d="M-10 120 Q 90 70 250 130" stroke="#FFFFFF" strokeWidth="0.9" />
            </svg>
            <div className="relative z-10 flex items-center gap-3">
              <img
                src="/avatars/brooky-idle.jpg"
                alt="Harry Brook 3D Avatar"
                className="w-10 h-10 rounded-full object-cover object-top border-2 border-[#D7193F] shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{playerProfile?.Player ?? 'Harry Brook'}</p>
                <p className="text-[11px] text-blue-100/85 truncate">
                  {playerProfile?.Team ?? 'England'} · {allMatches.length} Innings
                </p>
              </div>
            </div>
            <p className="relative z-10 mt-2.5 text-[10.5px] leading-relaxed text-blue-100/75">
              {playerProfile?.Data_Status ?? 'Synthetic dashboard demonstration data'}
            </p>
            <button
              type="button"
              onClick={() => setActivePage('brooky')}
              className="relative z-10 mt-3 w-full py-2 rounded-xl bg-[#D7193F] hover:bg-[#b81435] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Launch Brooky Studio
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setActivePage('brooky')}
            title="Launch Brooky AI Assistant"
            className="mx-auto w-11 h-11 rounded-full overflow-hidden border-2 border-[#D7193F] hover:scale-105 transition-transform cursor-pointer"
          >
            <img
              src="/avatars/brooky-idle.jpg"
              alt="Brooky AI"
              className="w-full h-full object-cover object-top"
            />
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sticky Navy Blue Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 82 : 264 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:block shrink-0 h-screen sticky top-0 bg-[#102B50] border-r border-[#173F70] z-30 shadow-lg"
      >
        {renderNavContent(false)}
      </motion.aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              key="mobile-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 z-50 bg-[#0B1424]/55 backdrop-blur-[2px] lg:hidden"
            />
            <motion.aside
              key="mobile-nav-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-72 lg:hidden bg-[#102B50] border-r border-[#173F70] shadow-2xl"
            >
              {renderNavContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
