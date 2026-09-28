// Réglages des services signalés avant la mise en ligne (src/lib/check/services.ts).
import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_URL, type CheckMode } from '../src/lib/check/context.ts';
import { checkServices } from '../src/lib/check/services.ts';
import { getConfig, type SiteConfig } from '../src/lib/config/index.ts';

// Configuration de référence, indépendante des réglages réels de l'auteur : site pas encore en ligne, services à
// saisir, une liste active et une désactivée, ni formulaire de contact, ni mesure d'audience, ni cours.
function baseline(): SiteConfig {
  const config = structuredClone(getConfig());
  return {
    ...config,
    site: { ...config.site, url: PLACEHOLDER_URL, contactEmail: '' },
    services: {
      turnstile: { siteKey: '' },
      analytics: { enabled: false, provider: 'umami', scriptUrl: 'https://cloud.umami.is/script.js', collectOrigins: ['https://gateway.umami.is'], websiteId: '', domains: [] },
      contact: { enabled: false, senderEmail: '', senderName: '' },
      cookieConsent: { enabled: false },
    },
    newsletter: {
      ...config.newsletter,
      provider: 'brevo',
      doubleOptInTemplateId: undefined,
      lists: [
        { id: 'generale', label: 'Générale', enabled: true },
        { id: 'pause', label: 'En pause', enabled: false },
      ],
    },
    ticker: { ...config.ticker, enabled: false },
    homepage: { ...config.homepage, sections: [] },
  };
}

function problems(edit: (config: SiteConfig) => void, hasMarketKey = false, mode: CheckMode = 'production') {
  const config = baseline();
  edit(config);
  const found: string[] = [];
  checkServices({ config, mode, add: (file, where, _message, rule, severity) => found.push(`${file} ${JSON.stringify(where)} ${rule} ${severity}`) }, hasMarketKey);
  return found;
}

const ready = (c: SiteConfig) => {
  c.services.turnstile.siteKey = '0x4AAAAAAA';
  c.newsletter.doubleOptInTemplateId = 7;
  c.newsletter.lists = c.newsletter.lists.map((l) => ({ ...l, providerId: 3 }));
};
const online = (c: SiteConfig) => {
  c.site.url = 'https://www.site.test';
};

describe('services à compléter avant la mise en ligne', () => {
  it('signale la clé Turnstile, le modèle et les listes Brevo manquants', () => {
    expect(problems(() => undefined)).toEqual([
      'config/services.json ["turnstile","siteKey"] lancement avertissement',
      'config/newsletter.json ["doubleOptInTemplateId"] lancement avertissement',
      'config/newsletter.json ["lists",0,"providerId"] lancement avertissement',
    ]);
  });

  it('se tait quand tout est réglé', () => {
    expect(problems(ready)).toEqual([]);
    expect(
      problems((c) => {
        ready(c);
        c.services.contact = { enabled: true, senderEmail: '', senderName: '' };
        c.services.analytics = { ...c.services.analytics, enabled: true, websiteId: 'abc', domains: [] };
        c.ticker.enabled = true;
      }),
    ).toEqual([
      'config/services.json ["contact","senderEmail"] lancement avertissement',
      'config/site.json ["contactEmail"] lancement information',
      'config/services.json ["analytics","domains"] lancement information',
      'config/ticker.json ["enabled"] lancement information',
    ]);
  });

  it('bloque les réglages d’essai sur le site en ligne, et les tolère avant la mise en ligne ou en aperçu', () => {
    const trial = (c: SiteConfig) => {
      ready(c);
      c.services.turnstile.siteKey = '1x00000000000000000000AA';
      c.newsletter.provider = 'test';
    };
    const expected = (severity: string) => [`config/services.json ["turnstile","siteKey"] lancement ${severity}`, `config/newsletter.json ["provider"] lancement ${severity}`];
    expect(problems(trial)).toEqual(expected('avertissement'));
    const trialOnline = (c: SiteConfig) => {
      trial(c);
      online(c);
    };
    expect(problems(trialOnline)).toEqual(expected('bloquant'));
    expect(problems(trialOnline, false, 'apercu')).toEqual(expected('avertissement'));
  });

  it('bloque aussi, une fois en ligne, les réglages manquants qui font refuser les envois', () => {
    expect(problems(online)).toEqual([
      'config/services.json ["turnstile","siteKey"] lancement bloquant',
      'config/newsletter.json ["doubleOptInTemplateId"] lancement bloquant',
      'config/newsletter.json ["lists",0,"providerId"] lancement bloquant',
    ]);
    expect(
      problems((c) => {
        ready(c);
        online(c);
        c.newsletter.lists = c.newsletter.lists.map((l) => ({ ...l, enabled: false }));
        c.services.contact = { enabled: true, senderEmail: '', senderName: '' };
        c.site.contactEmail = 'contact@site.test';
      }),
    ).toEqual(['config/newsletter.json ["lists"] lancement bloquant', 'config/services.json ["contact","senderEmail"] lancement bloquant']);
  });

  it('signale un domaine mesuré qui n’est pas celui du site', () => {
    const measured = (domains: string[]) => (c: SiteConfig) => {
      ready(c);
      online(c);
      c.services.analytics = { ...c.services.analytics, enabled: true, websiteId: 'abc', domains };
    };
    expect(problems(measured(['site.test']))).toEqual(['config/services.json ["analytics","domains"] lancement avertissement']);
    expect(problems(measured(['www.site.test']))).toEqual([]);
  });
});
