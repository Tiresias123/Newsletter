// Export iCalendar (RFC 5545) de l'agenda : un fichier pour tout l'agenda (/agenda.ics), un par échéance.
// Une échéance avec une heure et sans date de fin devient un événement ponctuel en heure UTC ; toutes les
// autres sont des journées entières, du premier au dernier jour inclus.
import { addDays, zonedInstant } from './dates.ts';

export type IcsEvent = {
  uid: string;
  title: string;
  date: string;
  endDate?: string;
  time?: string;
  description?: string;
  url?: string;
  category?: string;
};

export type IcsOptions = { name: string; timezone: string; now: Date; productId: string };

// Échappement des valeurs texte (RFC 5545, 3.3.11).
export function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

// Repli des lignes de plus de 75 octets, sans couper un caractère UTF-8 (RFC 5545, 3.1).
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = '';
  let size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (size + bytes > limit) {
      parts.push(current);
      current = '';
      size = 0;
    }
    current += char;
    size += bytes;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

const utcStamp = (instant: Date) => instant.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const dateValue = (date: string) => date.replace(/-/g, '');

function eventLines(event: IcsEvent, options: IcsOptions): string[] {
  const timed = Boolean(event.time) && !event.endDate;
  const lines = ['BEGIN:VEVENT', `UID:${event.uid}`, `DTSTAMP:${utcStamp(options.now)}`];
  if (timed) {
    lines.push(`DTSTART:${utcStamp(zonedInstant(event.date, event.time ?? '00:00', options.timezone))}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${dateValue(event.date)}`, `DTEND;VALUE=DATE:${dateValue(addDays(event.endDate ?? event.date, 1))}`);
  }
  lines.push(`SUMMARY:${escapeText(event.title)}`);
  const description = [event.description, event.url].filter(Boolean).join('\n\n');
  if (description) lines.push(`DESCRIPTION:${escapeText(description)}`);
  if (event.url) lines.push(`URL:${event.url}`);
  if (event.category) lines.push(`CATEGORIES:${escapeText(event.category)}`);
  lines.push('TRANSP:TRANSPARENT', 'END:VEVENT');
  return lines;
}

export function icsCalendar(events: readonly IcsEvent[], options: IcsOptions): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${options.productId}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(options.name)}`,
    `X-WR-TIMEZONE:${options.timezone}`,
    ...events.flatMap((event) => eventLines(event, options)),
    'END:VCALENDAR',
  ];
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}
