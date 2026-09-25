// Formatage centralisé et testé (point 8.10 du brief) : dates, heures, nombres, montants, pourcentages.
// Fonctions pures, utilisables au build comme dans le navigateur (dates relatives).
import { calendarDateInZone, daysBetween, splitCalendarDate, timeInZone, type CalendarDate } from './dates.ts';

const NBSP = ' ';
const MINUS = '−';
export const DEFAULT_LOCALE = 'fr-CA';
export const DEFAULT_TIMEZONE = 'America/Toronto';

export type DateStyle = 'long' | 'court' | 'jour-mois';

function monthName(month: number, style: 'long' | 'short', locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: style, timeZone: 'UTC' }).format(new Date(Date.UTC(2000, month - 1, 15)));
}

// « 24 septembre 2026 », « 1er janvier 2027 » ; « 30 sept. » en style court (puces de l'agenda).
export function formatDate(date: CalendarDate, style: DateStyle = 'long', locale = DEFAULT_LOCALE): string {
  const { year, month, day } = splitCalendarDate(date);
  const dayLabel = locale.startsWith('fr') && day === 1 ? '1er' : String(day);
  const month_ = monthName(month, style === 'court' ? 'short' : 'long', locale);
  if (style === 'long') return `${dayLabel}${NBSP}${month_} ${year}`;
  return `${dayLabel}${NBSP}${month_}`;
}

// Puce d'échéance : « 30 sept. », avec l'année si elle diffère de celle de référence (« 15 janv. 2027 »).
export function formatChipDate(date: CalendarDate, reference: CalendarDate, locale = DEFAULT_LOCALE): string {
  const short = formatDate(date, 'court', locale);
  const year = date.slice(0, 4);
  return year === reference.slice(0, 4) ? short : `${short} ${year}`;
}

// « 17 h 17 », « 15 h », « 0 h 30 ».
export function formatTime(time: string): string {
  const [hours = '0', minutes = '00'] = time.split(':');
  const h = String(Number(hours));
  return minutes === '00' ? `${h}${NBSP}h` : `${h}${NBSP}h${NBSP}${minutes}`;
}

export function formatDateTime(instant: Date, template: string, timeZone = DEFAULT_TIMEZONE, locale = DEFAULT_LOCALE): string {
  return template
    .replace('{date}', formatDate(calendarDateInZone(instant, timeZone), 'long', locale))
    .replace('{time}', formatTime(timeInZone(instant, timeZone)));
}

// Séparateur de milliers insécable, virgule décimale.
export function formatNumber(value: number, decimals = 0, locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    .format(value)
    .replace(/[ \s]/g, NBSP)
    .replace('-', MINUS);
}

// « 84 146 $ CA » ; décimales seulement si le montant a des cents.
export function formatMoney(amount: number, options: { currency?: string; decimals?: number } = {}, locale = DEFAULT_LOCALE): string {
  const decimals = options.decimals ?? (Number.isInteger(amount) ? 0 : 2);
  const currency = (options.currency ?? '$ CA').replace(' ', NBSP);
  return `${formatNumber(amount, decimals, locale)}${NBSP}${currency}`;
}

// « 5 % », « +1,2 % », « −0,4 % » (valeur exprimée en points de pourcentage).
export function formatPercent(value: number, options: { decimals?: number; signed?: boolean } = {}, locale = DEFAULT_LOCALE): string {
  const decimals = options.decimals ?? (Number.isInteger(value) ? 0 : 1);
  const body = formatNumber(Math.abs(value), decimals, locale);
  const sign = value < 0 ? MINUS : options.signed && value > 0 ? '+' : '';
  return `${sign}${body}${NBSP}%`;
}

export type RelativeMessages = {
  justNow: string;
  minutesAgo: { one: string; other: string };
  hoursAgo: { one: string; other: string };
  yesterdayAt: string;
  daysAgo: { one: string; other: string };
};

function plural(forms: { one: string; other: string }, count: number, locale: string): string {
  const form = new Intl.PluralRules(locale).select(count) === 'one' ? forms.one : forms.other;
  return form.replace('{count}', String(count));
}

// Date relative jusqu'à sept jours (« Il y a 3 heures », « Hier à 17 h 17 ») ; au-delà, null.
export function formatRelative(
  instant: Date,
  now: Date,
  messages: RelativeMessages,
  timeZone = DEFAULT_TIMEZONE,
  locale = DEFAULT_LOCALE,
): string | null {
  const seconds = Math.floor((now.getTime() - instant.getTime()) / 1000);
  if (seconds < 0) return null;
  if (seconds < 60) return messages.justNow;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return plural(messages.minutesAgo, minutes, locale);
  const days = daysBetween(calendarDateInZone(instant, timeZone), calendarDateInZone(now, timeZone));
  if (days === 0) return plural(messages.hoursAgo, Math.floor(minutes / 60), locale);
  if (days === 1) return messages.yesterdayAt.replace('{time}', formatTime(timeInZone(instant, timeZone)));
  if (days < 7) return plural(messages.daysAgo, days, locale);
  return null;
}
