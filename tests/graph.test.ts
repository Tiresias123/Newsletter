import { afterEach, describe, expect, it } from 'vitest';
import { buildGraph, countWords } from '../src/lib/content/graph.ts';
import { loadContent } from '../src/lib/check/load.ts';
import { articleData, createFixture, NOW, testConfig, type Fixture } from './helpers/fixture.ts';

let fixture: Fixture;
afterEach(() => fixture?.cleanup());

function graphOf(setup: (f: Fixture) => void, includeDrafts = false) {
  fixture = createFixture();
  setup(fixture);
  const content = loadContent(fixture.root);
  expect(content.problems).toEqual([]);
  return buildGraph(content.raw, testConfig(), { now: NOW, includeDrafts, timezone: 'America/Toronto' });
}

const rules = (graph: ReturnType<typeof graphOf>) => graph.problems.map((p) => `${p.rule} ${p.field}`);

describe('graphe de contenu', () => {
  it('signale une relation vers un contenu inexistant', () => {
    const graph = graphOf((f) => f.mdx('content/articles/essai.mdx', articleData({ themes: ['inconnu'] })));
    expect(graph.problems).toMatchObject([{ rule: 'relation', severity: 'bloquant', message: expect.stringContaining('« inconnu »') }]);
  });

  it('applique les exigences d’une catégorie vérifiée dès la publication', () => {
    const published = articleData({ category: 'reglementation', status: 'publie', publishedAt: '2026-09-20' });
    expect(rules(graphOf((f) => f.mdx('content/articles/essai.mdx', published)))).toEqual([
      'verification Vérifié le',
      "verification L'essentiel",
      'verification Juridictions',
      'source-officielle Sources',
    ]);
  });

  it('ignore ces exigences pour un brouillon', () => {
    const graph = graphOf((f) => f.mdx('content/articles/essai.mdx', articleData({ category: 'reglementation' })));
    expect(graph.problems).toEqual([]);
  });

  it('refuse deux infolettres de même numéro', () => {
    const graph = graphOf((f) => {
      f.mdx('content/newsletters/a.mdx', { subject: 'Numéro un', issueNumber: 1 });
      f.mdx('content/newsletters/b.mdx', { subject: 'Numéro un bis', issueNumber: 1 });
    });
    expect(rules(graph)).toEqual(['unicite Numéro']);
  });

  it('refuse une page qui prend l’adresse d’une catégorie ou une adresse réservée', () => {
    const graph = graphOf((f) => {
      f.mdx('content/pages/actualites.mdx', { title: 'Actualités' });
      f.mdx('content/pages/articles.mdx', { title: 'Articles' });
    });
    expect(graph.problems.map((p) => p.message)).toEqual([
      "L'identifiant « articles » est réservé par le site : choisissez-en un autre.",
      "L'adresse /actualites/ est déjà prise par content/pages/actualites.mdx.",
    ]);
  });

  it('calcule la visibilité selon le statut et le mode', () => {
    const setup = (f: Fixture) => {
      f.mdx('content/articles/brouillon.mdx', articleData());
      f.mdx('content/articles/programme-futur.mdx', articleData({ status: 'programme', publishedAt: '2026-10-01' }));
      f.mdx('content/articles/programme-echu.mdx', articleData({ status: 'programme', publishedAt: '2026-09-25', publishedTime: '08:00' }));
      f.mdx('content/articles/archive.mdx', articleData({ status: 'archive', publishedAt: '2025-01-10' }));
      f.mdx('content/newsletters/2026-001.mdx', { subject: 'Premier numéro', issueNumber: 1, status: 'envoye', sentAt: '2026-09-18' });
    };
    const production = graphOf(setup);
    const state = (id: string) => production.get('articles', id)?.visibility;
    expect(state('brouillon')).toMatchObject({ visible: false, listed: false });
    expect(state('programme-futur')).toMatchObject({ visible: false });
    expect(state('programme-echu')).toMatchObject({ visible: true, listed: true });
    expect(state('archive')).toMatchObject({ visible: true, listed: false });
    expect(production.get('newsletters', '2026-001')?.visibility.visible).toBe(true);
    expect(production.listed('articles').map((e) => e.id)).toEqual(['programme-echu']);

    const preview = graphOf(setup, true);
    expect(preview.get('articles', 'brouillon')?.visibility).toMatchObject({ visible: true, previewOnly: true });
  });

  it('compte les mots lisibles et en déduit le temps de lecture', () => {
    expect(countWords('## Titre\n\nUn [lien](/a/) et <Note>une note</Note>.\n\n```\ncode ignoré\n```')).toBe(6);
    const graph = graphOf((f) => f.mdx('content/articles/long.mdx', articleData(), 'mot '.repeat(500)));
    expect(graph.get('articles', 'long')?.readingTime).toBe(3);
  });
});
