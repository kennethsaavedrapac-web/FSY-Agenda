import React from 'react';
import { ChevronRight } from 'lucide-react';
import { TempleHeader } from '../components/layout/TempleHeader';
import { CurrentActivityCard } from '../components/cards/CurrentActivityCard';
import { NextActivityCard } from '../components/cards/NextActivityCard';
import { FreeTimeCard } from '../components/cards/FreeTimeCard';
import { EventStatusCard } from '../components/cards/EventStatusCard';
import { TimelineItem } from '../components/timeline/TimelineItem';
import type { AgendaClock } from '../hooks/useClockTicker';
import { TimeUtils } from '../utils/timeUtils';
import { usePreferences } from '../context/PreferencesContext';
import type { FsyActivity } from '../models/types';

interface HomePageProps {
  clock: AgendaClock;
  activities: FsyActivity[];
  isLoading: boolean;
  onNavigateToDetail: (id: number) => void;
  onNavigateToAgenda: () => void;
  onNavigateToSettings: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  clock,
  activities,
  isLoading,
  onNavigateToDetail,
  onNavigateToAgenda,
  onNavigateToSettings
}) => {
  const { simulationActive, simulatedMinutes, resetSimulation } = usePreferences();
  const {
    currentMinutes,
    currentActivity,
    nextActivity,
    isBeforeEvent,
    isFreeTime,
    isEventFinished,
    firstActivityTime
  } = clock;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#0284C7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Branded Temple Header matching reference mockup */}
      <TempleHeader
        isSimulationActive={simulationActive}
        simulatedMinutes={simulatedMinutes}
        onNotificationClick={onNavigateToSettings}
        onResetSimulation={resetSimulation}
        currentDateText={`${simulationActive ? 'Simulación' : 'Hora real'} • ${TimeUtils.getTodayFormattedDate(clock.currentDate).replace('Hoy • ', '')}`}
      />

      {/* Main Content Area */}
      <div className="flex-1 px-4 py-3 space-y-4">
        {/* --- 1. Dynamic Top Cards Section --- */}
        <div>
          {isBeforeEvent ? (
            <div className="space-y-3">
              <EventStatusCard isFinished={false} firstActivityTime={firstActivityTime} />
              {nextActivity && (
                <NextActivityCard
                  activity={nextActivity}
                  currentMinutes={currentMinutes}
                  onClick={() => onNavigateToDetail(nextActivity.id)}
                />
              )}
            </div>
          ) : isEventFinished ? (
            <EventStatusCard isFinished={true} />
          ) : currentActivity ? (
            <div className="space-y-3">
              <CurrentActivityCard
                activity={currentActivity}
                currentMinutes={currentMinutes}
                onClick={() => onNavigateToDetail(currentActivity.id)}
              />

              {nextActivity && (
                <NextActivityCard
                  activity={nextActivity}
                  currentMinutes={currentMinutes}
                  onClick={() => onNavigateToDetail(nextActivity.id)}
                />
              )}
            </div>
          ) : isFreeTime ? (
            <FreeTimeCard
              nextActivity={nextActivity}
              currentMinutes={currentMinutes}
              onNextClick={nextActivity ? () => onNavigateToDetail(nextActivity.id) : undefined}
            />
          ) : nextActivity ? (
            <NextActivityCard
              activity={nextActivity}
              currentMinutes={currentMinutes}
              onClick={() => onNavigateToDetail(nextActivity.id)}
            />
          ) : null}
        </div>

        {/* --- 2. Section: "Hoy" Header --- */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[24px] font-extrabold text-[#0F172A] tracking-tight">
              Hoy
            </h2>

            {/* Pill button: "Ver agenda completa >" */}
            <button
              type="button"
              onClick={onNavigateToAgenda}
              className="bg-[#EFF6FF] text-[#0284C7] hover:bg-[#E0F2FE] px-3.5 py-1.5 rounded-full flex items-center space-x-1 transition-colors text-[13px] font-bold"
            >
              <span>Ver agenda completa</span>
              <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>

          {/* --- 3. Timeline Items in "Hoy" --- */}
          <div className="space-y-0.5">
            {activities.map((activity, index) => (
              <TimelineItem
                key={activity.id}
                activity={activity}
                currentMinutes={currentMinutes}
                isFirst={index === 0}
                isLast={index === activities.length - 1}
                onClick={() => onNavigateToDetail(activity.id)}
              />
            ))}
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
};
