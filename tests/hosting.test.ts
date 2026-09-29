// Branchement du domaine signalé une fois le site en ligne (src/lib/check/hosting.ts).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_URL } from '../src/lib/check/context.ts';
import { checkHosting, parseJsonc } from '../src/lib/check/hosting.ts';
import { getConfig, type SiteConfig } from '../src/lib/config/index.ts';

function problems(url: string, wrangler: string | Error) {
  const base = getConfig();
  const config: SiteConfig = { ...base, site: { ...base.site, url } };
  const found: string[] = [];
  const read = () => {
    if (wrangler instanceof Error) throw wrangler;
    return wrangler;
  };
  checkHosting({ config, root: '.', add: (file, where, _message, rule, severity) => found.push(`${file} ${JSON.stringify(where)} ${rule} ${severity}`) }, read);
  return found;
}

const DOMAIN = `{
  // Domaine du site.
  "routes": [{ "pattern": "www.site.test", "custom_domain": true }],
  "workers_dev": false,
}`;
const ROUTES = 'wrangler.jsonc ["routes"] lancement avertissement';
const WORKERS_DEV = 'wrangler.jsonc ["workers_dev"] lancement avertissement';

describe('branchement du domaine', () => {
  it('lit le JSON avec commentaires et virgules finales, sans toucher aux chaînes', () => {
    expect(parseJsonc('{ /* bloc */ "a": "http://x.test/*y*/", // fin\n "b": [1, 2,], }')).toEqual({ a: 'http://x.test/*y*/', b: [1, 2] });
    expect(parseJsonc('{ "a": "guillemet \\" et , }" }')).toEqual({ a: 'guillemet " et , }' });
    // Marque d'ordre des octets d'un fichier enregistré « UTF-8 avec BOM » : Wrangler l'ignore.
    expect(parseJsonc('\uFEFF{ "a": 1 }')).toEqual({ a: 1 });
  });

  it('lit le wrangler.jsonc du dépôt', () => {
    expect(parseJsonc(readFileSync('wrangler.jsonc', 'utf8'))).toMatchObject({ name: expect.any(String), previews: expect.any(Object) });
  });

  it("se tait tant que l'adresse du site est celle d'exemple, ou sans wrangler.jsonc", () => {
    expect(problems(PLACEHOLDER_URL, '{}')).toEqual([]);
    expect(problems('https://www.site.test', Object.assign(new Error('absent'), { code: 'ENOENT' }))).toEqual([]);
  });

  it('signale un domaine non rattaché et une adresse workers.dev ouverte', () => {
    expect(problems('https://www.site.test', '{ "preview_urls": true }')).toEqual([ROUTES, WORKERS_DEV]);
    expect(problems('https://site.test', DOMAIN)).toEqual([ROUTES]);
    expect(problems('https://www.site.test', DOMAIN.replace('"workers_dev": false', '"workers_dev": true'))).toEqual([WORKERS_DEV]);
  });

  it('se tait quand le domaine est branché, sous toutes les formes que Wrangler admet', () => {
    expect(problems('https://www.site.test', DOMAIN)).toEqual([]);
    // Route seule, motif en majuscules ou terminé par un point, route de zone.
    expect(problems('https://www.site.test', '{ "route": { "pattern": "WWW.Site.test.", "custom_domain": true }, "workers_dev": false }')).toEqual([]);
    expect(problems('https://www.site.test', '{ "routes": ["www.site.test/*"], "workers_dev": false }')).toEqual([]);
    // Sans "workers_dev", Wrangler ferme l'adresse workers.dev dès qu'une route existe.
    expect(problems('https://www.site.test', '{ "routes": [{ "pattern": "www.site.test", "custom_domain": true }] }')).toEqual([]);
  });

  it('bloque un fichier illisible, qui ferait échouer le déploiement', () => {
    expect(problems(PLACEHOLDER_URL, '{ "routes": [ }')).toEqual(['wrangler.jsonc [] lancement bloquant']);
    expect(problems(PLACEHOLDER_URL, '[]')).toEqual(['wrangler.jsonc [] lancement bloquant']);
  });
});
