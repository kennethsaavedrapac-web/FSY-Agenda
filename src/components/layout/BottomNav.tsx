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
      className="w-full bg-white border-t border-[#F1F5F9] px-6 py-1.5 flex items-center justify-around z-30 sticky bottom-0"
      style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
    >
      {/* Tab 1: Inicio */}
      <button
        type="button"
        onClick={() => onTabSelected('home')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
          currentTab === 'home' ? 'text-[#0284C7]' : 'text-[#64748B]'
        }`}
      >
        <div
          className={`px-4 py-1 rounded-full flex items-center justify-center transition-colors ${
            currentTab === 'home' ? 'bg-[#E0F2FE]' : 'bg-transparent'
          }`}
        >
          <Home
            className="w-6 h-6"
            fill={currentTab === 'home' ? '#0284C7' : 'none'}
            strokeWidth={currentTab === 'home' ? 2.2 : 1.8}
          />
        </div>
        <span
          className={`text-[12px] mt-0.5 ${
            currentTab === 'home' ? 'font-bold text-[#0284C7]' : 'font-medium text-[#64748B]'
          }`}
        >
          Inicio
        </span>
      </button>

      {/* Tab 2: Agenda */}
      <button
        type="button"
        onClick={() => onTabSelected('agenda')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
          currentTab === 'agenda' ? 'text-[#0284C7]' : 'text-[#64748B]'
        }`}
      >
        <div
          className={`px-4 py-1 rounded-full flex items-center justify-center transition-colors ${
            currentTab === 'agenda' ? 'bg-[#E0F2FE]' : 'bg-transparent'
          }`}
        >
          <Calendar
            className="w-6 h-6"
            strokeWidth={currentTab === 'agenda' ? 2.2 : 1.8}
          />
        </div>
        <span
          className={`text-[12px] mt-0.5 ${
            currentTab === 'agenda' ? 'font-bold text-[#0284C7]' : 'font-medium text-[#64748B]'
          }`}
        >
          Agenda
        </span>
      </button>

      {/* Tab 3: Perfil */}
      <button
        type="button"
        onClick={() => onTabSelected('settings')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
          currentTab === 'settings' ? 'text-[#0284C7]' : 'text-[#64748B]'
        }`}
      >
        <div
          className={`px-4 py-1 rounded-full flex items-center justify-center transition-colors ${
            currentTab === 'settings' ? 'bg-[#E0F2FE]' : 'bg-transparent'
          }`}
        >
          <User
            className="w-6 h-6"
            strokeWidth={currentTab === 'settings' ? 2.2 : 1.8}
          />
        </div>
        <span
          className={`text-[12px] mt-0.5 ${
            currentTab === 'settings' ? 'font-bold text-[#0284C7]' : 'font-medium text-[#64748B]'
          }`}
        >
          Perfil
        </span>
      </button>
    </nav>
  );
};

