export const TimeUtils = {
  getTodayFormattedDate(date: Date = new Date()): string {
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const days = [
      'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
    ];

    const dayOfWeek = days[date.getDay()];
    const dayOfMonth = date.getDate();
    const month = months[date.getMonth()];

    return `Hoy • ${dayOfWeek}, ${dayOfMonth} de ${month}`;
  },

  getCurrentMinutes(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
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

