import { afterEach, describe, expect, it } from 'vitest';
import { loadContent } from '../src/lib/check/load.ts';
import { sitemapLocs, vanishedUrls } from '../src/lib/check/vanished.ts';
import { buildGraph } from '../src/lib/content/graph.ts';
import { collectRedirects, REDIRECT_LIMIT, renderRedirects, resolveRedirects, siteUrls, type Redirect } from '../src/lib/redirects.ts';
import { articleData, createFixture, NOW, testConfig, type Fixture } from './helpers/fixture.ts';

let fixture: Fixture;
afterEach(() => fixture?.cleanup());

const rule = (from: string, to: string, source = 'config/redirects.json'): Redirect => ({ from, to, status: 301, source });

describe('redirections', () => {
  it('produit une règle par ancienne adresse d’un contenu publié, puis celles de la configuration', () => {
    fixture = createFixture();
    fixture.mdx('content/articles/nouveau.mdx', articleData({ status: 'publie', publishedAt: '2026-09-20', previousSlugs: ['ancien', 'plus-ancien'] }));
    fixture.mdx('content/articles/brouillon.mdx', articleData({ previousSlugs: ['avant'] }));
    const content = loadContent(fixture.root);
    expect(content.problems).toEqual([]);
    const base = testConfig();
    const graph = buildGraph(content.raw, { ...base, redirects: { redirects: [{ from: '/2025/01/billet', to: '/articles/nouveau/', status: 301 }] } }, { now: NOW, includeDrafts: false, timezone: 'America/Toronto' });
    const { rules, issues } = resolveRedirects(collectRedirects(graph), siteUrls(graph));
    expect(issues).toEqual([]);
    expect(renderRedirects(rules)).toBe('/articles/ancien/ /articles/nouveau/ 301\n/articles/plus-ancien/ /articles/nouveau/ 301\n/2025/01/billet /articles/nouveau/ 301\n');
  });

  it('aplatit les chaînes et signale boucles, doublons, pages masquées et destinations absentes', () => {
    const live = new Set(['/', '/c/', '/page/']);
    const chain = resolveRedirects([rule('/a/', '/b/'), rule('/b/', '/c/')], live);
    expect(chain.rules.map((r) => `${r.from} → ${r.to}`)).toEqual(['/a/ → /c/', '/b/ → /c/']);
    expect(chain.issues).toEqual([]);
    const messages = resolveRedirects([rule('/x/', '/y/'), rule('/y/', '/x/'), rule('/d/', '/c/'), rule('/d/', '/'), rule('/page/', '/c/'), rule('/e/', '/nulle-part/'), rule('/f/', 'https://example.org/')], live).issues.map((i) => `${i.severity} ${i.message}`);
    expect(messages).toEqual([
      'bloquant L\'ancienne adresse /d/ est déjà redirigée (config/redirects.json).',
      'bloquant /page/ est l\'adresse d\'une page du site : la redirection la masquerait.',
      'bloquant Boucle de redirections à partir de /x/.',
      'bloquant Boucle de redirections à partir de /y/.',
      'avertissement /e/ mène à /nulle-part/, qui n\'est pas une page du site.',
    ]);
  });

  it('refuse plus de 2 000 règles', () => {
    const many = Array.from({ length: REDIRECT_LIMIT + 1 }, (_, i) => rule(`/vieux-${i}/`, '/'));
    expect(resolveRedirects(many, new Set(['/'])).issues.at(-1)?.message).toBe(`${REDIRECT_LIMIT + 1} redirections : au-delà de la limite de ${REDIRECT_LIMIT} de Cloudflare.`);
  });
});

describe('adresses disparues', () => {
  it('lit un plan du site et repère les adresses disparues sans redirection', () => {
    const xml = '<urlset><url><loc>https://example.com/a/</loc></url><url><loc> https://example.com/b/?x=1&amp;y=2 </loc></url></urlset>';
    expect(sitemapLocs(xml)).toEqual(['https://example.com/a/', 'https://example.com/b/?x=1&y=2']);
    const online = ['https://example.com/', 'https://example.com/garde/', 'https://example.com/redirigee/', 'https://example.com/brouillon/', 'https://example.com/perdue/'];
    expect(vanishedUrls(online, new Set(['/', '/garde/']), new Set(['/redirigee/']), new Set(['/brouillon/']))).toEqual([
      { path: '/brouillon/', unpublished: true },
      { path: '/perdue/', unpublished: false },
    ]);
  });
});
