import { describe, expect, it } from 'vitest';
import { frenchTypography } from '../src/lib/typo.ts';
import { t } from '../src/lib/i18n.ts';

const NB = ' ';

describe('frenchTypography', () => {
  it('pose une espace insécable avant le deux-points', () => {
    expect(frenchTypography('Vérifié le : 24 septembre')).toBe(`Vérifié le${NB}: 24 septembre`);
  });
  it('retire l’espace avant ; ! ?', () => {
    expect(frenchTypography('Vraiment ? Oui ! Et ; puis')).toBe('Vraiment? Oui! Et; puis');
  });
  it('protège l’intérieur des guillemets', () => {
    expect(frenchTypography('« Vérifié le »')).toBe(`«${NB}Vérifié le${NB}»`);
  });
  it('protège « 5 % » et « 84 146 $ CA »', () => {
    expect(frenchTypography('5 % et 84 146 $ CA')).toBe(`5${NB}% et 84${NB}146${NB}$${NB}CA`);
  });
  it('joint les milliers, sans toucher aux groupes qui ne sont pas des milliers', () => {
    expect(frenchTypography('1 250 000 personnes')).toBe(`1${NB}250${NB}000 personnes`);
    expect(frenchTypography('les articles 12 et 1234 5678')).toBe('les articles 12 et 1234 5678');
  });
  it('laisse intactes les adresses et les heures', () => {
    expect(frenchTypography('https://exemple.ca à 08:00')).toBe('https://exemple.ca à 08:00');
  });
});

describe('t()', () => {
  it('lit config/i18n/fr.json et remplace les variables', () => {
    expect(t('footer.copyright', { year: 2026, holder: 'X' })).toBe('© 2026 X');
  });
  it('choisit la forme du pluriel', () => {
    expect(t('dates.daysAgo', { count: 1 })).toBe('Il y a 1 jour');
    expect(t('dates.daysAgo', { count: 4 })).toBe('Il y a 4 jours');
  });
  it('applique la typographie française', () => {
    expect(t('footer.dataHosting', { place: 'Canada' })).toBe(`Données hébergées${NB}: Canada`);
  });
});
