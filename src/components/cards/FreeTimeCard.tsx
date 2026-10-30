import React from 'react';
import { Info } from 'lucide-react';
import type { FsyActivity } from '../../models/types';
import { TimeUtils } from '../../utils/timeUtils';
import { getActivityMinutesUntilStart } from '../../hooks/useClockTicker';

interface FreeTimeCardProps {
  nextActivity: FsyActivity | null;
  currentMinutes: number;
  onNextClick?: () => void;
}

export const FreeTimeCard: React.FC<FreeTimeCardProps> = ({
  nextActivity,
  currentMinutes,
  onNextClick
}) => {
  return (
    <div className="w-full rounded-[20px] bg-[#F8FAFC] border border-[#E2E8F0] p-[18px]">
      <div className="flex items-start space-x-3">
        <div className="w-9 h-9 rounded-full bg-[#E2E8F0] flex items-center justify-center flex-shrink-0 mt-0.5">
          <Info className="w-5 h-5 text-[#0F172A]" />
        </div>
        <div>
          <h3 className="text-[16px] font-bold text-[#0F172A]">
            Tiempo libre / Traslado
          </h3>
          <p className="text-[13px] text-[#64748B] mt-0.5 leading-snug">
            Momento para hidratarse, dirigirse a la siguiente zona y acompañar a los jóvenes.
          </p>
        </div>
      </div>

      {nextActivity && (
        <div
          onClick={onNextClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNextClick?.(); }}
          className="mt-3.5 p-3 rounded-[12px] bg-[#F0F7FF] border border-[#D8ECFD] flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] hover:bg-[#E8F4FE]"
        >
          <div className="flex-1 min-w-0 pr-2">
            <h4 className="text-[14px] font-bold text-[#0F172A] truncate">
              Próxima actividad: {nextActivity.title}
            </h4>
            <p className="text-[12px] text-[#0284C7] mt-0.5 truncate">
              {TimeUtils.minutesToAmPmString(nextActivity.startMinutes)}
              {nextActivity.location ? ` • ${nextActivity.location}` : ''}
            </p>
          </div>
          <div className="bg-[#E0F2FE] text-[#0284C7] px-2.5 py-1 rounded-[6px] text-[11px] font-bold flex-shrink-0">
            {TimeUtils.formatUntilStartText(getActivityMinutesUntilStart(nextActivity, currentMinutes))}
          </div>
        </div>
      )}
    </div>
  );
};
