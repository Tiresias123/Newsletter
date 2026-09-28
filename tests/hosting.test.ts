// Branchement du domaine signalé une fois le site en ligne (src/lib/check/hosting.ts).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_URL } from '../src/lib/check/context.ts';
import { checkHosting, parseJsonc } from '../src/lib/check/hosting.ts';
import { getConfig, type SiteConfig } from '../src/lib/config/index.ts';

function problems(url: string, wrangler: string) {
  const base = getConfig();
  const config: SiteConfig = { ...base, site: { ...base.site, url } };
  const found: string[] = [];
  checkHosting({ config, root: '.', add: (file, where, _message, rule, severity) => found.push(`${file} ${JSON.stringify(where)} ${rule} ${severity}`) }, () => wrangler);
  return found;
}

const DOMAIN = `{
  // Domaine du site.
  "routes": [{ "pattern": "www.site.test", "custom_domain": true }],
  "workers_dev": false,
}`;

describe('branchement du domaine', () => {
  it('lit le JSON avec commentaires et virgules finales, sans toucher aux chaînes', () => {
    expect(parseJsonc('{ /* bloc */ "a": "http://x.test/*y*/", // fin\n "b": [1, 2,], }')).toEqual({ a: 'http://x.test/*y*/', b: [1, 2] });
    expect(parseJsonc('{ "a": "guillemet \\" et , }" }')).toEqual({ a: 'guillemet " et , }' });
  });

  it('lit le wrangler.jsonc du dépôt', () => {
    expect(parseJsonc(readFileSync('wrangler.jsonc', 'utf8'))).toMatchObject({ name: expect.any(String), previews: expect.any(Object) });
  });

  it("se tait tant que l'adresse du site est celle d'exemple", () => {
    expect(problems(PLACEHOLDER_URL, '{}')).toEqual([]);
  });

  it('signale un domaine non rattaché et une adresse workers.dev ouverte', () => {
    expect(problems('https://www.site.test', '{ "preview_urls": true }')).toEqual([
      'wrangler.jsonc ["routes"] lancement avertissement',
      'wrangler.jsonc ["workers_dev"] lancement avertissement',
    ]);
    expect(problems('https://site.test', DOMAIN)).toEqual(['wrangler.jsonc ["routes"] lancement avertissement']);
    expect(problems('https://www.site.test', DOMAIN.replace('"custom_domain": true', '"custom_domain": false'))).toEqual(['wrangler.jsonc ["routes"] lancement avertissement']);
  });

  it('se tait quand le domaine est branché', () => {
    expect(problems('https://www.site.test', DOMAIN)).toEqual([]);
  });

  it('bloque un fichier illisible, qui ferait échouer le déploiement', () => {
    expect(problems(PLACEHOLDER_URL, '{ "routes": [ }')).toEqual(['wrangler.jsonc [] lancement bloquant']);
  });
});
