import { useMemo } from 'react';
import { useClock } from '../context/ClockContext';
import type { FsyActivity, ActivityStatus } from '../models/types';

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
  const { currentMinutes, currentDate, realDate } = useClock();

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

  return {
    realDate,
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
