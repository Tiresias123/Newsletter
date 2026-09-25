import { describe, expect, it } from 'vitest';
import { addMonths, calendarDateInZone, daysBetween, isCalendarDate, toCalendarDate, zonedInstant } from '../src/lib/dates.ts';

describe('dates calendaires', () => {
  it('reconnaît les dates valides', () => {
    expect(isCalendarDate('2026-02-28')).toBe(true);
    expect(isCalendarDate('2026-02-30')).toBe(false);
    expect(isCalendarDate('24/09/2026')).toBe(false);
  });
  it('ramène une date YAML à sa forme AAAA-MM-JJ sans décalage de fuseau', () => {
    expect(toCalendarDate(new Date('2026-09-24T00:00:00Z'))).toBe('2026-09-24');
  });
  it('ajoute des mois en restant dans le mois cible', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-09-24', 6)).toBe('2027-03-24');
  });
  it('compte les jours entre deux dates', () => {
    expect(daysBetween('2026-09-24', '2026-10-01')).toBe(7);
  });
});

describe('fuseau America/Toronto', () => {
  const TZ = 'America/Toronto';
  it('convertit 8 h à Montréal en UTC, heure d’été et heure normale', () => {
    expect(zonedInstant('2026-07-01', '08:00', TZ).toISOString()).toBe('2026-07-01T12:00:00.000Z');
    expect(zonedInstant('2026-12-01', '08:00', TZ).toISOString()).toBe('2026-12-01T13:00:00.000Z');
  });
  it('gère le jour du changement d’heure (1er novembre 2026)', () => {
    expect(zonedInstant('2026-11-01', '08:00', TZ).toISOString()).toBe('2026-11-01T13:00:00.000Z');
    expect(zonedInstant('2026-03-08', '08:00', TZ).toISOString()).toBe('2026-03-08T12:00:00.000Z');
  });
  it('donne la date locale d’un instant', () => {
    expect(calendarDateInZone(new Date('2026-09-25T03:00:00Z'), TZ)).toBe('2026-09-24');
  });
});
