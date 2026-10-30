import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Bell,
  Sliders,
  Info,
  WifiOff,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { EVENT_DATE, TimeUtils } from '../utils/timeUtils';
import { useClock } from '../context/ClockContext';
import type { PresetTime } from '../models/types';

interface SettingsPageProps {
  onNavigateBack: () => void;
  onReloadSchedule: () => Promise<void>;
}

const SIMULATION_PRESETS: PresetTime[] = [
  { label: '07:30 Registro', minutes: 7 * 60 + 30 },
  { label: '08:25 Traslado', minutes: 8 * 60 + 25 },
  { label: '08:38 Consejero', minutes: 8 * 60 + 38 },
  { label: '09:00 Compañía', minutes: 9 * 60 },
  { label: '09:45 Evangelio', minutes: 9 * 60 + 45 },
  { label: '10:30 Porras', minutes: 10 * 60 + 30 },
  { label: '11:30 Devocional', minutes: 11 * 60 + 30 },
  { label: '12:20 Almuerzo', minutes: 12 * 60 + 20 },
  { label: '13:10 Bloque 13:00', minutes: 13 * 60 + 10 },
  { label: '14:20 Presentación', minutes: 14 * 60 + 20 },
  { label: '15:20 Deportes', minutes: 15 * 60 + 20 },
  { label: '16:10 Foto FSY', minutes: 16 * 60 + 10 },
  { label: '16:45 Noche de Hogar', minutes: 16 * 60 + 45 },
  { label: '17:30 Fiesta', minutes: 17 * 60 + 30 },
  { label: '18:45 Despedida', minutes: 18 * 60 + 45 }
];

export const SettingsPage: React.FC<SettingsPageProps> = ({ onReloadSchedule, onNavigateBack }) => {
  const {
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
    resetSimulation
  } = usePreferences();
  const { currentDate } = useClock();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleReload = async () => {
    setIsReloading(true);
    try {
      await onReloadSchedule();
      showToast('Agenda oficial restaurada correctamente (25 actividades).');
    } catch (err) {
      console.error(err);
      showToast('Error al restaurar la agenda oficial.');
    } finally {
      setIsReloading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] relative">
      {/* Top Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 pt-3.5 pb-3 shadow-xs sticky top-0 z-20">
        <h1 className="text-[22px] font-extrabold text-[#0F2942] tracking-tight">
          <button type="button" onClick={onNavigateBack} aria-label="Volver" className="inline-flex items-center justify-center w-11 h-11 -ml-2 mr-1 align-middle rounded-full hover:bg-slate-100"><ArrowLeft className="w-5 h-5" /></button>
          Perfil y Ajustes
        </h1>
        <p className="text-[12px] font-normal text-[#64748B] mt-0.5">
          Personalización local y simulación del evento
        </p>
      </div>

      {/* Settings Form Container */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* --- 1. COUNSELOR PROFILE CARD --- */}
        <div className="bg-white rounded-[18px] border border-[#E2E8F0] p-4.5 shadow-xs">
          <div className="flex items-center space-x-2.5 mb-3.5">
            <div className="w-9 h-9 rounded-full bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-[#0284C7]" />
            </div>
            <h2 className="text-[16px] font-bold text-[#0F2942]">
              Datos del Consejero
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#64748B] mb-1">
                Nombre del Consejero
              </label>
              <input
                type="text"
                value={counselorName}
                onChange={(e) => setCounselorName(e.target.value)}
                placeholder="Ej: Hno. Carlos Morales"
                className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] text-[14px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0284C7] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#64748B] mb-1">
                Compañía Asignada
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ej: Compañía 4 - Moroni"
                className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] text-[14px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0284C7] focus:bg-white transition-colors"
              />
            </div>

            <p className="text-[11.5px] text-[#64748B] pt-0.5">
              Guardado localmente en tu dispositivo. No requiere internet.
            </p>
          </div>
        </div>

        {/* --- 2. NOTIFICATIONS & REMINDERS CARD --- */}
        <div className="bg-white rounded-[18px] border border-[#E2E8F0] p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-full bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-[#059669]" />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-[#0F2942]">
                  Recordatorios de Actividad
                </h2>
                <p className="text-[12px] text-[#64748B]">
                  Avisar antes de cada actividad
                </p>
              </div>
            </div>

            {/* Switch Toggle */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#059669]"></div>
            </label>
          </div>

          {notificationsEnabled && (
            <div className="mt-3.5 pt-3 border-t border-[#F1F5F9]">
              <span className="text-[12px] font-semibold text-[#1E293B] block mb-2">
                Minutos de anticipación:
              </span>
              <div className="flex items-center space-x-2">
                {[5, 10, 15, 20].map((mins) => {
                  const isSelected = advanceMinutes === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setAdvanceMinutes(mins)}
                      className={`px-3 py-1.5 rounded-[16px] text-[12px] font-bold transition-all border ${
                        isSelected
                          ? 'bg-[#0F2942] text-white border-[#0F2942]'
                          : 'bg-[#F1F5F9] text-[#1E293B] border-[#E2E8F0] hover:bg-slate-200'
                      }`}
                    >
                      {mins} min
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* --- 3. TIME SIMULATOR / PREVIEW MODE CARD --- */}
        <div
          className={`rounded-[18px] border transition-colors p-4.5 shadow-xs ${
            simulationActive
              ? 'bg-[#FFFBEB] border-[#FCD34D]'
              : 'bg-white border-[#E2E8F0]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  simulationActive ? 'bg-[#FEF3C7]' : 'bg-[#F1F5F9]'
                }`}
              >
                <Sliders
                  className={`w-5 h-5 ${
                    simulationActive ? 'text-[#B45309]' : 'text-[#1E293B]'
                  }`}
                />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-[#0F2942]">
                  Modo Vista Previa
                </h2>
                <p className="text-[12px] text-[#64748B]">
                  Prueba horarios sin alterar el reloj del móvil
                </p>
              </div>
            </div>

            {/* Amber Switch Toggle */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={simulationActive}
                aria-label="Activar simulación de fecha y hora"
                onChange={(e) => setSimulationActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D97706]"></div>
            </label>
          </div>

          <p className="mt-3 text-[12px] text-[#64748B]">
            {simulationActive ? 'Simulación manual' : 'Hora real'} • {TimeUtils.getEventDateTime(currentDate).date} • {TimeUtils.minutesToAmPmString(TimeUtils.getCurrentMinutes(currentDate))}
            <br />Nicaragua · America/Managua (UTC-6)
            <br />La agenda usa solo la hora; la fecha no cambia los estados.
          </p>

          {simulationActive && (
            <div className="mt-3.5 pt-3.5 border-t border-[#FDE68A] space-y-3">
              <div className="flex gap-3">
                <label className="flex-1 min-w-0 text-[12px] font-semibold text-[#92400E]">
                  Fecha simulada
                  <input
                    type="date"
                    value={simulatedDate}
                    onChange={(e) => setSimulatedDate(e.target.value)}
                    className="mt-1 w-full rounded-[12px] border border-[#FDE68A] bg-white p-2 text-[14px]"
                  />
                </label>
                <label className="flex-1 min-w-0 text-[12px] font-semibold text-[#92400E]">
                  Hora simulada
                  <input
                    type="time"
                    value={TimeUtils.minutesToTimeString(simulatedMinutes)}
                    onChange={(e) => { if (e.target.value) setSimulatedMinutes(TimeUtils.parseTimeToMinutes(e.target.value)); }}
                    className="mt-1 w-full rounded-[12px] border border-[#FDE68A] bg-white p-2 text-[14px]"
                  />
                </label>
              </div>
              <button type="button" onClick={resetSimulation} className="text-[13px] font-bold text-[#B45309] hover:underline">
                Volver a hora real
              </button>
              {/* Simulated Time Box */}
              <div className="bg-white rounded-[12px] border border-[#FDE68A] p-3 flex items-center justify-between shadow-xs">
                <span className="text-[13px] font-medium text-[#64748B]">
                  Hora simulada:
                </span>
                <span className="text-[20px] font-extrabold text-[#B45309]">
                  {TimeUtils.minutesToAmPmString(simulatedMinutes)}
                </span>
              </div>

              {/* Slider (07:00 / 420 to 23:00 / 1380) */}
              <div>
                <div className="flex justify-between text-[11px] text-[#92400E] font-medium mb-1">
                  <span>07:00 a. m.</span>
                  <span>11:00 p. m.</span>
                </div>
                <input
                  type="range"
                  min={420}
                  max={1380}
                  step={1}
                  value={simulatedMinutes}
                  onChange={(e) => setSimulatedMinutes(Number(e.target.value))}
                  className="w-full h-2 bg-[#FDE68A] rounded-lg appearance-none cursor-pointer accent-[#D97706]"
                />
              </div>

              {/* Quick Preset Chips Carousel */}
              <div>
                <span className="text-[12px] font-bold text-[#1E293B] block mb-2">
                  Accesos rápidos a momentos clave:
                </span>
                <div className="-mx-4.5 px-4.5 overflow-x-auto no-scrollbar flex items-center space-x-2 py-1">
                  {SIMULATION_PRESETS.map((preset) => {
                    const isSelected = simulatedMinutes === preset.minutes;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setSimulatedMinutes(preset.minutes)}
                        className={`px-3 py-1.5 rounded-[14px] text-[12px] whitespace-nowrap transition-all border ${
                          isSelected
                            ? 'bg-[#B45309] text-white font-bold border-[#B45309] shadow-xs'
                            : 'bg-white text-[#78350F] font-medium border-[#FDE68A] hover:bg-amber-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- 4. EVENT & SYSTEM INFO CARD --- */}
        <div className="bg-white rounded-[18px] border border-[#E2E8F0] p-4.5 shadow-xs">
          <div className="flex items-center space-x-2.5 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#F1F5F9] flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-[#0F2942]" />
            </div>
            <h2 className="text-[16px] font-bold text-[#0F2942]">
              Información del Evento
            </h2>
          </div>

          <div className="space-y-1">
            <p className="text-[14px] font-bold text-[#0F2942]">
              FSY Distrito Granada 2026
            </p>
            <p className="text-[12px] text-[#1E293B]">
              Fecha del evento: {EVENT_DATE ?? 'Por confirmar'} · Nicaragua (UTC-6)
            </p>
            <p className="text-[12px] text-[#1E293B]">
              La Iglesia de Jesucristo de los Santos de los Últimos Días
            </p>
          </div>

          <div className="flex items-center space-x-2 mt-3 text-[#059669]">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            <span className="text-[12px] font-semibold">
              100% Offline (Base de datos SQLite local Room / IndexedDB Dexie)
            </span>
          </div>

          <button
            type="button"
            onClick={handleReload}
            disabled={isReloading}
            className="w-full mt-4 py-2.5 px-4 rounded-[12px] border border-[#E2E8F0] bg-white hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center space-x-2 text-[14px] font-bold text-[#0F2942] transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 text-[#0F2942] ${isReloading ? 'animate-spin' : ''}`}
            />
            <span>Recargar Agenda Oficial</span>
          </button>
        </div>

      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-[calc(var(--fsy-nav-space)+0.5rem)] left-1/2 -translate-x-1/2 z-50 bg-[#0F2942] text-white px-4 py-2.5 rounded-full shadow-lg text-[13px] font-semibold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
