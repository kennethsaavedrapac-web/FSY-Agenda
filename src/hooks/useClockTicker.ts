import { useEffect, useMemo, useRef } from 'react';
import { usePreferences } from '../context/PreferencesContext';
import { useClock } from '../context/ClockContext';
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
    notificationsEnabled,
    advanceMinutes
  } = usePreferences();

  const { currentMinutes, currentDate } = useClock();
  const notifiedActivitiesRef = useRef<Set<string>>(new Set());
  const currentDay = TimeUtils.getEventDateTime(currentDate).date;

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
    const current = sortedActivities.find((act) => getActivityStatus(act, currentMinutes) === 'CURRENT') || null;

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
      const notificationKey = `${currentDay}:${nextActivity.id}`;
      if (!notifiedActivitiesRef.current.has(notificationKey)) {
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`Próxima actividad en ${minutesUntil} min`, {
              body: `${nextActivity.title} • ${nextActivity.location}`,
              icon: '/icons/ic_temple_logo.svg'
            });
            notifiedActivitiesRef.current.add(notificationKey);
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
          } catch (e) {
            console.error('Notification error', e);
          }
        }
      }
    }
  }, [currentMinutes, currentDay, nextActivity, notificationsEnabled, advanceMinutes, simulationActive]);

  return {
    currentDate,
    currentMinutes,
    currentActivity,
    nextActivity,
    isBeforeEvent,
    isFreeTime,
    isEventFinished,
    firstActivityTime: sortedActivities[0]?.startTime || '07:00'
  };
}

export type AgendaClock = ReturnType<typeof useClockTicker>;
