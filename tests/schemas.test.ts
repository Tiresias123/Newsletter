import { describe, expect, it } from 'vitest';
import { z } from '../src/lib/zod.ts';
import { homepageSchema, siteSchema } from '../src/lib/config/schemas.ts';
import { articleSchema, dossierSchema } from '../src/lib/content/schemas.ts';
import { describePath, problemsFromZod } from '../src/lib/errors.ts';
import homepage from '../config/homepage.json' with { type: 'json' };
import site from '../config/site.json' with { type: 'json' };
import { articleData } from './helpers/fixture.ts';

const schema = articleSchema({ image: () => z.string() });
const messages = (data: unknown) => {
  const result = schema.safeParse(data);
  return result.success ? [] : problemsFromZod('essai.mdx', result.error).map((p) => `${p.field} : ${p.message}`);
};

describe('schéma des articles', () => {
  it('accepte un brouillon minimal et complète les valeurs par défaut', () => {
    const result = schema.parse(articleData());
    expect(result.status).toBe('brouillon');
    expect(result.publishedTime).toBe('08:00');
    expect(result.sources).toEqual([]);
  });

  it('refuse un champ inconnu, avec un message en français', () => {
    expect(messages(articleData({ titre: 'x' }))).toEqual(['fichier entier : Champ inconnu : « titre » (faute de frappe?).']);
  });

  it('exige de 3 à 5 points pour « L’essentiel », ou aucun', () => {
    expect(messages(articleData({ tldr: ['a', 'b'] }))).toHaveLength(1);
    expect(messages(articleData({ tldr: ['a', 'b', 'c'] }))).toEqual([]);
    expect(messages(articleData({ tldr: ['a', 'b', 'c', 'd', 'e', 'f'] }))).toHaveLength(1);
  });

  it('exige une date de publication hors brouillon, et des dates dans l’ordre', () => {
    expect(messages(articleData({ status: 'publie' })).join()).toContain('Date de publication obligatoire');
    expect(messages(articleData({ status: 'publie', publishedAt: '2026-09-20', updatedAt: '2026-09-01' })).join()).toContain('précède');
  });

  it('exige texte alternatif et crédit dès qu’une couverture est fournie', () => {
    const found = messages(articleData({ cover: { src: 'image.webp' } }));
    expect(found).toHaveLength(2);
    expect(found.join()).toContain('Texte alternatif obligatoire');
  });

  it('ramène les dates YAML au format AAAA-MM-JJ et refuse un jour inexistant', () => {
    expect(schema.parse(articleData({ publishedAt: new Date('2026-09-24T00:00:00Z') })).publishedAt).toBe('2026-09-24');
    expect(messages(articleData({ publishedAt: '2026-02-30' })).join()).toContain('le jour doit exister');
  });

  it('transforme les sources au format de l’éditeur', () => {
    const parsed = schema.parse(
      articleData({
        sources: [
          { discriminant: 'reference', value: { source: 'loi-impot-revenu' } },
          { discriminant: 'ponctuelle', value: { label: 'Communiqué', url: 'https://example.org/c', type: 'communique', date: '', archivedUrl: '' } },
        ],
      }),
    );
    expect(parsed.sources[0]).toEqual({ kind: 'reference', source: 'loi-impot-revenu' });
    expect(parsed.sources[1]).toMatchObject({ kind: 'ponctuelle', type: 'communique', date: undefined });
  });
});

describe('schéma des dossiers', () => {
  it('exige « Vérifié le » pour un dossier publié', () => {
    const result = dossierSchema({ image: () => z.string() }).safeParse({
      title: 'Un dossier de test',
      summary: 'Résumé de test suffisamment long pour franchir le seuil de quatre-vingts caractères exigé.',
      legalStatus: 'adopte',
      jurisdictions: ['canada'],
      status: 'publie',
      publishedAt: '2026-09-20',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path.join('.'))).toEqual(['asOf']);
  });
});

describe('configuration', () => {
  it('valide les fichiers livrés', () => {
    expect(siteSchema.safeParse(site).success).toBe(true);
    const sections = homepageSchema.parse(homepage).sections;
    expect(sections.every((s) => typeof s.type === 'string')).toBe(true);
  });

  it('nomme les champs en clair dans les erreurs', () => {
    expect(describePath(['sources', 2, 'value', 'url'])).toBe('Sources › élément 3 › Adresse web');
  });
});
