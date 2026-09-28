import { afterEach, describe, expect, it } from 'vitest';
import { loadContent } from '../src/lib/check/load.ts';
import { buildGraph } from '../src/lib/content/graph.ts';
import { articleSchema } from '../src/lib/content/schemas.ts';
import { DEK_TEMPLATE, newArticle, slugFromTitle } from '../src/lib/editor/new-entry.ts';
import { z } from '../src/lib/zod.ts';
import { articleData, createFixture, NOW, testConfig, type Fixture } from './helpers/fixture.ts';

let fixture: Fixture;
afterEach(() => fixture?.cleanup());

function graph() {
  fixture = createFixture();
  return buildGraph(loadContent(fixture.root).raw, testConfig(), { now: NOW, includeDrafts: true, timezone: 'America/Toronto' });
}

describe('nouvel article', () => {
  it('tire un identifiant du titre : sans accents ni marqueurs, 80 caractères au plus, coupé entre deux mots', () => {
    expect(slugFromTitle("[EXEMPLE] L'Œuvre des autorités : ce qui change en 2026")).toBe('l-oeuvre-des-autorites-ce-qui-change-en-2026');
    const long = slugFromTitle(`Un titre ${'vraiment '.repeat(15)}long`);
    expect(long.length).toBeLessThanOrEqual(80);
    expect(long.endsWith('-')).toBe(false);
  });

  it('préremplit un brouillon valide, daté du jour, avec le premier classement de chaque liste', () => {
    const article = newArticle(graph(), 'Les plateformes doivent désormais s’inscrire');
    expect(article).toMatchObject({ collection: 'articles', slug: 'les-plateformes-doivent-desormais-s-inscrire' });
    expect(article.data).toMatchObject({ category: 'actualites', format: 'analyse', themes: ['stablecoins'], author: 'redaction', status: 'brouillon', publishedAt: '2026-09-25' });
    expect(DEK_TEMPLATE.length).toBeGreaterThanOrEqual(160);
    expect(articleSchema({ image: () => z.string() }).safeParse(article.data).success).toBe(true);
  });

  it('refuse un titre hors limites, un identifiant pris et un classement inconnu', () => {
    const g = graph();
    expect(() => newArticle(g, 'Court')).toThrow('de 20 à 120 caractères');
    expect(() => newArticle(g, 'Un titre assez long pour être accepté', { category: 'inconnue' })).toThrow('« inconnue » n\'existe pas');
    fixture.mdx('content/articles/un-titre-assez-long-pour-etre-accepte.mdx', articleData());
    const withArticle = buildGraph(loadContent(fixture.root).raw, testConfig(), { now: NOW, includeDrafts: true, timezone: 'America/Toronto' });
    expect(() => newArticle(withArticle, 'Un titre assez long pour être accepté')).toThrow('porte déjà');
  });

  it('prépare un guide sur demande', () => {
    expect(newArticle(graph(), 'Déclarer ses cryptoactifs pas à pas', { guide: true })).toMatchObject({ collection: 'guides', data: { level: 'facile' } });
  });
});
