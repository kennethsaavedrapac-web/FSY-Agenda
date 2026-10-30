import React from 'react';
import { MapPin } from 'lucide-react';
import type { FsyActivity } from '../../models/types';
import { TimeUtils } from '../../utils/timeUtils';
import { getCategoryStyle } from '../../utils/iconUtils';
import { getActivityStatus, isTransferActivity } from '../../hooks/useClockTicker';
import { useTheme } from '../../context/PreferencesContext';

interface TimelineItemProps {
  activity: FsyActivity;
  currentMinutes: number;
  isFirst: boolean;
  isLast: boolean;
  onClick: () => void;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  activity,
  currentMinutes,
  isFirst,
  isLast,
  onClick
}) => {
  const { isDark } = useTheme();
  const status = getActivityStatus(activity, currentMinutes);
  const isFinished = status === 'FINISHED';
  const isTransfer = isTransferActivity(activity);
  const categoryStyle = getCategoryStyle(activity.category, activity.title, activity.iconName);
  const CategoryIcon = categoryStyle.Icon;

  // Node dot color & size
  const dotColor = status === 'CURRENT'
    ? 'bg-[#22C55E] ring-4 ring-[#DCFCE7] dark:ring-[#064E3B]'
    : isFinished
      ? 'bg-slate-400 dark:bg-slate-500'
      : isTransfer
        ? 'bg-[#93C5FD] dark:bg-[#38BDF8]'
        : 'bg-[#2563EB] dark:bg-[#38BDF8]';

  const dotSize = isTransfer ? 'w-[9px] h-[9px]' : 'w-[12px] h-[12px]';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className={`w-full flex items-center group cursor-pointer rounded-[12px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284C7] dark:focus-visible:outline-[#38BDF8] transition-colors ${
        isTransfer ? 'py-[2px]' : 'py-[4px]'
      }`}
    >
      {/* 1. Left Column: Hours (fixed width 66px) */}
      <div className="w-[66px] flex-shrink-0 flex flex-col justify-center text-left pr-1">
        <span className="text-[11px] font-medium text-[#475569] dark:text-[#CBD5E1] leading-tight">
          {TimeUtils.minutesToAmPmString(activity.startMinutes)}
        </span>
        {activity.endMinutes !== null && (
          <span className="text-[11px] font-normal text-[#64748B] dark:text-[#A8B8CC] leading-tight mt-0.5">
            {TimeUtils.minutesToAmPmString(activity.endMinutes)}
          </span>
        )}
      </div>

      {/* 2. Middle Column: Timeline Line & Node Dot (width 26px) */}
      <div className="w-[26px] self-stretch flex-shrink-0 relative flex items-center justify-center">
        {/* Connecting Line (2px) */}
        {!isFirst && (
          <div className="absolute top-0 bottom-1/2 left-1/2 -translate-x-1/2 w-[2px] bg-[#E2E8F0] dark:bg-[#293A52]" />
        )}
        {!isLast && (
          <div className="absolute top-1/2 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-[#E2E8F0] dark:bg-[#293A52]" />
        )}

        {/* Node Dot */}
        <div
          className={`relative z-10 rounded-full transition-[transform,background-color,box-shadow] duration-250 motion-reduce:transition-none group-hover:scale-125 ${dotSize} ${dotColor}`}
        />
      </div>

      {/* Spacing spacer (6px) */}
      <div className="w-1.5 flex-shrink-0" />

      {/* 3. Right Column: Activity Card */}
      <div
        className={`flex-1 min-w-0 flex items-center transition-[opacity,filter,background-color,border-color,box-shadow,transform] duration-250 motion-reduce:transition-none group-active:scale-[0.99] group-hover:shadow-xs border ${
          isFinished ? 'opacity-75 grayscale-[0.35]' : 'opacity-100 grayscale-0'
        } ${
          isTransfer
            ? 'bg-[#F8FAFC] dark:bg-[#111C2E] border-[#E2E8F0] dark:border-[#1F2E45] rounded-[12px] px-2.5 py-2'
            : 'bg-white dark:bg-[#172338] border-[#F1F5F9] dark:border-[#293A52] shadow-xs rounded-[16px] px-3.5 py-3'
        }`}
      >
        {/* Category Icon */}
        <div
          className={`rounded-[12px] flex items-center justify-center flex-shrink-0 mr-3 transition-colors ${
            isTransfer ? 'w-8 h-8 rounded-[8px]' : 'w-11 h-11 rounded-[12px]'
          }`}
          style={{ backgroundColor: isDark ? categoryStyle.darkBackground : categoryStyle.background }}
        >
          <CategoryIcon
            className={isTransfer ? 'w-[18px] h-[18px]' : 'w-[24px] h-[24px]'}
            style={{ color: isDark ? categoryStyle.darkTint : categoryStyle.tint }}
          />
        </div>

        {/* Title & Location */}
        <div className="flex-1 min-w-0">
          <h4
            className={`truncate leading-snug ${
              isTransfer
                ? 'text-[13.5px] font-semibold text-[#334155] dark:text-[#CBD5E1]'
                : 'text-[15px] font-bold text-[#0F172A] dark:text-[#F1F5F9]'
            }`}
          >
            {activity.title}
          </h4>

          {isFinished && (
            <span className="inline-block text-[10px] font-semibold text-[#64748B] dark:text-[#A8B8CC] leading-tight">
              Finalizada
            </span>
          )}

          {activity.location && (
            <div className={`flex items-center space-x-1 mt-0.5 ${isFinished ? 'text-[#64748B] dark:text-[#A8B8CC]' : 'text-[#64748B] dark:text-[#A8B8CC]'}`}>
              <MapPin
                className={isTransfer ? 'w-3 h-3 flex-shrink-0' : 'w-3.5 h-3.5 flex-shrink-0'}
              />
              <span
                className={`truncate ${
                  isTransfer ? 'text-[11.5px]' : 'text-[13px]'
                }`}
              >
                {activity.location}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
