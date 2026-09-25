// Dates calendaires (« 2026-09-24 ») et instants dans le fuseau du site.
// Une date de contenu n'a pas de fuseau : on ne la convertit jamais en UTC pour l'afficher.

export type CalendarDate = string;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const HOUR_MINUTE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isCalendarDate(value: string): boolean {
  const m = ISO_DATE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

// Le YAML lit « 2026-09-24 » comme un objet Date à minuit UTC : on reprend ses composants UTC.
export function toCalendarDate(value: unknown): unknown {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  return value;
}

export function splitCalendarDate(date: CalendarDate): { year: number; month: number; day: number } {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return { year, month, day };
}

// Décalage (en minutes) du fuseau `timeZone` par rapport à UTC à l'instant `instant`.
function zoneOffsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((asUtc - instant.getTime()) / 60000);
}

// Instant correspondant à une date et une heure locales du fuseau (changement d'heure compris).
export function zonedInstant(date: CalendarDate, time: string, timeZone: string): Date {
  const { year, month, day } = splitCalendarDate(date);
  const m = HOUR_MINUTE.exec(time);
  const hour = m ? Number(m[1]) : 0;
  const minute = m ? Number(m[2]) : 0;
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute);
  let instant = new Date(naiveUtc - zoneOffsetMinutes(new Date(naiveUtc), timeZone) * 60000);
  // Seconde passe : le décalage peut changer entre l'estimation et l'instant réel.
  instant = new Date(naiveUtc - zoneOffsetMinutes(instant, timeZone) * 60000);
  return instant;
}

// Date calendaire du jour dans le fuseau du site.
export function calendarDateInZone(instant: Date, timeZone: string): CalendarDate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

// Heure locale « HH:MM » d'un instant dans le fuseau du site.
export function timeInZone(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('hour')}:${get('minute')}`;
}

export function addMonths(date: CalendarDate, months: number): CalendarDate {
  const { year, month, day } = splitCalendarDate(date);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  const { year, month, day } = splitCalendarDate(date);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

// Nombre de jours entre deux dates calendaires (b − a).
export function daysBetween(a: CalendarDate, b: CalendarDate): number {
  const pa = splitCalendarDate(a);
  const pb = splitCalendarDate(b);
  return Math.round((Date.UTC(pb.year, pb.month - 1, pb.day) - Date.UTC(pa.year, pa.month - 1, pa.day)) / 86400000);
}

// Heures proposées dans l'éditeur : toutes les demi-heures, de 00:00 à 23:30.
export const HALF_HOURS: readonly string[] = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  return `${h}:${i % 2 === 0 ? '00' : '30'}`;
});
