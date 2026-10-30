import React from 'react';
import { Settings, Sliders, X } from 'lucide-react';
import { TimeUtils } from '../../utils/timeUtils';

interface TempleHeaderProps {
  isSimulationActive: boolean;
  simulatedMinutes: number;
  onSettingsClick: () => void;
  onResetSimulation: () => void;
  currentDateText?: string;
}

export const TempleHeader: React.FC<TempleHeaderProps> = ({
  isSimulationActive,
  simulatedMinutes,
  onSettingsClick,
  onResetSimulation,
  currentDateText = 'Sábado • FSY de 1 día'
}) => {
  return (
    <div className="relative w-full overflow-hidden bg-white dark:bg-[#111C2E] pt-3 pb-2 px-4.5 border-b border-slate-100 dark:border-[#1E2D42] transition-colors">
      {/* Procedural background reproducing TempleHeader.kt */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 400 130"
      >
        <defs>
          <radialGradient id="skyRadialLight" cx="85%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#F0F9FF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="skyRadialDark" cx="85%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#1E3A5F" stopOpacity="0.65" />
            <stop offset="40%" stopColor="#14243C" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#111C2E" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sky gradient */}
        <rect width="400" height="130" fill="url(#skyRadialLight)" className="dark:hidden" />
        <rect width="400" height="130" fill="url(#skyRadialDark)" className="hidden dark:block" />

        {/* Left Spire (opacity 0.35 in light, 0.22 in dark) */}
        <path
          d="M 276 125 L 276 65 L 284 35 L 292 65 L 292 125 Z"
          fill="#BAE6FD"
          fillOpacity="0.35"
          className="dark:hidden"
        />
        <path
          d="M 276 125 L 276 65 L 284 35 L 292 65 L 292 125 Z"
          fill="#38BDF8"
          fillOpacity="0.22"
          className="hidden dark:block"
        />

        {/* Right Spire (opacity 0.35 in light, 0.22 in dark) */}
        <path
          d="M 324 125 L 324 60 L 332 30 L 340 60 L 340 125 Z"
          fill="#BAE6FD"
          fillOpacity="0.35"
          className="dark:hidden"
        />
        <path
          d="M 324 125 L 324 60 L 332 30 L 340 60 L 340 125 Z"
          fill="#38BDF8"
          fillOpacity="0.22"
          className="hidden dark:block"
        />

        {/* Center Main Temple Spire (opacity 0.45 in light, 0.28 in dark) */}
        <path
          d="M 296 125 L 296 40 L 302 30 L 306 -10 L 308 -25 L 310 -10 L 314 30 L 320 40 L 320 125 Z"
          fill="#BAE6FD"
          fillOpacity="0.45"
          className="dark:hidden"
        />
        <path
          d="M 296 125 L 296 40 L 302 30 L 306 -10 L 308 -25 L 310 -10 L 314 30 L 320 40 L 320 125 Z"
          fill="#38BDF8"
          fillOpacity="0.28"
          className="hidden dark:block"
        />

        {/* Soft Pine Trees Layer (opacity 0.35 in light, 0.20 in dark) */}
        <path
          d="M 220 130 
             L 240 95 L 252 110 
             L 272 88 L 288 105 
             L 312 82 L 328 102 
             L 352 90 L 368 108 
             L 384 98 L 400 130 Z"
          fill="#A7F3D0"
          fillOpacity="0.35"
          className="dark:hidden"
        />
        <path
          d="M 220 130 
             L 240 95 L 252 110 
             L 272 88 L 288 105 
             L 312 82 L 328 102 
             L 352 90 L 368 108 
             L 384 98 L 400 130 Z"
          fill="#34D399"
          fillOpacity="0.20"
          className="hidden dark:block"
        />
      </svg>

      {/* Main Header Row */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          {/* Temple Badge Logo (52x52 rounded 14px) */}
          <div className="w-[52px] h-[52px] rounded-[14px] overflow-hidden shadow-sm flex-shrink-0 bg-[#0284C7] dark:bg-[#0369A1]">
            <img
              src="/icons/ic_temple_logo.svg"
              alt="FSY Granada"
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <h1 className="text-[24px] font-extrabold text-[#0F172A] dark:text-[#F1F5F9] tracking-tight leading-tight">
              FSY Agenda
            </h1>
            <p className="text-[14px] font-semibold text-[#334155] dark:text-[#CBD5E1] leading-snug">
              Distrito Granada 2026
            </p>
            <p className="text-[12px] font-normal text-[#64748B] dark:text-[#A8B8CC] leading-tight">
              {currentDateText}
            </p>
          </div>
        </div>

        {/* Settings Button */}
        <button
          type="button"
          onClick={onSettingsClick}
          aria-label="Configuración"
          className="w-11 h-11 flex-shrink-0 inline-flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#1D2C43] active:bg-slate-200 dark:active:bg-[#253754] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284C7] dark:focus-visible:outline-[#38BDF8] transition-colors text-[#1E293B] dark:text-[#F1F5F9]"
        >
          <Settings className="w-[26px] h-[26px]" strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>

      {/* Simulation Banner when active */}
      {isSimulationActive && (
        <div className="relative z-10 mt-2.5 px-3 py-1.5 rounded-[10px] bg-[#FEF3C7] dark:bg-[#251A0E] border border-[#FCD34D] dark:border-[#78350F] flex items-center justify-between text-xs shadow-xs transition-colors">
          <div className="flex items-center space-x-2 text-[#92400E] dark:text-[#FDE68A]">
            <Sliders className="w-3.5 h-3.5 text-[#B45309] dark:text-[#F59E0B]" />
            <span className="font-bold">
              Modo simulador: {TimeUtils.minutesToAmPmString(simulatedMinutes)}
            </span>
          </div>
          <button
            type="button"
            onClick={onResetSimulation}
            className="flex items-center space-x-1 text-[#B45309] dark:text-[#F59E0B] font-semibold hover:underline"
          >
            <span>Volver a hora real</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
