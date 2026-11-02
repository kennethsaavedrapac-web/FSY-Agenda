import React, { createContext, useContext, useEffect, useState } from 'react';
import type { CounselorPreferences, ThemeMode, ResolvedTheme } from '../models/types';
import { EVENT_DATE, TimeUtils } from '../utils/timeUtils';

export interface PreferencesContextType extends CounselorPreferences {
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  setCounselorName: (name: string) => void;
  setCompanyName: (company: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setAdvanceMinutes: (minutes: number) => void;
  setSimulationActive: (active: boolean) => void;
  setSimulatedMinutes: (minutes: number) => void;
  setSimulatedDate: (date: string) => void;
  resetSimulation: () => void;
}

const DEFAULT_PREFS: CounselorPreferences = {
  counselorName: '',
  companyName: 'Compañía FSY',
  notificationsEnabled: false,
  advanceMinutes: 10,
  simulationActive: false,
  simulatedMinutes: 518, // 08:38 a. m. (manual preview only)
  simulatedDate: EVENT_DATE ?? TimeUtils.getEventDateTime().date,
  theme: 'auto'
};

const PreferencesContext = createContext<PreferencesContextType | null>(null);

function safeGetStorage(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {
    // restricted or disabled
  }
  return null;
}

function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {
    // restricted or disabled
  }
}

function safeRemoveStorage(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch {
    // restricted or disabled
  }
}

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyThemeToDOM(resolvedTheme: ResolvedTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const isDark = resolvedTheme === 'dark';

  if (isDark) {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', isDark ? '#0B1220' : '#0284C7');
  }
}

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [counselorName, setCounselorNameState] = useState<string>(() => {
    return safeGetStorage('fsy_counselor_name') ?? DEFAULT_PREFS.counselorName;
  });

  const [companyName, setCompanyNameState] = useState<string>(() => {
    return safeGetStorage('fsy_company_name') ?? DEFAULT_PREFS.companyName;
  });

  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(() => {
    const val = safeGetStorage('fsy_notifications_enabled');
    return val !== null ? val === 'true' : DEFAULT_PREFS.notificationsEnabled;
  });

  const [advanceMinutes, setAdvanceMinutesState] = useState<number>(() => {
    const val = safeGetStorage('fsy_advance_minutes');
    const minutes = Number(val);
    return [1, 5, 10, 15, 20].includes(minutes) ? minutes : DEFAULT_PREFS.advanceMinutes;
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = safeGetStorage('fsy_theme');
    if (saved === 'light' || saved === 'dark' || saved === 'auto') {
      return saved;
    }
    return DEFAULT_PREFS.theme;
  });

  const [systemDark, setSystemDark] = useState<boolean>(() => getSystemPrefersDark());

  // Listen to system changes when mode is 'auto'
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e: MediaQueryListEvent) => {
      if (typeof e.matches === 'boolean') {
        setSystemDark(e.matches);
      } else {
        setSystemDark(getSystemPrefersDark());
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else if ('addListener' in mediaQuery) {
      // Legacy Safari / iOS fallback
      (mediaQuery as any).addListener(handler);
      return () => (mediaQuery as any).removeListener(handler);
    }
  }, []);

  const resolvedTheme: ResolvedTheme = theme === 'auto' ? (systemDark ? 'dark' : 'light') : theme;

  // Sync DOM on resolvedTheme change
  useEffect(() => {
    applyThemeToDOM(resolvedTheme);
  }, [resolvedTheme]);

  // Simulation belongs to this session only; old persisted values are never read.
  const [simulationActive, setSimulationActiveState] = useState(false);
  const [simulatedMinutes, setSimulatedMinutesState] = useState(DEFAULT_PREFS.simulatedMinutes);
  const [simulatedDate, setSimulatedDateState] = useState(DEFAULT_PREFS.simulatedDate);

  useEffect(() => {
    ['fsy_simulation_active', 'fsy_simulated_minutes', 'fsy_simulated_date'].forEach((key) => safeRemoveStorage(key));
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    safeSetStorage('fsy_theme', newTheme);
  };

  const setCounselorName = (name: string) => {
    setCounselorNameState(name);
    safeSetStorage('fsy_counselor_name', name);
  };

  const setCompanyName = (company: string) => {
    setCompanyNameState(company);
    safeSetStorage('fsy_company_name', company);
  };

  const setNotificationsEnabled = (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    safeSetStorage('fsy_notifications_enabled', String(enabled));
  };

  const setAdvanceMinutes = (minutes: number) => {
    if (![1, 5, 10, 15, 20].includes(minutes)) return;
    setAdvanceMinutesState(minutes);
    safeSetStorage('fsy_advance_minutes', String(minutes));
  };

  const setSimulationActive = (active: boolean) => {
    setSimulationActiveState(active);
  };

  const setSimulatedMinutes = (minutes: number) => {
    if (!Number.isFinite(minutes)) return;
    const clamped = Math.max(0, Math.min(1439, Math.floor(minutes)));
    setSimulatedMinutesState(clamped);
  };

  const setSimulatedDate = (date: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    const parsed = TimeUtils.fromEventDateTime(date, 0);
    if (Number.isFinite(parsed.getTime()) && TimeUtils.getEventDateTime(parsed).date === date) {
      setSimulatedDateState(date);
    }
  };

  const resetSimulation = () => {
    setSimulationActive(false);
  };

  return (
    <PreferencesContext.Provider
      value={{
        counselorName,
        companyName,
        notificationsEnabled,
        advanceMinutes,
        simulationActive,
        simulatedMinutes,
        simulatedDate,
        theme,
        resolvedTheme,
        setTheme,
        setCounselorName,
        setCompanyName,
        setNotificationsEnabled,
        setAdvanceMinutes,
        setSimulationActive,
        setSimulatedMinutes,
        setSimulatedDate,
        resetSimulation
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export function usePreferences(): PreferencesContextType {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}

export function useTheme() {
  const { theme, resolvedTheme, setTheme } = usePreferences();
  return {
    theme,
    resolvedTheme,
    setTheme,
    isDark: resolvedTheme === 'dark'
  };
}
