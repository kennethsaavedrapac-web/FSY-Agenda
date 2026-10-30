import React, { createContext, useContext, useEffect, useState } from 'react';
import type { CounselorPreferences } from '../models/types';
import { EVENT_DATE, TimeUtils } from '../utils/timeUtils';

interface PreferencesContextType extends CounselorPreferences {
  setCounselorName: (name: string) => void;
  setCompanyName: (company: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setAdvanceMinutes: (minutes: number) => void;
  setSimulationActive: (active: boolean) => void;
  setSimulatedMinutes: (minutes: number) => void;
  setSimulatedDate: (date: string) => void;
  resetSimulation: () => void;
  requestNotificationPermission: () => Promise<boolean>;
}

const DEFAULT_PREFS: CounselorPreferences = {
  counselorName: '',
  companyName: 'Compañía FSY',
  notificationsEnabled: true,
  advanceMinutes: 10,
  simulationActive: false,
  simulatedMinutes: 518, // 08:38 a. m. (manual preview only)
  simulatedDate: EVENT_DATE ?? TimeUtils.getEventDateTime().date
};

const PreferencesContext = createContext<PreferencesContextType | null>(null);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [counselorName, setCounselorNameState] = useState<string>(() => {
    return localStorage.getItem('fsy_counselor_name') ?? DEFAULT_PREFS.counselorName;
  });

  const [companyName, setCompanyNameState] = useState<string>(() => {
    return localStorage.getItem('fsy_company_name') ?? DEFAULT_PREFS.companyName;
  });

  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(() => {
    const val = localStorage.getItem('fsy_notifications_enabled');
    return val !== null ? val === 'true' : DEFAULT_PREFS.notificationsEnabled;
  });

  const [advanceMinutes, setAdvanceMinutesState] = useState<number>(() => {
    const val = localStorage.getItem('fsy_advance_minutes');
    return val !== null ? parseInt(val, 10) : DEFAULT_PREFS.advanceMinutes;
  });

  // Simulation belongs to this session only; old persisted values are never read.
  const [simulationActive, setSimulationActiveState] = useState(false);
  const [simulatedMinutes, setSimulatedMinutesState] = useState(DEFAULT_PREFS.simulatedMinutes);
  const [simulatedDate, setSimulatedDateState] = useState(DEFAULT_PREFS.simulatedDate);

  useEffect(() => {
    try {
      ['fsy_simulation_active', 'fsy_simulated_minutes', 'fsy_simulated_date'].forEach((key) => localStorage.removeItem(key));
    } catch {
      // Storage may be unavailable; the in-memory real-time default still applies.
    }
  }, []);

  const setCounselorName = (name: string) => {
    setCounselorNameState(name);
    localStorage.setItem('fsy_counselor_name', name);
  };

  const setCompanyName = (company: string) => {
    setCompanyNameState(company);
    localStorage.setItem('fsy_company_name', company);
  };

  const setNotificationsEnabled = (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    localStorage.setItem('fsy_notifications_enabled', String(enabled));
    if (enabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const setAdvanceMinutes = (minutes: number) => {
    setAdvanceMinutesState(minutes);
    localStorage.setItem('fsy_advance_minutes', String(minutes));
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

  const requestNotificationPermission = async (): Promise<boolean> => {
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      return res === 'granted';
    }
    return false;
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
        setCounselorName,
        setCompanyName,
        setNotificationsEnabled,
        setAdvanceMinutes,
        setSimulationActive,
        setSimulatedMinutes,
        setSimulatedDate,
        resetSimulation,
        requestNotificationPermission
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
