import React, { createContext, useContext, useState } from 'react';
import type { CounselorPreferences } from '../models/types';

interface PreferencesContextType extends CounselorPreferences {
  setCounselorName: (name: string) => void;
  setCompanyName: (company: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setAdvanceMinutes: (minutes: number) => void;
  setSimulationActive: (active: boolean) => void;
  setSimulatedMinutes: (minutes: number) => void;
  resetSimulation: () => void;
  requestNotificationPermission: () => Promise<boolean>;
}

const DEFAULT_PREFS: CounselorPreferences = {
  counselorName: '',
  companyName: 'Compañía FSY',
  notificationsEnabled: true,
  advanceMinutes: 10,
  simulationActive: true,
  simulatedMinutes: 518 // 08:38 a. m.
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

  const [simulationActive, setSimulationActiveState] = useState<boolean>(() => {
    const val = localStorage.getItem('fsy_simulation_active');
    return val !== null ? val === 'true' : DEFAULT_PREFS.simulationActive;
  });

  const [simulatedMinutes, setSimulatedMinutesState] = useState<number>(() => {
    const val = localStorage.getItem('fsy_simulated_minutes');
    return val !== null ? parseInt(val, 10) : DEFAULT_PREFS.simulatedMinutes;
  });

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
    localStorage.setItem('fsy_simulation_active', String(active));
  };

  const setSimulatedMinutes = (minutes: number) => {
    const clamped = Math.max(0, Math.min(1439, minutes));
    setSimulatedMinutesState(clamped);
    localStorage.setItem('fsy_simulated_minutes', String(clamped));
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
        setCounselorName,
        setCompanyName,
        setNotificationsEnabled,
        setAdvanceMinutes,
        setSimulationActive,
        setSimulatedMinutes,
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
