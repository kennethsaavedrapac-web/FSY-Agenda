import React from 'react';
import { Play, Clock, MapPin, Users } from 'lucide-react';
import type { FsyActivity } from '../../models/types';
import { TimeUtils } from '../../utils/timeUtils';
import { getActivityRemainingMinutes } from '../../hooks/useClockTicker';

interface CurrentActivityCardProps {
  activity: FsyActivity;
  currentMinutes: number;
  onClick: () => void;
}

export const CurrentActivityCard: React.FC<CurrentActivityCardProps> = ({
  activity,
  currentMinutes,
  onClick
}) => {
  const remainingMin = getActivityRemainingMinutes(activity, currentMinutes);

  const remainingText = (() => {
    if (remainingMin === null) return 'En curso';
    if (remainingMin <= 0) return 'Finalizando';
    return `Quedan ${remainingMin} min`;
  })();

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className="w-full rounded-[20px] bg-[#F0FBF5] border border-[#BCEBD3] p-[18px] cursor-pointer transition-all active:scale-[0.99] hover:shadow-xs focus:outline-none"
    >
      {/* Top Header Pill Badges */}
      <div className="flex items-center justify-between mb-3.5">
        {/* Solid Green "Actividad actual" */}
        <div className="bg-[#388E3C] text-white px-3.5 py-1.5 rounded-full flex items-center space-x-1.5 shadow-xs">
          <Play className="w-3.5 h-3.5 fill-white" />
          <span className="text-[13px] font-bold tracking-tight">Actividad actual</span>
        </div>

        {/* Soft Green "Quedan X min" */}
        <div className="bg-[#DCF5E8] text-[#2E7D32] px-3 py-1.5 rounded-full flex items-center space-x-1.5">
          <Clock className="w-3.5 h-3.5 text-[#2E7D32]" />
          <span className="text-[12px] font-bold">{remainingText}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center space-x-3.5">
        {/* Circle Avatar (Green 54px) */}
        <div className="w-[54px] h-[54px] rounded-full bg-[#4CAF50] flex items-center justify-center flex-shrink-0 shadow-xs">
          <Users className="w-7 h-7 text-white" />
        </div>

        {/* Title, Time, Location */}
        <div className="flex-1 min-w-0">
          <h2 className="text-[19px] font-bold text-[#0F172A] leading-[24px]">
            {activity.title}
          </h2>

          {/* Time row */}
          <div className="flex items-center space-x-1.5 mt-1 text-[#1E293B]">
            <Clock className="w-4 h-4 text-[#334155] flex-shrink-0" />
            <span className="text-[14px] font-semibold">
              {TimeUtils.formatTimeRangeAmPm(activity.startTime, activity.endTime)}
            </span>
          </div>

          {/* Location row */}
          {activity.location && (
            <div className="flex items-center space-x-1.5 mt-0.5 text-[#1E293B]">
              <MapPin className="w-4 h-4 text-[#1E293B] flex-shrink-0" />
              <span className="text-[14px] font-semibold truncate">
                {activity.location}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Description below */}
      {activity.description && (
        <p className="text-[13px] text-[#475569] leading-[19px] mt-3.5 font-normal">
          {activity.description}
        </p>
      )}
    </div>
  );
};
