// Mesure d'audience : adresses transmises à Umami, sans termes de recherche ni autres paramètres.
import { describe, expect, it } from 'vitest';
import { campaignOnly } from '../src/lib/analytics/umami.ts';

describe('adresses transmises à la mesure d’audience', () => {
  it('ne garde que les paramètres de campagne', () => {
    expect(campaignOnly('/recherche/?q=impot&utm_source=infolettre&utm_medium=courriel', 'https://site.test')).toBe('/recherche/?utm_source=infolettre&utm_medium=courriel');
    expect(campaignOnly('https://site.test/articles/un-article/?q=nom', 'https://site.test')).toBe('https://site.test/articles/un-article/');
    expect(campaignOnly('https://www.moteur.test/search?q=secret', 'https://site.test')).toBe('https://www.moteur.test/search');
    expect(campaignOnly('/articles/', 'https://site.test')).toBe('/articles/');
  });
});
