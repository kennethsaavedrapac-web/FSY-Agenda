import React from 'react';
import { ChevronRight, Clock, MapPin } from 'lucide-react';
import type { FsyActivity } from '../../models/types';
import { TimeUtils } from '../../utils/timeUtils';
import { getCategoryStyle } from '../../utils/iconUtils';

interface NextActivityCardProps {
  activity: FsyActivity;
  currentMinutes?: number;
  onClick: () => void;
}

export const NextActivityCard: React.FC<NextActivityCardProps> = ({
  activity,
  onClick
}) => {
  const categoryStyle = getCategoryStyle(activity.category, activity.title, activity.iconName);
  const CategoryIcon = categoryStyle.Icon;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className="w-full rounded-[20px] bg-[#F0F7FF] border border-[#D8ECFD] p-[18px] cursor-pointer transition-all active:scale-[0.99] hover:shadow-xs focus:outline-none"
    >
      {/* Top Pill with "> Siguiente" */}
      <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-[#D8ECFD] text-[#0284C7] mb-3">
        <ChevronRight className="w-4 h-4 text-[#0284C7]" strokeWidth={2.5} />
        <span className="text-[12px] font-bold">Siguiente</span>
      </div>

      {/* Main Content: Avatar and details */}
      <div className="flex items-center space-x-3.5">
        {/* Circle Category Avatar (52px) */}
        <div
          className="w-[52px] h-[52px] rounded-full flex items-center justify-center flex-shrink-0 shadow-xs"
          style={{ backgroundColor: categoryStyle.background }}
        >
          <CategoryIcon className="w-6.5 h-6.5" style={{ color: categoryStyle.tint }} />
        </div>

        {/* Title, Time, Location */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[18px] font-bold text-[#0F172A] leading-snug">
            {activity.title}
          </h3>

          <div className="flex items-center space-x-1.5 mt-1 text-[#1E293B]">
            <Clock className="w-4 h-4 text-[#334155] flex-shrink-0" />
            <span className="text-[14px] font-semibold">
              {TimeUtils.formatTimeRangeAmPm(activity.startTime, activity.endTime)}
            </span>
          </div>

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
    </div>
  );
};
