import { afterEach, describe, expect, it } from 'vitest';
import { loadContent } from '../src/lib/check/load.ts';
import { buildGraph } from '../src/lib/content/graph.ts';
import { tagIndex } from '../src/lib/content/relations.ts';
import { pagedPaths, pagedTitle } from '../src/lib/lists.ts';
import { paginate } from '../src/lib/pagination.ts';
import { pageToc } from '../src/lib/toc.ts';
import { tagSlug, url } from '../src/lib/urls.ts';
import { articleData, createFixture, NOW, testConfig, type Fixture } from './helpers/fixture.ts';

let fixture: Fixture;
afterEach(() => fixture?.cleanup());

describe('pagination des listes', () => {
  it('produit la page 1 à l’adresse de la liste, puis « page/n »', () => {
    expect(pagedPaths({ root: 'fiscalite' }, 30)).toEqual([
      { params: { root: 'fiscalite', page: undefined }, props: { current: 1 } },
      { params: { root: 'fiscalite', page: 'page/2' }, props: { current: 2 } },
      { params: { root: 'fiscalite', page: 'page/3' }, props: { current: 3 } },
    ]);
    expect(pagedPaths({}, 0)).toHaveLength(1);
    const page = paginate(Array.from({ length: 30 }, (_, i) => i), '/fiscalite/', 3);
    expect(page.items).toEqual([24, 25, 26, 27, 28, 29]);
    expect(page.urls).toEqual({ previous: '/fiscalite/page/2/', next: undefined });
    expect(page.pageUrl(1)).toBe('/fiscalite/');
  });
  it('ajoute le numéro de page au titre à partir de la page 2', () => {
    expect(pagedTitle('Fiscalité', 1)).toBe('Fiscalité');
    expect(pagedTitle('Fiscalité', 2)).toBe('Fiscalité, page 2');
  });
});

describe('sommaire des fiches', () => {
  it('place les sections autour des titres du corps et rend leurs ancres uniques', () => {
    const headings = [
      { depth: 2, slug: 'contexte', text: 'Contexte' },
      { depth: 3, slug: 'detail', text: 'Détail' },
      { depth: 4, slug: 'ignore', text: 'Ignoré' },
      { depth: 2, slug: 'sources', text: 'Sources' },
    ];
    const { toc, id } = pageToc(
      headings,
      [{ id: 'ce-qui-change', title: 'Ce qui change' }],
      [
        { id: 'obligations', title: 'Obligations', show: false },
        { id: 'sources', title: 'Sources' },
      ],
    );
    expect(toc.map((h) => h.slug)).toEqual(['ce-qui-change', 'contexte', 'detail', 'sources', 'sources-2']);
    expect(id('sources')).toBe('sources-2');
    expect(id('ce-qui-change')).toBe('ce-qui-change');
  });
});

describe('étiquettes', () => {
  it('forme des adresses sans accents ni ligatures', () => {
    expect(tagSlug('Déclaration de revenus')).toBe('declaration-de-revenus');
    expect(tagSlug('TPS/TVQ')).toBe('tps-tvq');
    expect(tagSlug('Œuvre')).toBe('oeuvre');
    expect(url.tag('Staking')).toBe('/tags/staking/');
  });
  it('regroupe les étiquettes qui mènent à la même adresse', () => {
    fixture = createFixture();
    fixture.mdx('content/articles/a.mdx', articleData({ status: 'publie', publishedAt: '2026-09-02', tags: ['Staking', 'mica'] }));
    fixture.mdx('content/articles/b.mdx', articleData({ status: 'publie', publishedAt: '2026-09-01', tags: ['staking'] }));
    fixture.mdx('content/articles/c.mdx', articleData({ tags: ['brouillon'] }));
    const content = loadContent(fixture.root);
    expect(content.problems).toEqual([]);
    const graph = buildGraph(content.raw, testConfig(), { now: NOW, includeDrafts: false, timezone: 'America/Toronto' });
    const index = tagIndex(graph);
    expect([...index.keys()]).toEqual(['staking', 'mica']);
    expect(index.get('staking')?.entries.map((e) => e.id)).toEqual(['a', 'b']);
  });
});
