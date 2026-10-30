import React from 'react';
import { MobileContainer } from './components/layout/MobileContainer';
import { BottomNav } from './components/layout/BottomNav';
import { useNavigation } from './hooks/useNavigation';
import { HomePage } from './pages/HomePage';
import { AgendaPage } from './pages/AgendaPage';
import { SettingsPage } from './pages/SettingsPage';
import { DetailPage } from './pages/DetailPage';
import { PreferencesProvider } from './context/PreferencesContext';
import { ClockProvider } from './context/ClockContext';
import { useClockTicker } from './hooks/useClockTicker';
import { useActivities } from './hooks/useActivities';
import { usePwaInstall } from './hooks/usePwaInstall';

const AppContent: React.FC = () => {
  const installation = usePwaInstall();
  const { activities, isLoading, reloadSchedule } = useActivities();
  const clock = useClockTicker(activities);
  const { currentMinutes } = clock;

  const { entry, back, navigateTab, openDetail, setAgendaView, openInstallInstructions } = useNavigation(!isLoading);
  const currentTab = entry.tab;
  const selectedActivityId = entry.activityId;

  const selectedActivity = activities.find((a) => a.id === selectedActivityId) || null;

  return (
    <MobileContainer>
      <div className="flex-1 flex flex-col min-h-screen bg-white dark:bg-[#0B1220] transition-colors">
        {selectedActivityId !== null ? (
          selectedActivity ? (
            <DetailPage
              activity={selectedActivity}
              currentMinutes={currentMinutes}
              onNavigateBack={back}
            />
          ) : (
            <div className="p-4 bg-white dark:bg-[#0B1220] flex-1">
              <button type="button" onClick={back} className="text-[#0284C7] dark:text-[#38BDF8] font-semibold">
                Volver a Agenda
              </button>
              <p className="mt-3 text-[#0F172A] dark:text-[#F1F5F9]">
                {isLoading ? 'Cargando actividad…' : 'Actividad no encontrada.'}
              </p>
            </div>
          )
        ) : (
          <div className="flex-1 flex flex-col pb-[var(--fsy-nav-space)]">
            {currentTab === 'home' && (
              <HomePage
                clock={clock}
                activities={activities}
                isLoading={isLoading}
                onNavigateToDetail={openDetail}
                onNavigateToAgenda={() => navigateTab('agenda')}
                onNavigateToSettings={() => navigateTab('settings')}
              />
            )}

            {currentTab === 'agenda' && (
              <AgendaPage
                view={entry.agenda}
                onViewChange={setAgendaView}
                onNavigateBack={back}
                clock={clock}
                activities={activities}
                isLoading={isLoading}
                onNavigateToDetail={openDetail}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsPage
                onReloadSchedule={reloadSchedule}
                onNavigateBack={back}
                installation={installation}
                installInstructionsOpen={entry.overlay === 'install'}
                onOpenInstallInstructions={openInstallInstructions}
              />
            )}

            {/* Bottom Navigation fixed at bottom */}
            <BottomNav
              currentTab={currentTab}
              onTabSelected={navigateTab}
            />
          </div>
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
