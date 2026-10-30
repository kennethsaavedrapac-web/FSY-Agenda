export interface ActivitySegment {
  title: string;
  startTime: string;
  endTime: string;
  manualReference: string | null;
  description: string;
}

export interface FsyActivity {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string | null;
  startMinutes: number;
  endMinutes: number | null;
  location: string;
  responsible: string;
  counselorInstructions: string;
  manualReference: string | null;
  category: string;
  iconName: string;
  sortOrder: number;
  segments?: ActivitySegment[];
}

export type ActivityStatus = 'FINISHED' | 'CURRENT' | 'UPCOMING';

export interface CounselorPreferences {
  counselorName: string;
  companyName: string;
  notificationsEnabled: boolean;
  advanceMinutes: number;
  simulationActive: boolean;
  simulatedMinutes: number;
}

export interface CategoryStyle {
  iconName: string;
  label: string;
  tint: string;
  background: string;
}

export type AgendaFilter = 
  | 'ALL'
  | 'CURRENT'
  | 'DEVOTIONALS'
  | 'TRANSFERS'
  | 'FOOD'
  | 'RECREATION'
  | 'CLOSING';

export interface PresetTime {
  label: string;
  minutes: number;
}

