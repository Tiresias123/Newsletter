// Mesure d'audience : adresses transmises à Umami, sans termes de recherche ni autres paramètres.
import { describe, expect, it } from 'vitest';
import { looksPersonal, searchData } from '../src/lib/analytics/events.ts';
import { campaignOnly } from '../src/lib/analytics/umami.ts';

describe('adresses transmises à la mesure d’audience', () => {
  it('ne garde que les paramètres de campagne', () => {
    expect(campaignOnly('/recherche/?q=impot&utm_source=infolettre&utm_medium=courriel', 'https://site.test')).toBe('/recherche/?utm_source=infolettre&utm_medium=courriel');
    expect(campaignOnly('https://site.test/articles/un-article/?q=nom', 'https://site.test')).toBe('https://site.test/articles/un-article/');
    expect(campaignOnly('https://www.moteur.test/search?q=secret', 'https://site.test')).toBe('https://www.moteur.test/search');
    expect(campaignOnly('/articles/', 'https://site.test')).toBe('/articles/');
  });
});

describe('termes de recherche transmis à la mesure d’audience', () => {
  it('écarte ce qui pourrait être un renseignement personnel', () => {
    for (const term of ['camille@exemple.ca', 'camille@exemple', '514-555-1234', '123 456 789', '0x71c7656ec7ab88b098defb751b7401b5f6d8976f', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh']) {
      expect(looksPersonal(term), term).toBe(true);
    }
    for (const term of ['impôt cryptoactifs', 't1135', 'loi c-15', 'stablecoin 2026', 'déclaration des cryptoactifs']) {
      expect(looksPersonal(term), term).toBe(false);
    }
  });

  it('juge la saisie entière, pas seulement ses 50 premiers caractères transmis', () => {
    const long = 'déclaration de gains en cryptoactifs de jean-francois tremblay@exemple.ca';
    expect(searchData(long, 3)).toEqual({ results: 3 });
    expect(searchData('Impôt CRYPTOACTIFS', 4)).toEqual({ query: 'impôt cryptoactifs', results: 4 });
    // Saisie longue sans renseignement personnel : coupée à 50 caractères.
    const words = 'fiscalite des cryptoactifs au quebec et au canada pour les particuliers';
    expect(searchData(words, 1)).toEqual({ query: words.slice(0, 50), results: 1 });
  });
});

