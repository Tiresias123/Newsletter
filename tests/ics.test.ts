import { describe, expect, it } from 'vitest';
import { escapeText, foldLine, icsCalendar } from '../src/lib/ics.ts';

const options = { name: 'Site : agenda', timezone: 'America/Toronto', now: new Date('2026-09-25T16:00:00Z'), productId: '-//Site//Agenda//FR' };
const lines = (ics: string) => ics.replace(/\r\n /g, '').split('\r\n');

describe('export iCalendar', () => {
  it('échappe les valeurs texte', () => {
    expect(escapeText('Loi; art. 1, al. 2\\3\nsuite')).toBe('Loi\; art. 1\\, al. 2\\\\3\\nsuite');
  });

  it('replie les lignes à 75 octets sans couper un caractère accentué', () => {
    const folded = foldLine(`SUMMARY:${'é'.repeat(60)}`);
    const parts = folded.split('\r\n ');
    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    expect(parts.join('')).toBe(`SUMMARY:${'é'.repeat(60)}`);
  });

  it('produit une journée entière, du premier au dernier jour inclus', () => {
    const ics = icsCalendar([{ uid: 'consultation@exemple.ca', title: 'Consultation', date: '2026-10-01', endDate: '2026-10-31', category: 'Consultation' }], options);
    const all = lines(ics);
    expect(all[0]).toBe('BEGIN:VCALENDAR');
    expect(all).toContain('DTSTART;VALUE=DATE:20261001');
    expect(all).toContain('DTEND;VALUE=DATE:20261101');
    expect(all).toContain('DTSTAMP:20260925T160000Z');
    expect(all).toContain('X-WR-CALNAME:Site : agenda');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('convertit une échéance à heure fixe en UTC, changement d’heure compris', () => {
    const ics = icsCalendar(
      [
        { uid: 'a@exemple.ca', title: 'Audience', date: '2026-10-15', time: '09:00', url: 'https://example.org/a' },
        { uid: 'b@exemple.ca', title: 'Audience', date: '2026-12-15', time: '09:00' },
      ],
      options,
    );
    const all = lines(ics);
    expect(all).toContain('DTSTART:20261015T130000Z');
    expect(all).toContain('DTSTART:20261215T140000Z');
    expect(all).toContain('URL:https://example.org/a');
    expect(all.filter((l) => l.startsWith('DTEND'))).toEqual([]);
  });
});
