import { afterEach, describe, expect, it } from 'vitest';
import { loadContent } from '../src/lib/check/load.ts';
import { breadcrumbs } from '../src/lib/content/breadcrumbs.ts';
import { buildGraph } from '../src/lib/content/graph.ts';
import {
  childJuridictions,
  decisionsOf,
  dossiersOf,
  editorialAbout,
  entriesUsingTerm,
  relatedEditorial,
  upcomingAgenda,
  type Editorial,
} from '../src/lib/content/relations.ts';
import { articleData, createFixture, NOW, testConfig, type Fixture } from './helpers/fixture.ts';

let fixture: Fixture;
afterEach(() => fixture?.cleanup());

function graphOf(setup: (f: Fixture) => void) {
  fixture = createFixture();
  fixture.json('content/taxonomies/themes/plateformes.json', { label: 'Plateformes', group: 'reglementation' });
  fixture.json('content/taxonomies/themes/impot.json', { label: 'Impôt', group: 'fiscalite' });
  fixture.mdx('content/juridictions/canada.mdx', { name: 'Canada', level: 'federal', description: 'Canada.', status: 'publie' });
  fixture.mdx('content/juridictions/quebec.mdx', { name: 'Québec', level: 'provincial', description: 'Québec.', parent: 'canada', status: 'publie' });
  setup(fixture);
  const content = loadContent(fixture.root);
  expect(content.problems).toEqual([]);
  return buildGraph(content.raw, testConfig(), { now: NOW, includeDrafts: false, timezone: 'America/Toronto' });
}

const published = (day: string, extra: Record<string, unknown> = {}) => articleData({ status: 'publie', publishedAt: `2026-09-${day}`, ...extra });
const ids = (entries: Editorial[]) => entries.map((e) => e.id);

describe('articles liés', () => {
  it('suit l’ordre : sélection manuelle, même dossier, thèmes partagés, même catégorie', () => {
    const graph = graphOf((f) => {
      f.mdx('content/dossiers/stablecoins.mdx', {
        title: 'Dossier stablecoins',
        summary: 'Résumé de test suffisamment long pour franchir le seuil de quatre-vingts caractères exigé.',
        legalStatus: 'adopte',
        jurisdictions: ['canada'],
        status: 'publie',
        publishedAt: '2026-09-01',
        asOf: '2026-09-01',
        sources: [{ discriminant: 'ponctuelle', value: { label: 'Loi', url: 'https://example.org/loi', type: 'legislation', date: '', archivedUrl: '' } }],
      });
      f.mdx('content/articles/courant.mdx', published('20', { themes: ['stablecoins', 'plateformes'], relatedDossiers: ['stablecoins'], relatedArticles: ['manuel'] }));
      f.mdx('content/articles/manuel.mdx', published('01', { category: 'reglementation', themes: ['impot'], jurisdictions: ['canada'], asOf: '2026-09-01', tldr: ['a', 'b', 'c'], sources: [{ discriminant: 'ponctuelle', value: { label: 'Loi', url: 'https://example.org/loi', type: 'legislation', date: '', archivedUrl: '' } }] }));
      f.mdx('content/articles/meme-dossier.mdx', published('02', { themes: ['impot'], relatedDossiers: ['stablecoins'] }));
      f.mdx('content/articles/deux-themes.mdx', published('03', { themes: ['stablecoins', 'plateformes'] }));
      f.mdx('content/articles/un-theme-recent.mdx', published('19', { themes: ['plateformes'] }));
      f.mdx('content/articles/meme-categorie.mdx', published('18', { themes: ['impot'] }));
      f.mdx('content/articles/brouillon.mdx', articleData({ themes: ['stablecoins', 'plateformes'] }));
    });
    const current = graph.get('articles', 'courant') as Editorial;
    expect(ids(relatedEditorial(graph, current))).toEqual(['manuel', 'meme-dossier', 'deux-themes', 'un-theme-recent', 'meme-categorie']);
    expect(ids(relatedEditorial(graph, current, 2))).toEqual(['manuel', 'meme-dossier']);
    expect(ids(editorialAbout(graph, 'relatedDossiers', 'stablecoins'))).toEqual(['courant', 'meme-dossier']);
  });
});

describe('relations inverses', () => {
  it('rassemble décisions, dossiers, sous-juridictions, agenda à venir et usages du lexique', () => {
    const graph = graphOf((f) => {
      f.mdx('content/organismes/amf.mdx', { name: 'Autorité des marchés financiers', acronym: 'AMF', jurisdiction: 'quebec', authorityType: 'regulateur-valeurs-mobilieres', role: 'Régulateur.', website: 'https://example.org', status: 'publie' });
      const texte = (type: string, adoptedAt: string) => ({ title: `Texte ${type}`, type, issuer: 'amf', jurisdiction: 'quebec', officialUrl: 'https://example.org/t', summary: 'Résumé.', adoptedAt, status: 'publie' });
      f.mdx('content/textes/decision-a.mdx', texte('decision-administrative', '2026-05-01'));
      f.mdx('content/textes/decision-b.mdx', texte('decision-judiciaire', '2026-08-01'));
      f.mdx('content/textes/reglement.mdx', texte('reglement', '2026-09-01'));
      f.json('content/agenda/passe.json', { title: 'Passé', date: '2026-09-01', type: 'evenement', jurisdiction: 'quebec', status: 'publie' });
      f.json('content/agenda/en-cours.json', { title: 'En cours', date: '2026-09-20', endDate: '2026-09-30', type: 'consultation', jurisdiction: 'quebec', status: 'publie' });
      f.json('content/agenda/futur.json', { title: 'Futur', date: '2026-10-15', type: 'echeance-fiscale', jurisdiction: 'canada', status: 'publie' });
      f.mdx('content/lexique/staking.mdx', { term: 'Staking', shortDefinition: 'Définition.', status: 'publie' });
      f.mdx('content/articles/usage.mdx', published('10'), 'Le <Definition term="staking">jalonnement</Definition> et `<Definition term="ignore">` en code.');
    });
    expect(decisionsOf(graph, 'amf').map((e) => e.id)).toEqual(['decision-b', 'decision-a']);
    expect(dossiersOf(graph, { jurisdiction: 'quebec' })).toEqual([]);
    expect(childJuridictions(graph, 'canada').map((e) => e.id)).toEqual(['quebec']);
    expect(upcomingAgenda(graph).map((e) => e.id)).toEqual(['en-cours', 'futur']);
    expect(upcomingAgenda(graph, { jurisdiction: 'canada' }).map((e) => e.id)).toEqual(['futur']);
    expect(entriesUsingTerm(graph, 'staking').map((e) => e.id)).toEqual(['usage']);
    expect(entriesUsingTerm(graph, 'ignore')).toEqual([]);
  });

  it('construit les fils d’Ariane', () => {
    const graph = graphOf((f) => f.mdx('content/articles/essai.mdx', published('10')));
    const article = graph.get('articles', 'essai');
    expect(article && breadcrumbs.article(graph, article)).toEqual([
      { label: 'Accueil', url: '/' },
      { label: 'Actualités', url: '/actualites/' },
      { label: 'Un titre d’article de test assez long' },
    ]);
    const quebec = graph.get('juridictions', 'quebec');
    expect(quebec && breadcrumbs.juridiction(graph, quebec).map((c) => c.label)).toEqual(['Accueil', 'Juridictions', 'Canada', 'Québec']);
  });
});
