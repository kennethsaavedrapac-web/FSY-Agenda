import React from 'react';
import { Home, Calendar, User } from 'lucide-react';

export type FsyTab = 'home' | 'agenda' | 'settings';

interface BottomNavProps {
  currentTab: FsyTab;
  onTabSelected: (tab: FsyTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabSelected }) => {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-md h-[var(--fsy-nav-space)] bg-white dark:bg-[#111C2E] border-t border-[#F1F5F9] dark:border-[#1E2D42] px-6 py-1.5 flex items-center justify-around z-30 transition-colors"
      style={{ paddingBottom: 'calc(0.375rem + var(--fsy-safe-bottom))' }}
    >
      {/* Tab 1: Inicio */}
      <button
        type="button"
        onClick={() => onTabSelected('home')}
        aria-current={currentTab === 'home' ? 'page' : undefined}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
          currentTab === 'home'
            ? 'text-[#0284C7] dark:text-[#38BDF8]'
            : 'text-[#64748B] dark:text-[#A8B8CC] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]'
        }`}
      >
        <div
          className={`px-4 py-1 rounded-full flex items-center justify-center transition-colors ${
            currentTab === 'home'
              ? 'bg-[#E0F2FE] dark:bg-[#1D2C43]'
              : 'bg-transparent'
          }`}
        >
          <Home
            className="w-6 h-6"
            fill={currentTab === 'home' ? 'currentColor' : 'none'}
            strokeWidth={currentTab === 'home' ? 2.2 : 1.8}
          />
        </div>
        <span
          className={`text-[12px] mt-0.5 ${
            currentTab === 'home'
              ? 'font-bold text-[#0284C7] dark:text-[#38BDF8]'
              : 'font-medium text-[#64748B] dark:text-[#A8B8CC]'
          }`}
        >
          Inicio
        </span>
      </button>

      {/* Tab 2: Agenda */}
      <button
        type="button"
        onClick={() => onTabSelected('agenda')}
        aria-current={currentTab === 'agenda' ? 'page' : undefined}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
          currentTab === 'agenda'
            ? 'text-[#0284C7] dark:text-[#38BDF8]'
            : 'text-[#64748B] dark:text-[#A8B8CC] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]'
        }`}
      >
        <div
          className={`px-4 py-1 rounded-full flex items-center justify-center transition-colors ${
            currentTab === 'agenda'
              ? 'bg-[#E0F2FE] dark:bg-[#1D2C43]'
              : 'bg-transparent'
          }`}
        >
          <Calendar
            className="w-6 h-6"
            strokeWidth={currentTab === 'agenda' ? 2.2 : 1.8}
          />
        </div>
        <span
          className={`text-[12px] mt-0.5 ${
            currentTab === 'agenda'
              ? 'font-bold text-[#0284C7] dark:text-[#38BDF8]'
              : 'font-medium text-[#64748B] dark:text-[#A8B8CC]'
          }`}
        >
          Agenda
        </span>
      </button>

      {/* Tab 3: Perfil */}
      <button
        type="button"
        onClick={() => onTabSelected('settings')}
        aria-current={currentTab === 'settings' ? 'page' : undefined}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
          currentTab === 'settings'
            ? 'text-[#0284C7] dark:text-[#38BDF8]'
            : 'text-[#64748B] dark:text-[#A8B8CC] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]'
        }`}
      >
        <div
          className={`px-4 py-1 rounded-full flex items-center justify-center transition-colors ${
            currentTab === 'settings'
              ? 'bg-[#E0F2FE] dark:bg-[#1D2C43]'
              : 'bg-transparent'
          }`}
        >
          <User
            className="w-6 h-6"
            strokeWidth={currentTab === 'settings' ? 2.2 : 1.8}
          />
        </div>
        <span
          className={`text-[12px] mt-0.5 ${
            currentTab === 'settings'
              ? 'font-bold text-[#0284C7] dark:text-[#38BDF8]'
              : 'font-medium text-[#64748B] dark:text-[#A8B8CC]'
          }`}
        >
          Perfil
        </span>
      </button>
    </nav>
  );
};
