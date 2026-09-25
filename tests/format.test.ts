import { describe, expect, it } from 'vitest';
import { formatChipDate, formatDate, formatDateTime, formatMoney, formatNumber, formatPercent, formatRelative, formatTime } from '../src/lib/format.ts';
import { relativeDateMessages } from '../src/lib/i18n.ts';

const NB = ' ';

describe('formatDate', () => {
  it('écrit la date en toutes lettres', () => {
    expect(formatDate('2026-09-24')).toBe(`24${NB}septembre 2026`);
  });
  it('écrit « 1er » le premier jour du mois', () => {
    expect(formatDate('2027-01-01')).toBe(`1er${NB}janvier 2027`);
  });
  it('abrège le mois en style court', () => {
    expect(formatDate('2026-09-30', 'court')).toBe(`30${NB}sept.`);
  });
  it('omet l’année en style jour-mois', () => {
    expect(formatDate('2026-10-15', 'jour-mois')).toBe(`15${NB}octobre`);
  });
});

describe('formatChipDate', () => {
  it('omet l’année courante et affiche les autres', () => {
    expect(formatChipDate('2026-10-15', '2026-09-25')).toBe(`15${NB}oct.`);
    expect(formatChipDate('2027-01-15', '2026-09-25')).toBe(`15${NB}janv. 2027`);
  });
});

describe('formatTime', () => {
  it('écrit « 17 h 17 » et « 15 h »', () => {
    expect(formatTime('17:17')).toBe(`17${NB}h${NB}17`);
    expect(formatTime('15:00')).toBe(`15${NB}h`);
    expect(formatTime('00:30')).toBe(`0${NB}h${NB}30`);
  });
});

describe('formatDateTime', () => {
  it('convertit un instant dans le fuseau de Montréal', () => {
    // 19 h UTC = 15 h à Montréal (heure d’été, UTC−4).
    expect(formatDateTime(new Date('2026-09-24T19:00:00Z'), '{date} à {time}')).toBe(`24${NB}septembre 2026 à 15${NB}h`);
    // 20 h 17 UTC en hiver = 15 h 17 à Montréal (UTC−5).
    expect(formatDateTime(new Date('2026-01-15T20:17:00Z'), '{date} à {time}')).toBe(`15${NB}janvier 2026 à 15${NB}h${NB}17`);
  });
});

describe('nombres, montants, pourcentages', () => {
  it('sépare les milliers par une espace insécable', () => {
    expect(formatNumber(84146)).toBe(`84${NB}146`);
    expect(formatNumber(1234567.891, 2)).toBe(`1${NB}234${NB}567,89`);
  });
  it('écrit « 84 146 $ CA »', () => {
    expect(formatMoney(84146)).toBe(`84${NB}146${NB}$${NB}CA`);
    expect(formatMoney(10000, { currency: '$' })).toBe(`10${NB}000${NB}$`);
    expect(formatMoney(1250.5)).toBe(`1${NB}250,50${NB}$${NB}CA`);
  });
  it('écrit « 5 % », « +1,2 % » et « −0,4 % »', () => {
    expect(formatPercent(5)).toBe(`5${NB}%`);
    expect(formatPercent(1.2, { signed: true })).toBe(`+1,2${NB}%`);
    expect(formatPercent(-0.4, { signed: true })).toBe(`−0,4${NB}%`);
  });
});

describe('formatRelative', () => {
  const now = new Date('2026-09-25T16:00:00Z'); // 12 h à Montréal
  const at = (iso: string) => formatRelative(new Date(iso), now, relativeDateMessages);
  it('gère minutes, heures, veille et jours', () => {
    expect(at('2026-09-25T15:59:30Z')).toBe("À l'instant");
    expect(at('2026-09-25T15:59:00Z')).toBe('Il y a 1 minute');
    expect(at('2026-09-25T15:15:00Z')).toBe('Il y a 45 minutes');
    expect(at('2026-09-25T13:00:00Z')).toBe('Il y a 3 heures');
    expect(at('2026-09-24T21:17:00Z')).toBe(`Hier à 17${NB}h${NB}17`);
    expect(at('2026-09-22T12:00:00Z')).toBe('Il y a 3 jours');
  });
  it('renvoie null au-delà de sept jours ou dans le futur', () => {
    expect(at('2026-09-10T12:00:00Z')).toBeNull();
    expect(at('2026-09-26T12:00:00Z')).toBeNull();
  });
});
