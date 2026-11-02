import { db } from './database';
import type { FsyActivity } from '../models/types';
import { TimeUtils } from '../utils/timeUtils';
import officialAgendaData from '../data/agenda.json';

export async function ensureDataPopulated(forceReload = false): Promise<void> {
  const count = await db.activities.count();
  
  const revision = JSON.stringify(officialAgendaData);
  let savedRevision: string | null = null;
  try { savedRevision = localStorage.getItem('fsy_agenda_revision'); } catch { /* storage restricted */ }
  if (count === officialAgendaData.activities.length && savedRevision === revision && !forceReload) {
    return;
  }

  const rawActivities = (officialAgendaData as any).activities || [];
  
  const activitiesToInsert: FsyActivity[] = rawActivities.map((item: any) => {
    const startMinutes = TimeUtils.parseTimeToMinutes(item.startTime);
    const endMinutes = item.endTime ? TimeUtils.parseTimeToMinutes(item.endTime) : null;

    return {
      id: Number(item.id),
      title: item.title || '',
      description: item.description || '',
      startTime: item.startTime || '',
      endTime: item.endTime || null,
      startMinutes,
      endMinutes,
      location: item.location || '',
      responsible: item.responsible || '',
      counselorInstructions: item.counselorInstructions || '',
      manualReference: item.manualReference || null,
      category: item.category || 'Actividad',
      iconName: item.iconName || item.category || '',
      sortOrder: Number(item.sortOrder || item.id),
      segments: Array.isArray(item.segments) ? item.segments : []
    };
  });

  await db.transaction('rw', db.activities, async () => {
    await db.activities.clear();
    await db.activities.bulkPut(activitiesToInsert);
  });
  try { localStorage.setItem('fsy_agenda_revision', revision); } catch { /* storage restricted */ }
}
