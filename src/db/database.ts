import Dexie, { type Table } from 'dexie';
import type { FsyActivity } from '../models/types';

export class FsyAgendaDB extends Dexie {
  activities!: Table<FsyActivity, number>;

  constructor() {
    super('fsy_agenda_db');
    this.version(2).stores({
      activities: 'id, sortOrder, category, startMinutes, endMinutes'
    });
  }
}

export const db = new FsyAgendaDB();
