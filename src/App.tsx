import React, { useState, useEffect, useCallback } from 'react';
import { MobileContainer } from './components/layout/MobileContainer';
import { BottomNav } from './components/layout/BottomNav';
import type { FsyTab } from './components/layout/BottomNav';
import { HomePage } from './pages/HomePage';
import { AgendaPage } from './pages/AgendaPage';
import { SettingsPage } from './pages/SettingsPage';
import { DetailPage } from './pages/DetailPage';
import { PreferencesProvider } from './context/PreferencesContext';
import { ClockProvider } from './context/ClockContext';
import { useClockTicker } from './hooks/useClockTicker';
import { useActivities } from './hooks/useActivities';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<FsyTab>('home');
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);

  const { activities, isLoading, reloadSchedule } = useActivities();
  const clock = useClockTicker(activities);
  const { currentMinutes } = clock;

  // Navigation handlers
  const handleOpenDetail = useCallback((id: number) => {
    setSelectedActivityId(id);
    window.history.pushState({ view: 'detail', id }, '', `#detail-${id}`);
  }, []);

  const handleBackFromDetail = useCallback(() => {
    if (window.location.hash.startsWith('#detail')) {
      window.history.back();
    } else {
      setSelectedActivityId(null);
    }
  }, []);

  // Listen to browser popstate (e.g. mobile back gesture)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view === 'detail') {
        setSelectedActivityId(event.state.id);
      } else {
        setSelectedActivityId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const selectedActivity = activities.find((a) => a.id === selectedActivityId) || null;

  return (
    <MobileContainer>
      <div className="flex-1 flex flex-col min-h-screen">
        {selectedActivityId !== null && selectedActivity ? (
          <DetailPage
            activity={selectedActivity}
            currentMinutes={currentMinutes}
            onNavigateBack={handleBackFromDetail}
          />
        ) : (
          <>
            {currentTab === 'home' && (
              <HomePage
                clock={clock}
                activities={activities}
                isLoading={isLoading}
                onNavigateToDetail={handleOpenDetail}
                onNavigateToAgenda={() => setCurrentTab('agenda')}
                onNavigateToSettings={() => setCurrentTab('settings')}
              />
            )}

            {currentTab === 'agenda' && (
              <AgendaPage
                clock={clock}
                activities={activities}
                isLoading={isLoading}
                onNavigateToDetail={handleOpenDetail}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsPage onReloadSchedule={reloadSchedule} />
            )}

            {/* Bottom Navigation fixed at bottom */}
            <BottomNav
              currentTab={currentTab}
              onTabSelected={(tab) => {
                setSelectedActivityId(null);
                setCurrentTab(tab);
              }}
            />
          </>
        )}
      </div>
    </MobileContainer>
  );
};

export function App() {
  return (
    <PreferencesProvider>
      <ClockProvider>
        <AppContent />
      </ClockProvider>
    </PreferencesProvider>
  );
}

export default App;
