import React from 'react';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Star,
  Layers,
  Info,
  UserCheck,
  Bookmark
} from 'lucide-react';
import type { FsyActivity, ActivitySegment } from '../models/types';
import { TimeUtils } from '../utils/timeUtils';
import { getCategoryStyle } from '../utils/iconUtils';
import {
  getActivityStatus,
  getActivityRemainingMinutes,
  getActivityMinutesUntilStart
} from '../hooks/useClockTicker';

interface DetailPageProps {
  activity: FsyActivity;
  currentMinutes: number;
  onNavigateBack: () => void;
}

export const DetailPage: React.FC<DetailPageProps> = ({
  activity,
  currentMinutes,
  onNavigateBack
}) => {
  const status = getActivityStatus(activity, currentMinutes);
  const categoryStyle = getCategoryStyle(activity.category, activity.title, activity.iconName);
  const CategoryIcon = categoryStyle.Icon;

  // Duration in minutes
  const durationMinutes = activity.endMinutes !== null
    ? activity.endMinutes - activity.startMinutes
    : null;

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC]">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-[#E2E8F0] px-3 py-3 flex items-center sticky top-0 z-20 shadow-xs">
        <button
          type="button"
          onClick={onNavigateBack}
          aria-label="Volver"
          className="p-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors text-[#0F2942] mr-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[18px] font-bold text-[#0F2942]">
          Detalle de Actividad
        </h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Status Badge & Category Pill */}
        <div className="flex items-center justify-between">
          {/* Status Badge */}
          <div
            className={`px-3 py-1 rounded-[10px] flex items-center space-x-2 text-[12px] font-bold ${
              status === 'CURRENT'
                ? 'bg-[#D1FAE5] text-[#065F46]'
                : status === 'FINISHED'
                  ? 'bg-[#F1F5F9] text-[#64748B]'
                  : 'bg-[#E0F2FE] text-[#0284C7]'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                status === 'CURRENT'
                  ? 'bg-[#059669]'
                  : status === 'FINISHED'
                    ? 'bg-[#64748B]'
                    : 'bg-[#0284C7]'
              }`}
            />
            <span>
              {status === 'CURRENT' ? (
                (() => {
                  const rem = getActivityRemainingMinutes(activity, currentMinutes);
                  return rem !== null ? `En curso • ${TimeUtils.formatRemainingText(rem)}` : 'En curso';
                })()
              ) : status === 'FINISHED' ? (
                'Actividad finalizada'
              ) : (
                `Próxima • ${TimeUtils.formatUntilStartText(getActivityMinutesUntilStart(activity, currentMinutes))}`
              )}
            </span>
          </div>

          {/* Category Badge */}
          <div
            className="px-3 py-1 rounded-[10px] flex items-center space-x-1.5 text-[12px] font-bold"
            style={{ backgroundColor: categoryStyle.background, color: categoryStyle.tint }}
          >
            <CategoryIcon className="w-3.5 h-3.5" style={{ color: categoryStyle.tint }} />
            <span>{categoryStyle.label}</span>
          </div>
        </div>

        {/* Activity Title */}
        <h2 className="text-[22px] font-extrabold text-[#0F2942] leading-[30px] pt-1">
          {activity.title}
        </h2>

        {/* Schedule & Duration Card */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4 flex items-center space-x-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-full bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-[#0284C7]" />
          </div>
          <div>
            <span className="text-[12px] font-semibold text-[#64748B] block">
              Horario
            </span>
            <span className="text-[16px] font-bold text-[#0F2942] block">
              {TimeUtils.formatTimeRangeAmPm(activity.startTime, activity.endTime)}
            </span>
            <span className="text-[12px] text-[#64748B]">
              {durationMinutes !== null
                ? `Duración programada: ${durationMinutes} minutos`
                : 'Hora de inicio oficial (hora de cierre abierta)'}
            </span>
          </div>
        </div>

        {/* Location Card */}
        {activity.location && (
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4 flex items-center space-x-3.5 shadow-xs">
            <div className="w-11 h-11 rounded-full bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-[#059669]" />
            </div>
            <div>
              <span className="text-[12px] font-semibold text-[#64748B] block">
                Ubicación
              </span>
              <span className="text-[16px] font-bold text-[#0F2942] block">
                {activity.location}
              </span>
            </div>
          </div>
        )}

        {/* HIGHLIGHTED: Counselor Responsibilities (Amber Card) */}
        {activity.counselorInstructions && (
          <div className="bg-[#FFFBEB] rounded-[18px] border-1.5 border-[#FDE68A] p-4.5 shadow-xs">
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-[#D97706] fill-[#D97706]" />
              </div>
              <h3 className="text-[16px] font-extrabold text-[#92400E]">
                Instrucciones para Consejeros
              </h3>
            </div>
            <p className="text-[15px] font-medium text-[#78350F] leading-[24px]">
              {activity.counselorInstructions}
            </p>
          </div>
        )}

        {/* Internal Segments (e.g. Activity 14) */}
        {activity.segments && activity.segments.length > 0 && (
          <div className="bg-[#F0F9FF] rounded-[18px] border border-[#BAE6FD] p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-[#0284C7]" />
              <h3 className="text-[16px] font-bold text-[#0F2942]">
                Segmentos de la actividad
              </h3>
            </div>

            <div className="space-y-2.5">
              {activity.segments.map((segment: ActivitySegment, index: number) => (
                <div
                  key={index}
                  className="bg-white rounded-[12px] border border-[#E2E8F0] p-3 shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-[14px] font-bold text-[#0F2942]">
                      {segment.title}
                    </h4>
                    <span className="bg-[#E0F2FE] text-[#0284C7] px-2 py-0.5 rounded-[6px] text-[11px] font-bold">
                      {TimeUtils.formatTimeRangeAmPm(segment.startTime, segment.endTime)}
                    </span>
                  </div>

                  {segment.manualReference && (
                    <p className="text-[12px] font-semibold text-[#0369A1] mt-0.5">
                      Manual: {segment.manualReference}
                    </p>
                  )}

                  {segment.description && (
                    <p className="text-[12px] text-[#1E293B] mt-1 leading-[18px]">
                      {segment.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* General Description */}
        {activity.description && (
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4 shadow-xs">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="w-5 h-5 text-[#0F2942]" />
              <h3 className="text-[15px] font-bold text-[#0F2942]">
                Descripción
              </h3>
            </div>
            <p className="text-[14px] text-[#1E293B] leading-[22px]">
              {activity.description}
            </p>
          </div>
        )}

        {/* Responsible Leaders */}
        {activity.responsible && (
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4 flex items-center space-x-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 text-[#1E293B]" />
            </div>
            <div>
              <span className="text-[12px] font-semibold text-[#64748B] block">
                Responsables
              </span>
              <span className="text-[14px] font-bold text-[#0F2942] block">
                {activity.responsible}
              </span>
            </div>
          </div>
        )}

        {/* FSY Manual Reference */}
        {activity.manualReference && (
          <div className="bg-[#F8FAFC] rounded-[16px] border border-[#E2E8F0] p-3.5 flex items-center space-x-3">
            <Bookmark className="w-5 h-5 text-[#0284C7] flex-shrink-0" />
            <div>
              <span className="text-[11px] text-[#64748B] block">
                Referencia del Manual FSY
              </span>
              <span className="text-[14px] font-semibold text-[#0F2942]">
                {activity.manualReference}
              </span>
            </div>
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
};
