import agenda from '../data/agenda.json';

export const EVENT_TIME_ZONE = 'America/Managua';
export const EVENT_DATE: string | null = agenda.eventDate;
const eventDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: EVENT_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
});

export const TimeUtils = {
  getEventDateTime(date: Date = new Date()): { date: string; minutes: number } {
    const parts = eventDateFormatter.formatToParts(date);
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)!.value;
    return {
      date: `${part('year')}-${part('month')}-${part('day')}`,
      minutes: Number(part('hour')) * 60 + Number(part('minute'))
    };
  },

  // Nicaragua uses UTC-6. Never parse a bare date/time in the device's zone.
  fromEventDateTime(date: string, minutes: number): Date {
    return new Date(`${date}T${this.minutesToTimeString(minutes)}:00-06:00`);
  },

  getAgendaMinutes(date: Date): number {
    // The agenda repeats as the FSY day on any calendar date. EVENT_DATE is
    // informational only and must never offset activity states or countdowns.
    return this.getCurrentMinutes(date);
  },

  getTodayFormattedDate(date: Date = new Date()): string {
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const days = [
      'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
    ];

    const eventDay = new Date(`${this.getEventDateTime(date).date}T00:00:00Z`);
    const dayOfWeek = days[eventDay.getUTCDay()];
    const dayOfMonth = eventDay.getUTCDate();
    const month = months[eventDay.getUTCMonth()];

    return `${dayOfWeek} ${dayOfMonth} de ${month}`;
  },

  getCurrentMinutes(date: Date = new Date()): number {
    return this.getEventDateTime(date).minutes;
  },

  parseTimeToMinutes(timeStr: string | null | undefined): number {
    if (!timeStr || !timeStr.trim()) return 0;
    try {
      const parts = timeStr.trim().split(':');
      const hour = parseInt(parts[0], 10) || 0;
      const minute = parts.length > 1 ? parseInt(parts[1], 10) || 0 : 0;
      return hour * 60 + minute;
    } catch {
      return 0;
    }
  },

  minutesToTimeString(minutes: number): string {
    const normalized = Math.max(0, Math.min(1439, Math.floor(minutes)));
    const hour = Math.floor(normalized / 60);
    const minute = normalized % 60;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  },

  minutesToAmPmString(minutes: number): string {
    const normalized = Math.max(0, Math.min(1439, Math.floor(minutes)));
    const hour24 = Math.floor(normalized / 60);
    const minute = normalized % 60;
    const amPm = hour24 < 12 ? 'a. m.' : 'p. m.';
    let hour12: number;
    if (hour24 === 0) {
      hour12 = 12;
    } else if (hour24 > 12) {
      hour12 = hour24 - 12;
    } else {
      hour12 = hour24;
    }
    const minuteStr = minute.toString().padStart(2, '0');
    return `${hour12}:${minuteStr} ${amPm}`;
  },

  formatTimeRangeAmPm(startTimeStr: string, endTimeStr: string | null | undefined): string {
    const startMin = this.parseTimeToMinutes(startTimeStr);
    if (endTimeStr != null && endTimeStr.trim().length > 0) {
      const endMin = this.parseTimeToMinutes(endTimeStr);
      return `${this.minutesToAmPmString(startMin)} – ${this.minutesToAmPmString(endMin)}`;
    } else {
      return `${this.minutesToAmPmString(startMin)} (inicio)`;
    }
  },

  formatRemainingText(minutesRemaining: number | null | undefined): string {
    if (minutesRemaining === null || minutesRemaining === undefined) return 'En curso';
    if (minutesRemaining <= 0) return 'Finalizando ahora';
    if (minutesRemaining === 1) return 'Queda 1 min';
    if (minutesRemaining < 60) return `Quedan ${minutesRemaining} min`;

    const hours = Math.floor(minutesRemaining / 60);
    const mins = minutesRemaining % 60;
    if (mins === 0) {
      return hours === 1 ? 'Queda 1 hora' : `Quedan ${hours} horas`;
    } else {
      return `Quedan ${hours}h ${mins}m`;
    }
  },

  formatUntilStartText(minutesUntil: number): string {
    if (minutesUntil <= 0) return 'Comienza en instantes';
    if (minutesUntil === 1) return 'Comienza en 1 min';
    if (minutesUntil < 60) return `Comienza en ${minutesUntil} min`;

    const hours = Math.floor(minutesUntil / 60);
    const mins = minutesUntil % 60;
    if (mins === 0) {
      return `Comienza en ${hours} h`;
    } else {
      return `Comienza en ${hours}h ${mins}m`;
    }
  }
};

