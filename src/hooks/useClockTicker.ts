import { useState, useEffect, useMemo, useRef } from 'react';
import { usePreferences } from '../context/PreferencesContext';
import type { FsyActivity, ActivityStatus } from '../models/types';
import { TimeUtils } from '../utils/timeUtils';

export function getActivityStatus(
  activity: FsyActivity,
  currentMinutes: number
): ActivityStatus {
  if (currentMinutes < activity.startMinutes) {
    return 'UPCOMING';
  }
  if (activity.endMinutes === null) {
    return 'CURRENT';
  }
  if (currentMinutes < activity.endMinutes) {
    return 'CURRENT';
  }
  return 'FINISHED';
}

export function getActivityRemainingMinutes(
  activity: FsyActivity,
  currentMinutes: number
): number | null {
  if (activity.endMinutes === null) {
    return null;
  }
  return Math.max(0, activity.endMinutes - currentMinutes);
}

export function getActivityMinutesUntilStart(
  activity: FsyActivity,
  currentMinutes: number
): number {
  return Math.max(0, activity.startMinutes - currentMinutes);
}

export function isTransferActivity(activity: FsyActivity): boolean {
  const cat = activity.category.toLowerCase();
  const title = activity.title.toLowerCase();
  return cat.includes('traslado') || title.startsWith('traslado');
}

export function useClockTicker(activities: FsyActivity[]) {
  const {
    simulationActive,
    simulatedMinutes,
    notificationsEnabled,
    advanceMinutes
  } = usePreferences();

  const [realMinutes, setRealMinutes] = useState<number>(() => TimeUtils.getCurrentMinutes());
  const notifiedActivitiesRef = useRef<Set<number>>(new Set());

  // 10-second ticker interval + visibilitychange sync
  useEffect(() => {
    const updateTime = () => {
      setRealMinutes(TimeUtils.getCurrentMinutes());
    };

    const intervalId = setInterval(updateTime, 10000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        updateTime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const currentMinutes = useMemo(() => {
    return simulationActive ? simulatedMinutes : realMinutes;
  }, [simulationActive, simulatedMinutes, realMinutes]);

  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [activities]);

  const {
    currentActivity,
    nextActivity,
    isBeforeEvent,
    isFreeTime,
    isEventFinished
  } = useMemo(() => {
    if (sortedActivities.length === 0) {
      return {
        currentActivity: null,
        nextActivity: null,
        isBeforeEvent: false,
        isFreeTime: false,
        isEventFinished: false
      };
    }

    const firstActivity = sortedActivities[0];
    const isBefore = currentMinutes < firstActivity.startMinutes;

    // Find current activity
    const current = sortedActivities.find((act) => {
      if (currentMinutes < act.startMinutes) return false;
      if (act.endMinutes === null) return true;
      return currentMinutes < act.endMinutes;
    }) || null;

    // Find next upcoming activity
    const next = sortedActivities.find((act) => act.startMinutes > currentMinutes) || null;

    const freeTime = !current && !isBefore && next !== null;
    const finished = !current && next === null && currentMinutes >= firstActivity.startMinutes;

    return {
      currentActivity: current,
      nextActivity: next,
      isBeforeEvent: isBefore,
      isFreeTime: freeTime,
      isEventFinished: finished
    };
  }, [sortedActivities, currentMinutes]);

  // Notifications logic
  useEffect(() => {
    if (!notificationsEnabled || !nextActivity || simulationActive) return;

    const minutesUntil = nextActivity.startMinutes - currentMinutes;
    if (minutesUntil <= advanceMinutes && minutesUntil > 0) {
      if (!notifiedActivitiesRef.current.has(nextActivity.id)) {
        notifiedActivitiesRef.current.add(nextActivity.id);
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`Próxima actividad en ${minutesUntil} min`, {
              body: `${nextActivity.title} • ${nextActivity.location}`,
              icon: '/icons/ic_temple_logo.svg'
            });
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
          } catch (e) {
            console.error('Notification error', e);
          }
        }
      }
    }
  }, [currentMinutes, nextActivity, notificationsEnabled, advanceMinutes, simulationActive]);

  return {
    currentMinutes,
    currentActivity,
    nextActivity,
    isBeforeEvent,
    isFreeTime,
    isEventFinished,
    firstActivityTime: sortedActivities[0]?.startTime || '07:00'
  };
}
