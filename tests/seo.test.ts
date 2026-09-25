import { afterEach, describe, expect, it } from 'vitest';
import { loadContent } from '../src/lib/check/load.ts';
import { buildGraph } from '../src/lib/content/graph.ts';
import { breadcrumbJsonLd, serializeJsonLd } from '../src/lib/seo/json-ld.ts';
import { feedItems, jsonFeed } from '../src/lib/seo/feeds.ts';
import { ogImagePath } from '../src/lib/seo/meta.ts';
import { ogCards } from '../src/lib/seo/og-cards.ts';
import { ogTree } from '../src/lib/seo/og-image.ts';
import { renderSitemap, renderSitemapIndex, sitemapEntry } from '../src/lib/seo/sitemap.ts';
import { articleData, createFixture, NOW, testConfig, type Fixture } from './helpers/fixture.ts';

let fixture: Fixture;
afterEach(() => fixture?.cleanup());

function graphOf(setup: (f: Fixture) => void) {
  fixture = createFixture();
  setup(fixture);
  const content = loadContent(fixture.root);
  expect(content.problems).toEqual([]);
  return buildGraph(content.raw, testConfig(), { now: NOW, includeDrafts: false, timezone: 'America/Toronto' });
}

describe('plan du site', () => {
  const page = (head: string) => `<html><head>${head}</head><body></body></html>`;
  const url = 'https://example.com/articles/a/';

  it('retient une page indexable et canonique, avec sa date de mise à jour', () => {
    const html = page(
      `<meta name="robots" content="index, follow, max-image-preview:large" /><link rel="canonical" href="${url}" /><meta property="article:published_time" content="2026-09-20T12:00:00.000Z" /><meta property="article:modified_time" content="2026-09-24" />`,
    );
    expect(sitemapEntry(html, url)).toEqual({ loc: url, lastmod: '2026-09-24' });
    expect(sitemapEntry(page(`<meta name="robots" content="index, follow" />`), url)).toEqual({ loc: url });
  });

  it('écarte les pages hors des moteurs et celles dont la canonique pointe ailleurs', () => {
    expect(sitemapEntry(page('<meta name="robots" content="noindex, follow" />'), url)).toBeUndefined();
    expect(sitemapEntry(page('<link rel="canonical" href="https://autre.example/a/" />'), url)).toBeUndefined();
  });

  it('produit un XML échappé et son index', () => {
    expect(renderSitemap([{ loc: 'https://example.com/?a=1&b=2' }])).toContain('<loc>https://example.com/?a=1&amp;b=2</loc>');
    expect(renderSitemapIndex(['https://example.com/sitemap-0.xml'])).toContain('<sitemap><loc>https://example.com/sitemap-0.xml</loc></sitemap>');
  });
});

describe('images Open Graph', () => {
  it('associe une image à chaque adresse, l’accueil compris', () => {
    expect(ogImagePath('/')).toBe('/og/accueil.png');
    expect(ogImagePath('/articles/essai/')).toBe('/og/articles/essai.png');
    expect(ogImagePath('/fiscalite/traitements/vente/?x=1#y')).toBe('/og/fiscalite/traitements/vente.png');
  });

  it('crée une carte par page publiée, sauf si l’auteur a choisi son image', () => {
    const graph = graphOf((f) => {
      f.mdx('content/articles/publie.mdx', articleData({ status: 'publie', publishedAt: '2026-09-20' }));
      f.mdx('content/articles/brouillon.mdx', articleData());
      f.mdx('content/organismes/amf.mdx', { name: 'Autorité des marchés financiers', acronym: 'AMF', jurisdiction: 'quebec', authorityType: 'regulateur-valeurs-mobilieres', role: 'Rôle.', website: 'https://example.org', status: 'publie' });
      f.mdx('content/juridictions/quebec.mdx', { name: 'Québec', level: 'provincial', description: 'Québec.', status: 'publie' });
    });
    const cards = ogCards(graph);
    expect(cards.map((c) => c.path)).toEqual(['accueil', 'articles/publie', 'juridictions/quebec', 'organismes/amf']);
    expect(cards.find((c) => c.path === 'organismes/amf')?.card).toEqual({ title: 'Autorité des marchés financiers', badge: 'Organisme', mark: 'AMF' });
    expect(cards.find((c) => c.path === 'articles/publie')?.card.badge).toBe('Actualités');
  });

  it('abrège un titre trop long et applique la typographie', () => {
    const tree = JSON.stringify(ogTree({ title: `${'Mot '.repeat(60)}: fin` }));
    expect(tree).toContain('…');
    expect(JSON.stringify(ogTree({ title: 'Titre : suite' }))).toContain('Titre : suite');
  });
});

describe('flux', () => {
  it('reprend les contenus publiés, du plus récent au plus ancien, en JSON Feed 1.1', () => {
    const graph = graphOf((f) => {
      f.mdx('content/articles/ancien.mdx', articleData({ status: 'publie', publishedAt: '2026-09-01', tags: ['mica'] }));
      f.mdx('content/articles/recent.mdx', articleData({ status: 'publie', publishedAt: '2026-09-20', updatedAt: '2026-09-22' }));
      f.mdx('content/articles/brouillon.mdx', articleData());
    });
    const items = feedItems(graph);
    expect(items.map((i) => i.url)).toEqual(['https://example.com/articles/recent/', 'https://example.com/articles/ancien/']);
    expect(items[0]?.tags).toEqual(['Actualités', 'Stablecoins']);
    const feed = jsonFeed(graph, items, { title: 'Site', description: 'Description.', feedPath: '/feed.json' });
    expect(feed.version).toBe('https://jsonfeed.org/version/1.1');
    expect(feed.feed_url).toBe('https://example.com/feed.json');
    expect(feed.items[0]).toMatchObject({ id: 'https://example.com/articles/recent/', date_modified: '2026-09-22T12:00:00.000Z', authors: [{ name: 'Rédaction' }] });
    expect(feedItems(graph, 'reglementation')).toEqual([]);
  });
});

describe('données structurées', () => {
  it('échappe « < » et relie le fil d’Ariane à des adresses absolues', () => {
    const json = serializeJsonLd({ '@type': 'Thing', name: '</script><script>' });
    expect(json).not.toContain('</script>');
    const crumbs = breadcrumbJsonLd('https://example.com', [{ label: 'Accueil', url: '/' }, { label: 'Page' }], '/page/');
    expect(crumbs.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://example.com/' },
      { '@type': 'ListItem', position: 2, name: 'Page', item: 'https://example.com/page/' },
    ]);
  });
});
