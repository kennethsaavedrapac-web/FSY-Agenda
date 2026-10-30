import React, { useMemo, useRef } from 'react';
import { ArrowLeft, Search, X, Filter, LocateFixed } from 'lucide-react';
import type { AgendaView } from '../hooks/useNavigation';
import { TimelineItem } from '../components/timeline/TimelineItem';
import type { FsyActivity, AgendaFilter } from '../models/types';
import { getActivityStatus, isTransferActivity } from '../hooks/useClockTicker';
import type { AgendaClock } from '../hooks/useClockTicker';

interface AgendaPageProps {
  view: AgendaView;
  onViewChange: (view: AgendaView) => void;
  onNavigateBack: () => void;
  clock: AgendaClock;
  activities: FsyActivity[];
  isLoading: boolean;
  onNavigateToDetail: (id: number) => void;
}

const FILTER_OPTIONS: { id: AgendaFilter; label: string }[] = [
  { id: 'ALL', label: 'Todas' },
  { id: 'CURRENT', label: 'En curso' },
  { id: 'DEVOTIONALS', label: 'Devocionales' },
  { id: 'TRANSFERS', label: 'Traslados' },
  { id: 'FOOD', label: 'Alimentación' },
  { id: 'RECREATION', label: 'Recreación' },
  { id: 'CLOSING', label: 'Despedida' }
];

export const AgendaPage: React.FC<AgendaPageProps> = ({
  view, onViewChange, onNavigateBack,
  clock,
  activities,
  isLoading,
  onNavigateToDetail
}) => {
  const { searchQuery, selectedFilter } = view;
  const setSearchQuery = (searchQuery: string) => onViewChange({ ...view, searchQuery });
  const setSelectedFilter = (selectedFilter: AgendaFilter) => onViewChange({ ...view, selectedFilter });

  const { currentMinutes, currentActivity } = clock;

  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Filtered Activities based on search and selected chip
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // 1. Text Search matching title, location, description, or counselorInstructions
      const query = searchQuery.trim().toLowerCase();
      if (query.length > 0) {
        const matchTitle = act.title.toLowerCase().includes(query);
        const matchLocation = act.location.toLowerCase().includes(query);
        const matchDesc = act.description.toLowerCase().includes(query);
        const matchInstructions = act.counselorInstructions.toLowerCase().includes(query);

        if (!matchTitle && !matchLocation && !matchDesc && !matchInstructions) {
          return false;
        }
      }

      // 2. Category Filter
      const lowerTitle = act.title.toLowerCase();
      const lowerCat = act.category.toLowerCase();
      const status = getActivityStatus(act, currentMinutes);

      switch (selectedFilter) {
        case 'CURRENT':
          return status === 'CURRENT';
        case 'DEVOTIONALS':
          return lowerTitle.includes('devocional');
        case 'TRANSFERS':
          return isTransferActivity(act);
        case 'FOOD':
          return lowerCat.includes('descanso') || lowerTitle.includes('almuerzo') || lowerTitle.includes('cena');
        case 'RECREATION':
          return (
            lowerTitle.includes('juegos') ||
            lowerTitle.includes('deportivas') ||
            lowerTitle.includes('porras') ||
            lowerTitle.includes('fiesta') ||
            lowerTitle.includes('variedades') ||
            lowerTitle.includes('foto')
          );
        case 'CLOSING':
          return lowerCat.includes('cierre') || lowerTitle.includes('despedida');
        case 'ALL':
        default:
          return true;
      }
    });
  }, [activities, searchQuery, selectedFilter, currentMinutes]);

  // Scroll to current activity
  const scrollToCurrent = () => {
    if (currentActivity && itemRefs.current[currentActivity.id]) {
      itemRefs.current[currentActivity.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] relative">
      {/* Top Header & Search Surface */}
      <div className="bg-white border-b border-[#E2E8F0] shadow-xs sticky top-0 z-20 px-4 pt-3.5 pb-3">
        <h1 className="text-[22px] font-extrabold text-[#0F2942] tracking-tight">
          <button type="button" onClick={onNavigateBack} aria-label="Volver" className="inline-flex items-center justify-center w-11 h-11 -ml-2 mr-1 align-middle rounded-full hover:bg-slate-100"><ArrowLeft className="w-5 h-5" /></button>
          Agenda Completa
        </h1>
        <p className="text-[12px] font-normal text-[#64748B] mt-0.5">
          {filteredActivities.length === activities.length
            ? `${activities.length} actividades oficiales del FSY Distrito Granada 2026`
            : `${filteredActivities.length} de ${activities.length} actividades oficiales`}
        </p>

        {/* Search Bar Input */}
        <div className="mt-3 relative flex items-center">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar actividad, lugar o instrucción..."
            className="w-full pl-9 pr-9 py-2 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] text-[14px] text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#0284C7] focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-1 rounded-full text-[#64748B] hover:text-[#0F172A]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Chips Horizontal Carousel */}
        <div className="mt-2.5 -mx-4 px-4 overflow-x-auto no-scrollbar flex items-center space-x-2 py-1">
          {FILTER_OPTIONS.map((filter) => {
            const isSelected = selectedFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-3.5 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#0F2942] text-white font-bold border-[#0F2942] shadow-xs'
                    : 'bg-[#F1F5F9] text-[#1E293B] font-medium border-[#E2E8F0] hover:bg-slate-200'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-4 py-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#0284C7] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredActivities.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-3">
              <Filter className="w-8 h-8 text-[#64748B]" />
            </div>
            <h3 className="text-[17px] font-bold text-[#0F2942]">
              No se encontraron actividades
            </h3>
            <p className="text-[13px] text-[#64748B] max-w-xs mt-1">
              Intenta con otro término de búsqueda o cambia el filtro seleccionado.
            </p>
            <button
              type="button"
              onClick={() => {
                onViewChange({ searchQuery: '', selectedFilter: 'ALL' });
              }}
              className="mt-4 px-4 py-2 bg-[#0284C7] text-white text-[13px] font-bold rounded-full hover:bg-[#0369A1] transition-colors"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          /* Activity Items List */
          <div className="space-y-0.5">
            {filteredActivities.map((activity, index) => (
              <div
                key={activity.id}
                ref={(el) => {
                  itemRefs.current[activity.id] = el;
                }}
              >
                <TimelineItem
                  activity={activity}
                  currentMinutes={currentMinutes}
                  isFirst={index === 0}
                  isLast={index === filteredActivities.length - 1}
                  onClick={() => onNavigateToDetail(activity.id)}
                />
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Floating Action Button (FAB Quick Jump to Current Activity) */}
      {currentActivity && (
        <button
          type="button"
          onClick={scrollToCurrent}
          className="fixed bottom-[calc(var(--fsy-nav-space)+0.5rem)] right-4 md:right-[calc(50%-13rem+1rem)] z-30 bg-[#D1FAE5] text-[#059669] hover:bg-[#A7F3D0] active:scale-95 transition-all shadow-md px-3.5 py-2.5 rounded-full flex items-center space-x-1.5 font-bold text-[13px] border border-[#A7F3D0]"
        >
          <LocateFixed className="w-4 h-4 text-[#059669]" />
          <span>Actual</span>
        </button>
      )}
    </div>
  );
};
