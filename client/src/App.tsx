import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { BrookyProvider } from './context/BrookyContext';
import { SplashLoader } from './components/layout/SplashLoader';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { GlobalFilterBar } from './components/layout/GlobalFilterBar';
import { MatchDetailDrawer } from './components/common/MatchDetailDrawer';
import { BrookyFloatingWidget } from './components/brooky/BrookyFloatingWidget';
import { DashboardSkeleton } from './components/common/Skeletons';
import { OverviewPage } from './pages/OverviewPage';
import { PerformanceAnalysisPage } from './pages/PerformanceAnalysisPage';
import { MatchAnalysisPage } from './pages/MatchAnalysisPage';
import { VenueAnalysisPage } from './pages/VenueAnalysisPage';
import { OppositionAnalysisPage } from './pages/OppositionAnalysisPage';
import { FormatAnalysisPage } from './pages/FormatAnalysisPage';
import { RecentMatchesPage } from './pages/RecentMatchesPage';
import { BrookyAssistantPage } from './pages/BrookyAssistantPage';

const DashboardShell: React.FC = () => {
  const {
    loading,
    error,
    showSplash,
    dismissSplash,
    activePage,
    theme,
    reloadDataset,
    playerProfile,
    sourceFile,
  } = useDashboard();

  const isDark = theme === 'dark';

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewPage />;
      case 'performance':
        return <PerformanceAnalysisPage />;
      case 'matches':
        return <MatchAnalysisPage />;
      case 'venues':
        return <VenueAnalysisPage />;
      case 'opposition':
        return <OppositionAnalysisPage />;
      case 'formats':
        return <FormatAnalysisPage />;
      case 'recent':
        return <RecentMatchesPage />;
      case 'brooky':
        return <BrookyAssistantPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div
      className={[
        'min-h-screen flex transition-colors duration-200',
        isDark ? 'bg-[#0B1424] text-white' : 'bg-[#F3F5F9] text-[#102B50]',
      ].join(' ')}
    >
      <SplashLoader visible={showSplash} onSkip={dismissSplash} />

      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopNavbar />
        <GlobalFilterBar />

        <main className="flex-1 p-4 sm:p-6 pb-24">
          {error ? (
            <div
              className={`rounded-2xl border p-8 text-center max-w-lg mx-auto mt-10 ${
                isDark ? 'bg-[#111F38] border-[#D7193F]/50' : 'bg-white border-[#D7193F]/30'
              }`}
            >
              <AlertCircle className="w-10 h-10 text-[#D7193F] mx-auto mb-3" />
              <h3 className="text-base font-bold">Unable to load cricket dataset</h3>
              <p className="text-xs opacity-75 mt-1">{error}</p>
              <button
                type="button"
                onClick={reloadDataset}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#102B50] text-white text-xs font-bold hover:bg-[#173F70] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#D7193F]" />
                Retry Connection
              </button>
            </div>
          ) : loading ? (
            <DashboardSkeleton />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        <footer
          className={`px-6 py-3 border-t text-[11px] flex flex-wrap items-center justify-between gap-2 ${
            isDark ? 'border-[#1E3557] text-slate-400' : 'border-[#E1E7F0] text-[#4B607F]'
          }`}
        >
          <span>
            <strong>BROOKY AI</strong> · Cricket Intelligence Platform · {playerProfile?.Full_Name ?? 'Harry Cherrington Brook'}
          </span>
          <span>
            Source: {sourceFile} ({playerProfile?.Data_Status ?? 'Synthetic dashboard demonstration data'})
          </span>
        </footer>
      </div>

      <MatchDetailDrawer />
      <BrookyFloatingWidget />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <DashboardProvider>
      <BrookyProvider>
        <DashboardShell />
      </BrookyProvider>
    </DashboardProvider>
  );
};

export default App;
