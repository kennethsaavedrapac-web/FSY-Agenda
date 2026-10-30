import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Download,
  ChevronRight,
  ChevronDown,
  User,
  Bell,
  Sliders,
  Info,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  Palette,
  Sun,
  Moon,
  Monitor,
  Check
} from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { EVENT_DATE, TimeUtils } from '../utils/timeUtils';
import { useClock } from '../context/ClockContext';
import type { PresetTime, ThemeMode } from '../models/types';
import type { PwaInstall } from '../hooks/usePwaInstall';
import { InstallInstructionsDialog } from '../components/InstallInstructionsDialog';

interface SettingsPageProps {
  installation: PwaInstall;
  installInstructionsOpen: boolean;
  onOpenInstallInstructions: () => void;
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

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onReloadSchedule,
  onNavigateBack,
  installation,
  installInstructionsOpen,
  onOpenInstallInstructions
}) => {
  const activePage = useRef(false);
  useEffect(() => {
    activePage.current = true;
    return () => { activePage.current = false; };
  }, []);

  const {
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
  } = usePreferences();

  const { currentDate } = useClock();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(true);

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

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    const label = newTheme === 'light' ? 'Claro' : newTheme === 'dark' ? 'Oscuro' : 'Automático';
    showToast(`Tema configurado en modo ${label}.`);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] dark:bg-[#0B1220] relative transition-colors">
      {/* Top Header */}
      <div className="bg-white dark:bg-[#111C2E] border-b border-[#E2E8F0] dark:border-[#293A52] px-4 pt-3.5 pb-3 shadow-xs sticky top-0 z-20 transition-colors">
        <h1 className="text-[22px] font-extrabold text-[#0F2942] dark:text-[#F1F5F9] tracking-tight">
          <button
            type="button"
            onClick={onNavigateBack}
            aria-label="Volver"
            className="inline-flex items-center justify-center w-11 h-11 -ml-2 mr-1 align-middle rounded-full hover:bg-slate-100 dark:hover:bg-[#1D2C43] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#0F2942] dark:text-[#F1F5F9]" />
          </button>
          Perfil y Ajustes
        </h1>
        <p className="text-[12px] font-normal text-[#64748B] dark:text-[#A8B8CC] mt-0.5">
          Personalización local y simulación del evento
        </p>
      </div>

      {/* Settings Form Container */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* --- INSTALL APP CARD --- */}
        <section className="install-surface rounded-[18px] border p-4.5 shadow-xs" aria-label="Instalación de la aplicación">
          {installation.installed ? (
            <div id="install-app" tabIndex={-1} role="status" className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-[#059669] dark:text-[#34D399]" aria-hidden="true" />
              <span className="text-[16px] font-bold">Aplicación instalada</span>
            </div>
          ) : (
            <button
              id="install-app"
              type="button"
              disabled={installation.busy}
              onClick={async () => {
                if (await installation.requestInstall() === 'instructions' && activePage.current) {
                  onOpenInstallInstructions();
                }
              }}
              className="w-full flex items-center gap-2.5 text-left rounded-[12px] min-h-11 disabled:opacity-70 cursor-pointer"
            >
              <span className="install-icon w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="block text-[16px] font-bold">Instalar aplicación</span>
                <span className="install-muted block text-[12px]">Accede rápidamente desde tu pantalla de inicio</span>
              </span>
              <ChevronRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            </button>
          )}
          {installation.message && !installation.installed && (
            <p role="status" className="install-muted mt-3 text-[12px]">{installation.message}</p>
          )}
        </section>

        {/* --- 1. COUNSELOR PROFILE CARD --- */}
        <div className="bg-white dark:bg-[#172338] rounded-[18px] border border-[#E2E8F0] dark:border-[#293A52] p-4.5 shadow-xs transition-colors">
          <div className="flex items-center space-x-2.5 mb-3.5">
            <div className="w-9 h-9 rounded-full bg-[#EFF6FF] dark:bg-[#1D2C43] flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8]" />
            </div>
            <h2 className="text-[16px] font-bold text-[#0F2942] dark:text-[#F1F5F9]">
              Datos del Consejero
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#64748B] dark:text-[#A8B8CC] mb-1">
                Nombre del Consejero
              </label>
              <input
                type="text"
                value={counselorName}
                onChange={(e) => setCounselorName(e.target.value)}
                placeholder="Ej: Hno. Carlos Morales"
                className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#293A52] text-[14px] text-[#0F172A] dark:text-[#F1F5F9] placeholder-[#94A3B8] dark:placeholder-[#64748B] focus:outline-none focus:border-[#0284C7] dark:focus:border-[#38BDF8] focus:bg-white dark:focus:bg-[#111C2E] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#64748B] dark:text-[#A8B8CC] mb-1">
                Compañía Asignada
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ej: Compañía 4 - Moroni"
                className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#F8FAFC] dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#293A52] text-[14px] text-[#0F172A] dark:text-[#F1F5F9] placeholder-[#94A3B8] dark:placeholder-[#64748B] focus:outline-none focus:border-[#0284C7] dark:focus:border-[#38BDF8] focus:bg-white dark:focus:bg-[#111C2E] transition-colors"
              />
            </div>

            <p className="text-[11.5px] text-[#64748B] dark:text-[#A8B8CC] pt-0.5">
              Guardado localmente en tu dispositivo. No requiere internet.
            </p>
          </div>
        </div>

        {/* --- 2. NOTIFICATIONS & REMINDERS CARD --- */}
        <div className="bg-white dark:bg-[#172338] rounded-[18px] border border-[#E2E8F0] dark:border-[#293A52] p-4.5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-full bg-[#F0FDF4] dark:bg-[#064E3B] flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-[#059669] dark:text-[#34D399]" />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-[#0F2942] dark:text-[#F1F5F9]">
                  Recordatorios de Actividad
                </h2>
                <p className="text-[12px] text-[#64748B] dark:text-[#A8B8CC]">
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
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#059669]"></div>
            </label>
          </div>

          {notificationsEnabled && (
            <div className="mt-3.5 pt-3 border-t border-[#F1F5F9] dark:border-[#1E2D42]">
              <span className="text-[12px] font-semibold text-[#1E293B] dark:text-[#CBD5E1] block mb-2">
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
                          ? 'bg-[#0F2942] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] border-[#0F2942] dark:border-[#38BDF8]'
                          : 'bg-[#F1F5F9] dark:bg-[#111C2E] text-[#1E293B] dark:text-[#A8B8CC] border-[#E2E8F0] dark:border-[#293A52] hover:bg-slate-200 dark:hover:bg-[#1D2C43]'
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

        {/* --- 3. APARIENCIA CARD (THEME SELECTOR) --- */}
        <div className="bg-white dark:bg-[#172338] rounded-[18px] border border-[#E2E8F0] dark:border-[#293A52] p-4.5 shadow-xs transition-colors">
          <div className="flex items-center space-x-2.5 mb-3.5">
            <div className="w-9 h-9 rounded-full bg-[#EFF6FF] dark:bg-[#1D2C43] flex items-center justify-center flex-shrink-0">
              <Palette className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8]" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[#0F2942] dark:text-[#F1F5F9]">
                Apariencia
              </h2>
              <p className="text-[12px] text-[#64748B] dark:text-[#A8B8CC]">
                Modo visual y colores de la aplicación
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Clickable Header for "Tema de la aplicación" */}
            <button
              type="button"
              onClick={() => setIsThemePickerOpen(!isThemePickerOpen)}
              className="w-full flex items-center justify-between py-1 text-left rounded-[10px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] dark:focus-visible:ring-[#38BDF8]"
              aria-expanded={isThemePickerOpen}
            >
              <div className="flex items-center space-x-2">
                <span className="text-[14px] font-semibold text-[#1E293B] dark:text-[#F1F5F9]">
                  Tema de la aplicación
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[12px] font-bold text-[#0284C7] dark:text-[#38BDF8] bg-[#E0F2FE] dark:bg-[#1D2C43] px-2.5 py-0.5 rounded-full">
                  {theme === 'auto' ? 'Automático' : theme === 'dark' ? 'Oscuro' : 'Claro'}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#64748B] dark:text-[#A8B8CC] transition-transform duration-200 ${
                    isThemePickerOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {/* Elegant 3-option Appearance Selector */}
            {isThemePickerOpen && (
              <div
                className="grid grid-cols-3 gap-2 pt-1 animate-in fade-in duration-200"
                role="radiogroup"
                aria-label="Seleccionar tema de la aplicación"
              >
                {/* 1. Claro */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={theme === 'light'}
                  onClick={() => handleThemeChange('light')}
                  className={`p-3 rounded-[14px] border text-center flex flex-col items-center justify-between transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-[#EFF6FF] dark:bg-[#1D2C43] border-[#0284C7] dark:border-[#38BDF8] ring-1 ring-[#0284C7] dark:ring-[#38BDF8] shadow-xs'
                      : 'bg-[#F8FAFC] dark:bg-[#111C2E] border-[#E2E8F0] dark:border-[#293A52] hover:bg-slate-100 dark:hover:bg-[#17253D]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mb-1.5">
                    <Sun className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className={`text-[13px] font-bold ${
                    theme === 'light'
                      ? 'text-[#0284C7] dark:text-[#38BDF8]'
                      : 'text-[#1E293B] dark:text-[#F1F5F9]'
                  }`}>
                    Claro
                  </span>
                  <span className="text-[10px] text-[#64748B] dark:text-[#A8B8CC] mt-0.5">
                    Original
                  </span>
                  {theme === 'light' && (
                    <div className="w-4 h-4 rounded-full bg-[#0284C7] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] flex items-center justify-center mt-1.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>

                {/* 2. Oscuro */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={theme === 'dark'}
                  onClick={() => handleThemeChange('dark')}
                  className={`p-3 rounded-[14px] border text-center flex flex-col items-center justify-between transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-[#EFF6FF] dark:bg-[#1D2C43] border-[#0284C7] dark:border-[#38BDF8] ring-1 ring-[#0284C7] dark:ring-[#38BDF8] shadow-xs'
                      : 'bg-[#F8FAFC] dark:bg-[#111C2E] border-[#E2E8F0] dark:border-[#293A52] hover:bg-slate-100 dark:hover:bg-[#17253D]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center mb-1.5">
                    <Moon className="w-4 h-4 text-sky-500 dark:text-[#38BDF8]" />
                  </div>
                  <span className={`text-[13px] font-bold ${
                    theme === 'dark'
                      ? 'text-[#0284C7] dark:text-[#38BDF8]'
                      : 'text-[#1E293B] dark:text-[#F1F5F9]'
                  }`}>
                    Oscuro
                  </span>
                  <span className="text-[10px] text-[#64748B] dark:text-[#A8B8CC] mt-0.5">
                    Azul marino
                  </span>
                  {theme === 'dark' && (
                    <div className="w-4 h-4 rounded-full bg-[#0284C7] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] flex items-center justify-center mt-1.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>

                {/* 3. Automático */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={theme === 'auto'}
                  onClick={() => handleThemeChange('auto')}
                  className={`p-3 rounded-[14px] border text-center flex flex-col items-center justify-between transition-all cursor-pointer ${
                    theme === 'auto'
                      ? 'bg-[#EFF6FF] dark:bg-[#1D2C43] border-[#0284C7] dark:border-[#38BDF8] ring-1 ring-[#0284C7] dark:ring-[#38BDF8] shadow-xs'
                      : 'bg-[#F8FAFC] dark:bg-[#111C2E] border-[#E2E8F0] dark:border-[#293A52] hover:bg-slate-100 dark:hover:bg-[#17253D]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-1.5">
                    <Monitor className="w-4 h-4 text-slate-600 dark:text-[#A8B8CC]" />
                  </div>
                  <span className={`text-[13px] font-bold ${
                    theme === 'auto'
                      ? 'text-[#0284C7] dark:text-[#38BDF8]'
                      : 'text-[#1E293B] dark:text-[#F1F5F9]'
                  }`}>
                    Auto
                  </span>
                  <span className="text-[10px] text-[#64748B] dark:text-[#A8B8CC] mt-0.5">
                    Sistema
                  </span>
                  {theme === 'auto' && (
                    <div className="w-4 h-4 rounded-full bg-[#0284C7] dark:bg-[#38BDF8] text-white dark:text-[#0B1220] flex items-center justify-center mt-1.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              </div>
            )}

            <p className="text-[11.5px] text-[#64748B] dark:text-[#A8B8CC] pt-0.5 leading-relaxed">
              {theme === 'auto'
                ? `Modo automático activo: la interfaz sigue el tema de tu dispositivo (actualmente ${resolvedTheme === 'dark' ? 'oscuro' : 'claro'}).`
                : theme === 'dark'
                ? 'Modo oscuro premium con paleta azul marino, gris azulado y acentos celestes.'
                : 'Modo claro estándar con fondo diurno y colores originales.'}
            </p>
          </div>
        </div>

        {/* --- 4. TIME SIMULATOR / PREVIEW MODE CARD --- */}
        <div
          className={`rounded-[18px] border transition-colors p-4.5 shadow-xs ${
            simulationActive
              ? 'bg-[#FFFBEB] dark:bg-[#251A0E] border-[#FCD34D] dark:border-[#78350F]'
              : 'bg-white dark:bg-[#172338] border-[#E2E8F0] dark:border-[#293A52]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  simulationActive
                    ? 'bg-[#FEF3C7] dark:bg-[#3D240F]'
                    : 'bg-[#F1F5F9] dark:bg-[#1D2C43]'
                }`}
              >
                <Sliders
                  className={`w-5 h-5 ${
                    simulationActive
                      ? 'text-[#B45309] dark:text-[#F59E0B]'
                      : 'text-[#1E293B] dark:text-[#A8B8CC]'
                  }`}
                />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-[#0F2942] dark:text-[#F1F5F9]">
                  Modo Vista Previa
                </h2>
                <p className="text-[12px] text-[#64748B] dark:text-[#A8B8CC]">
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
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D97706]"></div>
            </label>
          </div>

          <p className="mt-3 text-[12px] text-[#64748B] dark:text-[#A8B8CC]">
            {simulationActive ? 'Simulación manual' : 'Hora real'} • {TimeUtils.getEventDateTime(currentDate).date} • {TimeUtils.minutesToAmPmString(TimeUtils.getCurrentMinutes(currentDate))}
            <br />Nicaragua · America/Managua (UTC-6)
            <br />La agenda usa solo la hora; la fecha no cambia los estados.
          </p>

          {simulationActive && (
            <div className="mt-3.5 pt-3.5 border-t border-[#FDE68A] dark:border-[#78350F] space-y-3">
              <div className="flex gap-3">
                <label className="flex-1 min-w-0 text-[12px] font-semibold text-[#92400E] dark:text-[#FDE68A]">
                  Fecha simulada
                  <input
                    type="date"
                    value={simulatedDate}
                    onChange={(e) => setSimulatedDate(e.target.value)}
                    className="mt-1 w-full rounded-[12px] border border-[#FDE68A] dark:border-[#78350F] bg-white dark:bg-[#172338] text-[#0F172A] dark:text-[#F1F5F9] p-2 text-[14px]"
                  />
                </label>
                <label className="flex-1 min-w-0 text-[12px] font-semibold text-[#92400E] dark:text-[#FDE68A]">
                  Hora simulada
                  <input
                    type="time"
                    value={TimeUtils.minutesToTimeString(simulatedMinutes)}
                    onChange={(e) => { if (e.target.value) setSimulatedMinutes(TimeUtils.parseTimeToMinutes(e.target.value)); }}
                    className="mt-1 w-full rounded-[12px] border border-[#FDE68A] dark:border-[#78350F] bg-white dark:bg-[#172338] text-[#0F172A] dark:text-[#F1F5F9] p-2 text-[14px]"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={resetSimulation}
                className="text-[13px] font-bold text-[#B45309] dark:text-[#F59E0B] hover:underline cursor-pointer"
              >
                Volver a hora real
              </button>
              {/* Simulated Time Box */}
              <div className="bg-white dark:bg-[#172338] rounded-[12px] border border-[#FDE68A] dark:border-[#78350F] p-3 flex items-center justify-between shadow-xs">
                <span className="text-[13px] font-medium text-[#64748B] dark:text-[#A8B8CC]">
                  Hora simulada:
                </span>
                <span className="text-[20px] font-extrabold text-[#B45309] dark:text-[#F59E0B]">
                  {TimeUtils.minutesToAmPmString(simulatedMinutes)}
                </span>
              </div>

              {/* Slider (07:00 / 420 to 23:00 / 1380) */}
              <div>
                <div className="flex justify-between text-[11px] text-[#92400E] dark:text-[#FDE68A] font-medium mb-1">
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
                  className="w-full h-2 bg-[#FDE68A] dark:bg-[#45270C] rounded-lg appearance-none cursor-pointer accent-[#D97706] dark:accent-[#F59E0B]"
                />
              </div>

              {/* Quick Preset Chips Carousel */}
              <div>
                <span className="text-[12px] font-bold text-[#1E293B] dark:text-[#CBD5E1] block mb-2">
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
                            ? 'bg-[#B45309] dark:bg-[#D97706] text-white font-bold border-[#B45309] dark:border-[#D97706] shadow-xs'
                            : 'bg-white dark:bg-[#172338] text-[#78350F] dark:text-[#FDE68A] font-medium border-[#FDE68A] dark:border-[#78350F] hover:bg-amber-100 dark:hover:bg-[#2D1F12]'
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

        {/* --- 5. EVENT & SYSTEM INFO CARD --- */}
        <div className="bg-white dark:bg-[#172338] rounded-[18px] border border-[#E2E8F0] dark:border-[#293A52] p-4.5 shadow-xs transition-colors">
          <div className="flex items-center space-x-2.5 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#F1F5F9] dark:bg-[#1D2C43] flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-[#0F2942] dark:text-[#CBD5E1]" />
            </div>
            <h2 className="text-[16px] font-bold text-[#0F2942] dark:text-[#F1F5F9]">
              Información del Evento
            </h2>
          </div>

          <div className="space-y-1">
            <p className="text-[14px] font-bold text-[#0F2942] dark:text-[#F1F5F9]">
              FSY Distrito Granada 2026
            </p>
            <p className="text-[12px] text-[#1E293B] dark:text-[#CBD5E1]">
              Fecha del evento: {EVENT_DATE ?? 'Por confirmar'} · Nicaragua (UTC-6)
            </p>
            <p className="text-[12px] text-[#1E293B] dark:text-[#CBD5E1]">
              La Iglesia de Jesucristo de los Santos de los Últimos Días
            </p>
          </div>

          <div className="flex items-center space-x-2 mt-3 text-[#059669] dark:text-[#34D399]">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            <span className="text-[12px] font-semibold">
              100% Offline (Base de datos SQLite local Room / IndexedDB Dexie)
            </span>
          </div>

          <button
            type="button"
            onClick={handleReload}
            disabled={isReloading}
            className="w-full mt-4 py-2.5 px-4 rounded-[12px] border border-[#E2E8F0] dark:border-[#293A52] bg-white dark:bg-[#1D2C43] hover:bg-slate-50 dark:hover:bg-[#253754] active:bg-slate-100 dark:active:bg-[#2C3F5E] flex items-center justify-center space-x-2 text-[14px] font-bold text-[#0F2942] dark:text-[#F1F5F9] transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 text-[#0F2942] dark:text-[#F1F5F9] ${isReloading ? 'animate-spin' : ''}`}
            />
            <span>Recargar Agenda Oficial</span>
          </button>
        </div>

      </div>

      {/* Floating Toast Notification */}
      <InstallInstructionsDialog open={installInstructionsOpen} onClose={onNavigateBack} installation={installation} />
      {toastMessage && (
        <div className="fixed bottom-[calc(var(--fsy-nav-space)+0.5rem)] left-1/2 -translate-x-1/2 z-50 bg-[#0F2942] dark:bg-[#1D2C43] text-white dark:text-[#F1F5F9] border border-transparent dark:border-[#293A52] px-4 py-2.5 rounded-full shadow-lg text-[13px] font-semibold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#22C55E] dark:text-[#34D399]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
