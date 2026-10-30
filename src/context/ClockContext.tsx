import { createContext, useContext, useLayoutEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { usePreferences } from './PreferencesContext';
import { TimeUtils } from '../utils/timeUtils';

interface ClockValue {
  currentDate: Date;
  currentMinutes: number;
}

const ClockContext = createContext<ClockValue | null>(null);

export function ClockProvider({ children }: { children: ReactNode }) {
  const { simulationActive, simulatedDate, simulatedMinutes } = usePreferences();
  const [realDate, setRealDate] = useState(() => new Date());

  useLayoutEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sync = () => {
      clearTimeout(timer);
      const now = new Date();
      setRealDate(now);
      // All displayed counters have minute precision. Keep one timer aligned to
      // the next minute, and suspend it in the background or during simulation.
      if (!simulationActive && document.visibilityState === 'visible') {
        timer = setTimeout(sync, 60000 - (now.getTime() % 60000));
      }
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    window.addEventListener('pageshow', sync);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener('pageshow', sync);
    };
  }, [simulationActive]);

  // The layout effect refreshes realDate before painting when leaving simulation.
  const currentDate = simulationActive
    ? TimeUtils.fromEventDateTime(simulatedDate, simulatedMinutes)
    : realDate;

  return (
    <ClockContext.Provider value={{ currentDate, currentMinutes: TimeUtils.getAgendaMinutes(currentDate) }}>
      {children}
    </ClockContext.Provider>
  );
}

export function useClock(): ClockValue {
  const clock = useContext(ClockContext);
  if (!clock) throw new Error('useClock must be used within a ClockProvider');
  return clock;
}
