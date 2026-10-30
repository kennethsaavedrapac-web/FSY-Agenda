import React from 'react';
import { MapPin } from 'lucide-react';
import type { FsyActivity } from '../../models/types';
import { TimeUtils } from '../../utils/timeUtils';
import { getCategoryStyle } from '../../utils/iconUtils';
import { getActivityStatus, isTransferActivity } from '../../hooks/useClockTicker';

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
  const status = getActivityStatus(activity, currentMinutes);
  const isTransfer = isTransferActivity(activity);
  const categoryStyle = getCategoryStyle(activity.category, activity.title, activity.iconName);
  const CategoryIcon = categoryStyle.Icon;

  // Node dot color & size
  const dotColor = status === 'CURRENT'
    ? 'bg-[#22C55E] ring-4 ring-[#DCFCE7]'
    : isTransfer
      ? 'bg-[#93C5FD]'
      : 'bg-[#2563EB]';

  const dotSize = isTransfer ? 'w-[9px] h-[9px]' : 'w-[12px] h-[12px]';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className={`w-full flex items-center group cursor-pointer focus:outline-none ${
        isTransfer ? 'py-[2px]' : 'py-[4px]'
      }`}
    >
      {/* 1. Left Column: Hours (fixed width 66px) */}
      <div className="w-[66px] flex-shrink-0 flex flex-col justify-center text-left pr-1">
        <span className="text-[11px] font-medium text-[#475569] leading-tight">
          {TimeUtils.minutesToAmPmString(activity.startMinutes)}
        </span>
        {activity.endMinutes !== null && (
          <span className="text-[11px] font-normal text-[#64748B] leading-tight mt-0.5">
            {TimeUtils.minutesToAmPmString(activity.endMinutes)}
          </span>
        )}
      </div>

      {/* 2. Middle Column: Timeline Line & Node Dot (width 26px) */}
      <div className="w-[26px] self-stretch flex-shrink-0 relative flex items-center justify-center">
        {/* Connecting Line (2px) */}
        {!isFirst && (
          <div className="absolute top-0 bottom-1/2 left-1/2 -translate-x-1/2 w-[2px] bg-[#E2E8F0]" />
        )}
        {!isLast && (
          <div className="absolute top-1/2 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-[#E2E8F0]" />
        )}

        {/* Node Dot */}
        <div
          className={`relative z-10 rounded-full transition-transform group-hover:scale-125 ${dotSize} ${dotColor}`}
        />
      </div>

      {/* Spacing spacer (6px) */}
      <div className="w-1.5 flex-shrink-0" />

      {/* 3. Right Column: Activity Card */}
      <div
        className={`flex-1 min-w-0 flex items-center transition-all group-active:scale-[0.99] group-hover:shadow-xs border ${
          isTransfer
            ? 'bg-[#F8FAFC] border-[#E2E8F0] rounded-[12px] px-2.5 py-2'
            : 'bg-white border-[#F1F5F9] shadow-xs rounded-[16px] px-3.5 py-3'
        }`}
      >
        {/* Category Icon */}
        <div
          className={`rounded-[12px] flex items-center justify-center flex-shrink-0 mr-3 ${
            isTransfer ? 'w-8 h-8 rounded-[8px]' : 'w-11 h-11 rounded-[12px]'
          }`}
          style={{ backgroundColor: categoryStyle.background }}
        >
          <CategoryIcon
            className={isTransfer ? 'w-[18px] h-[18px]' : 'w-[24px] h-[24px]'}
            style={{ color: categoryStyle.tint }}
          />
        </div>

        {/* Title & Location */}
        <div className="flex-1 min-w-0">
          <h4
            className={`truncate font-bold leading-snug ${
              isTransfer
                ? 'text-[13.5px] font-semibold text-[#334155]'
                : 'text-[15px] font-bold text-[#0F172A]'
            }`}
          >
            {activity.title}
          </h4>

          {activity.location && (
            <div className="flex items-center space-x-1 mt-0.5 text-[#64748B]">
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
