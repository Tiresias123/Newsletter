// Réglages des services signalés avant la mise en ligne (src/lib/check/services.ts).
import { describe, expect, it } from 'vitest';
import type { CheckMode } from '../src/lib/check/context.ts';
import { checkServices } from '../src/lib/check/services.ts';
import { getConfig, type SiteConfig } from '../src/lib/config/index.ts';

function problems(edit: (config: SiteConfig) => void, hasMarketKey = false, mode: CheckMode = 'production') {
  const config = structuredClone(getConfig());
  edit(config);
  const found: string[] = [];
  checkServices({ config, mode, add: (file, where, _message, rule, severity) => found.push(`${file} ${JSON.stringify(where)} ${rule} ${severity}`) }, hasMarketKey);
  return found;
}

describe('services à compléter avant la mise en ligne', () => {
  it('signale la clé Turnstile, le modèle et les listes Brevo manquants', () => {
    expect(problems(() => undefined)).toEqual([
      'config/services.json ["turnstile","siteKey"] lancement avertissement',
      'config/newsletter.json ["doubleOptInTemplateId"] lancement avertissement',
      'config/newsletter.json ["lists",0,"providerId"] lancement avertissement',
    ]);
  });

  it('se tait quand tout est réglé', () => {
    const ready = (c: SiteConfig) => {
      c.services.turnstile.siteKey = '0x4AAAAAAA';
      c.newsletter.doubleOptInTemplateId = 7;
      c.newsletter.lists = c.newsletter.lists.map((l) => ({ ...l, providerId: 3 }));
    };
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
      c.services.turnstile.siteKey = '1x00000000000000000000AA';
      c.newsletter.provider = 'test';
    };
    const expected = (severity: string) => [`config/services.json ["turnstile","siteKey"] lancement ${severity}`, `config/newsletter.json ["provider"] lancement ${severity}`];
    expect(problems(trial)).toEqual(expected('avertissement'));
    const online = (c: SiteConfig) => {
      trial(c);
      c.site.url = 'https://site.test';
    };
    expect(problems(online)).toEqual(expected('bloquant'));
    expect(problems(online, false, 'apercu')).toEqual(expected('avertissement'));
  });
});
