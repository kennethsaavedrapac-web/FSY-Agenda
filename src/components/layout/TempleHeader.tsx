import React from 'react';
import { Bell, Sliders, X } from 'lucide-react';
import { TimeUtils } from '../../utils/timeUtils';

interface TempleHeaderProps {
  isSimulationActive: boolean;
  simulatedMinutes: number;
  onNotificationClick: () => void;
  onResetSimulation: () => void;
  currentDateText?: string;
}

export const TempleHeader: React.FC<TempleHeaderProps> = ({
  isSimulationActive,
  simulatedMinutes,
  onNotificationClick,
  onResetSimulation,
  currentDateText = 'Sábado • FSY de 1 día'
}) => {
  return (
    <div className="relative w-full overflow-hidden bg-white pt-3 pb-2 px-4.5 border-b border-slate-100">
      {/* Procedural background reproducing TempleHeader.kt */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 400 130"
      >
        <defs>
          <radialGradient id="skyRadial" cx="85%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#F0F9FF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sky gradient */}
        <rect width="400" height="130" fill="url(#skyRadial)" />

        {/* Left Spire (opacity 0.35) */}
        <path
          d="M 276 125 L 276 65 L 284 35 L 292 65 L 292 125 Z"
          fill="#BAE6FD"
          fillOpacity="0.35"
        />

        {/* Right Spire (opacity 0.35) */}
        <path
          d="M 324 125 L 324 60 L 332 30 L 340 60 L 340 125 Z"
          fill="#BAE6FD"
          fillOpacity="0.35"
        />

        {/* Center Main Temple Spire (opacity 0.45) */}
        <path
          d="M 296 125 L 296 40 L 302 30 L 306 -10 L 308 -25 L 310 -10 L 314 30 L 320 40 L 320 125 Z"
          fill="#BAE6FD"
          fillOpacity="0.45"
        />

        {/* Soft Pine Trees Layer (opacity 0.35) */}
        <path
          d="M 220 130 
             L 240 95 L 252 110 
             L 272 88 L 288 105 
             L 312 82 L 328 102 
             L 352 90 L 368 108 
             L 384 98 L 400 130 Z"
          fill="#A7F3D0"
          fillOpacity="0.35"
        />
      </svg>

      {/* Main Header Row */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          {/* Temple Badge Logo (52x52 rounded 14px) */}
          <div className="w-[52px] h-[52px] rounded-[14px] overflow-hidden shadow-sm flex-shrink-0 bg-[#0284C7]">
            <img
              src="/icons/ic_temple_logo.svg"
              alt="FSY Granada"
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <h1 className="text-[24px] font-extrabold text-[#0F172A] tracking-tight leading-tight">
              FSY Agenda
            </h1>
            <p className="text-[14px] font-semibold text-[#334155] leading-snug">
              Distrito Granada 2026
            </p>
            <p className="text-[12px] font-normal text-[#64748B] leading-tight">
              {currentDateText}
            </p>
          </div>
        </div>

        {/* Notification Bell Button */}
        <button
          type="button"
          onClick={onNotificationClick}
          aria-label="Notificaciones y Ajustes"
          className="p-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors text-[#1E293B]"
        >
          <Bell className="w-[26px] h-[26px]" strokeWidth={1.8} />
        </button>
      </div>

      {/* Simulation Banner when active */}
      {isSimulationActive && (
        <div className="relative z-10 mt-2.5 px-3 py-1.5 rounded-[10px] bg-[#FEF3C7] border border-[#FCD34D] flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center space-x-2 text-[#92400E]">
            <Sliders className="w-3.5 h-3.5 text-[#B45309]" />
            <span className="font-bold">
              Modo simulador: {TimeUtils.minutesToAmPmString(simulatedMinutes)}
            </span>
          </div>
          <button
            type="button"
            onClick={onResetSimulation}
            className="flex items-center space-x-1 text-[#B45309] font-semibold hover:underline"
          >
            <span>Volver a hora real</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

