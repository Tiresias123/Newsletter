import { afterEach, describe, expect, it } from 'vitest';
import { loadContent } from '../src/lib/check/load.ts';
import { dossierView, juridictionView, organismeView, texteView, traitementView } from '../src/lib/content/fiches.ts';
import { buildGraph } from '../src/lib/content/graph.ts';
import { createFixture, NOW, testConfig, type Fixture } from './helpers/fixture.ts';

let fixture: Fixture;
afterEach(() => fixture?.cleanup());

const SOURCE = [{ discriminant: 'ponctuelle', value: { label: 'Loi', url: 'https://example.org/loi', type: 'legislation', date: '', archivedUrl: '' } }];

function graphOf(setup: (f: Fixture) => void, config = testConfig()) {
  fixture = createFixture();
  fixture.mdx('content/juridictions/canada.mdx', { name: 'Canada', level: 'federal', country: 'CA', description: 'Canada.', status: 'publie' });
  fixture.mdx('content/juridictions/quebec.mdx', { name: 'Québec', level: 'provincial', country: 'CA', description: 'Québec.', parent: 'canada', status: 'publie' });
  fixture.mdx('content/organismes/amf.mdx', { name: 'Autorité des marchés financiers', acronym: 'AMF', jurisdiction: 'quebec', authorityType: 'regulateur-valeurs-mobilieres', role: 'Régulateur.', website: 'https://www.example.org/', status: 'publie' });
  setup(fixture);
  const content = loadContent(fixture.root);
  expect(content.problems).toEqual([]);
  return buildGraph(content.raw, config, { now: NOW, includeDrafts: false, timezone: 'America/Toronto' });
}

const dossier = (overrides: Record<string, unknown> = {}) => ({
  title: 'Dossier de test',
  summary: 'Résumé de test suffisamment long pour franchir le seuil de quatre-vingts caractères exigé.',
  legalStatus: 'consultation',
  jurisdictions: ['quebec'],
  status: 'publie',
  publishedAt: '2026-09-01',
  asOf: '2026-09-01',
  sources: SOURCE,
  ...overrides,
});

const texte = (overrides: Record<string, unknown> = {}) => ({
  title: 'Texte de test',
  type: 'reglement',
  issuer: 'amf',
  jurisdiction: 'quebec',
  officialUrl: 'https://example.org/t',
  summary: 'Résumé.',
  status: 'publie',
  ...overrides,
});

describe('fiche d’un dossier', () => {
  it('résume statut, autorités et dates ; garde le nom d’un texte clé non publié, sans lien', () => {
    const graph = graphOf((f) => {
      f.mdx('content/dossiers/essai.mdx', dossier({ authorities: ['amf'], whoIsAffected: ['plateformes'], effectiveDate: '2027-01-01', keyTextes: ['publie', 'brouillon'] }));
      f.mdx('content/textes/publie.mdx', texte({ title: 'Règlement publié', adoptedAt: '2026-06-01' }));
      f.mdx('content/textes/brouillon.mdx', texte({ title: 'Règlement en préparation', status: 'brouillon' }));
    });
    const view = dossierView(graph, graph.get('dossiers', 'essai')!);
    expect(view.identity.map((row) => row.label)).toEqual(['Statut', 'Autorités', 'Qui est visé', 'Entrée en vigueur']);
    expect(view.identity[1]?.values).toEqual([{ text: 'AMF', url: '/organismes/amf/' }]);
    expect(view.keyTextes.map((l) => [l.label, l.url])).toEqual([
      ['Règlement publié', '/textes/publie/'],
      ['Règlement en préparation', undefined],
    ]);
    expect(view.disclaimer?.id).toBe('reglementaire');
  });
});

describe('fiche d’une juridiction', () => {
  it('omet le pays quand il répète le nom et met les dossiers clés en tête', () => {
    const graph = graphOf((f) => {
      f.mdx('content/dossiers/a.mdx', dossier({ title: 'Dossier de test A', jurisdictions: ['canada'], publishedAt: '2026-09-10' }));
      f.mdx('content/dossiers/b.mdx', dossier({ title: 'Dossier de test B', jurisdictions: ['canada'], publishedAt: '2026-09-01' }));
      f.mdx('content/juridictions/canada.mdx', { name: 'Canada', level: 'federal', country: 'CA', description: 'Canada.', keyDossiers: ['b'], status: 'publie' });
    });
    const canada = juridictionView(graph, graph.get('juridictions', 'canada')!);
    expect(canada.identity.map((row) => row.label)).toEqual(['Niveau', 'Juridictions rattachées']);
    expect(canada.dossiers.map((l) => l.label)).toEqual(['Dossier de test B', 'Dossier de test A']);
    const quebec = juridictionView(graph, graph.get('juridictions', 'quebec')!);
    expect(quebec.identity.find((row) => row.label === 'Pays')?.values).toEqual([{ text: 'Canada' }]);
    expect(quebec.organismes.map((l) => l.label)).toEqual(['Autorité des marchés financiers (AMF)']);
  });
});

describe('fiche d’un organisme', () => {
  it('sépare décisions et autres textes ; n’affiche le flux officiel que s’il est activé', () => {
    const source = { id: 'amf', label: 'AMF', organisme: 'amf', jurisdiction: 'quebec', url: 'https://example.org/flux', format: 'rss', language: 'fr', keywords: [], staleDays: 30, note: '' };
    const setup = (f: Fixture) => {
      f.mdx('content/textes/decision.mdx', texte({ title: 'Décision de test', type: 'decision-administrative', adoptedAt: '2026-08-01' }));
      f.mdx('content/textes/reglement.mdx', texte({ title: 'Règlement de test', adoptedAt: '2026-07-01' }));
    };
    const base = testConfig();
    const off = graphOf(setup, { ...base, veilleSources: { ...base.veilleSources, sources: [{ ...source, enabled: false }] } as typeof base.veilleSources });
    const view = organismeView(off, off.get('organismes', 'amf')!);
    expect(view.decisions.map((l) => l.label)).toEqual(['Décision de test']);
    expect(view.textes.map((l) => l.label)).toEqual(['Règlement de test']);
    expect(view.identity.find((row) => row.label === 'Site')?.values).toEqual([{ text: 'example.org', url: 'https://www.example.org/', external: true }]);
    expect(view.feed).toBeUndefined();
    fixture.cleanup();
    const on = graphOf(setup, { ...base, veilleSources: { ...base.veilleSources, sources: [{ ...source, enabled: true }] } as typeof base.veilleSources });
    expect(organismeView(on, on.get('organismes', 'amf')!).feed).toBe('https://example.org/flux');
  });
});

describe('fiches d’un texte et d’un traitement fiscal', () => {
  it('relie un texte aux dossiers qui le citent ; impose l’avertissement fiscal au traitement', () => {
    const graph = graphOf((f) => {
      f.mdx('content/textes/loi.mdx', texte({ type: 'loi', documentNumber: 'L-1', legalStatus: 'en-vigueur' }));
      f.mdx('content/dossiers/essai.mdx', dossier({ keyTextes: ['loi'] }));
      f.json('content/taxonomies/types-contribuables/particulier.json', { label: 'Particulier' });
      f.json('content/taxonomies/activites-fiscales/vente.json', { label: 'Vente' });
      f.mdx('content/traitements-fiscaux/vente.mdx', {
        title: 'Vente par un particulier (test)',
        jurisdiction: 'quebec',
        taxpayerType: 'particulier',
        activity: 'vente',
        taxType: 'gain-capital',
        treatment: 'Résumé.',
        forms: [{ code: 'T1', name: 'Déclaration', url: 'https://example.org/t1' }, { code: 'X', name: 'Annexe', url: '' }],
        sources: SOURCE,
        asOf: '2026-09-01',
        status: 'publie',
      });
    });
    const loi = texteView(graph, graph.get('textes', 'loi')!);
    expect(loi.dossiers.map((l) => l.label)).toEqual(['Dossier de test']);
    expect(loi.identity.map((row) => row.label)).toEqual(['Type', 'Émetteur', 'Juridiction', 'Numéro', 'Statut']);
    const vente = traitementView(graph, graph.get('traitements', 'vente')!);
    expect(vente.disclaimer?.id).toBe('fiscal');
    expect(vente.forms.map((f) => [f.label, f.external])).toEqual([
      ['T1 : Déclaration', true],
      ['X : Annexe', false],
    ]);
    expect(vente.identity.find((row) => row.label === 'Type de contribuable')?.values).toEqual([{ text: 'Particulier' }]);
  });
});
