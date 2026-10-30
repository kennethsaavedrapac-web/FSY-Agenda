import { createContext, useContext, useLayoutEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { usePreferences } from './PreferencesContext';
import { TimeUtils } from '../utils/timeUtils';

interface ClockValue {
  realDate: Date;
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
      // Reuse one timer: minute updates in real mode, midnight updates during
      // simulation so the header always keeps the real Nicaragua date.
      if (document.visibilityState === 'visible') {
        const delay = simulationActive
          ? (1440 - TimeUtils.getCurrentMinutes(now)) * 60000 - now.getSeconds() * 1000 - now.getMilliseconds()
          : 60000 - (now.getTime() % 60000);
        timer = setTimeout(sync, delay);
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
    <ClockContext.Provider value={{ realDate, currentDate, currentMinutes: TimeUtils.getAgendaMinutes(currentDate) }}>
      {children}
    </ClockContext.Provider>
  );
}

export function useClock(): ClockValue {
  const clock = useContext(ClockContext);
  if (!clock) throw new Error('useClock must be used within a ClockProvider');
  return clock;
}
