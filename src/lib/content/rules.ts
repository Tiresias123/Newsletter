// Règles qui croisent plusieurs contenus : relations, sources officielles, unicités, collisions d'adresses.
// Une erreur « bloquant » arrête le build ; les autres alimentent le rapport « À vérifier ».
import messages from '../../../config/i18n/fr.json' with { type: 'json' };
import { describePath } from '../errors.ts';
import { RESERVED_ROOT_SLUGS } from '../urls.ts';
import type { CollectionName } from './collections.ts';
import type { CitedSource } from './fields.ts';
import type { Entry, Graph, GraphProblem, Severity } from './graph.ts';

const COLLECTION_LABELS: Record<string, string> = messages.collections;
const label = (c: CollectionName) => `la collection « ${COLLECTION_LABELS[c] ?? c} »`;

// Champs de relation : l'identifiant saisi doit exister dans la collection cible.
const RELATIONS: Array<[CollectionName, string, CollectionName]> = [
  ...(['articles', 'guides'] as const).flatMap((c): Array<[CollectionName, string, CollectionName]> => [
    [c, 'category', 'categories'],
    [c, 'format', 'formats'],
    [c, 'themes', 'themes'],
    [c, 'jurisdictions', 'juridictions'],
    [c, 'author', 'auteurs'],
    [c, 'relatedDossiers', 'dossiers'],
    [c, 'relatedTextes', 'textes'],
    [c, 'relatedOrganismes', 'organismes'],
    [c, 'relatedTraitements', 'traitements'],
    [c, 'relatedArticles', 'articles'],
  ]),
  ['dossiers', 'jurisdictions', 'juridictions'],
  ['dossiers', 'themes', 'themes'],
  ['dossiers', 'authorities', 'organismes'],
  ['dossiers', 'keyTextes', 'textes'],
  ['juridictions', 'parent', 'juridictions'],
  ['juridictions', 'keyDossiers', 'dossiers'],
  ['juridictions', 'keyTraitements', 'traitements'],
  ['organismes', 'jurisdiction', 'juridictions'],
  ['textes', 'issuer', 'organismes'],
  ['textes', 'jurisdiction', 'juridictions'],
  ['traitements', 'jurisdiction', 'juridictions'],
  ['traitements', 'taxpayerType', 'contribuables'],
  ['traitements', 'activity', 'activites'],
  ['lexique', 'seeAlso', 'lexique'],
  ['sources', 'issuer', 'organismes'],
  ['sources', 'jurisdiction', 'juridictions'],
  ['agenda', 'jurisdiction', 'juridictions'],
  ['agenda', 'relatedDossier', 'dossiers'],
  ['newsletters', 'articles', 'articles'],
];

// Champs qui citent des sources (référence à la collection « sources » ou source ponctuelle).
const CITATIONS: Array<[CollectionName, string]> = [
  ['articles', 'sources'],
  ['guides', 'sources'],
  ['dossiers', 'sources'],
  ['traitements', 'sources'],
  ['lexique', 'officialSources'],
];

const field = (entry: Entry, name: string): unknown => (entry.data as Record<string, unknown>)[name];
const ids = (value: unknown): string[] => (Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : typeof value === 'string' && value ? [value] : []);
const isDraft = (entry: Entry) => field(entry, 'status') === 'brouillon';

export function checkGraph(graph: Graph): GraphProblem[] {
  const problems: GraphProblem[] = [];
  const add = (file: string, path: PropertyKey[], message: string, rule: string, severity: Severity = 'bloquant') =>
    problems.push({ file, field: describePath(path), message, rule, severity });

  // 1. Relations vers des contenus existants.
  for (const [collection, name, target] of RELATIONS) {
    for (const entry of graph.all(collection)) {
      for (const id of ids(field(entry, name))) {
        if (!graph.get(target, id)) add(entry.file, [name], `« ${id} » n'existe pas dans ${label(target)}.`, 'relation');
      }
    }
  }
  for (const [collection, name] of CITATIONS) {
    for (const entry of graph.all(collection)) {
      (field(entry, name) as CitedSource[]).forEach((source, i) => {
        if (source.kind === 'reference' && !graph.get('sources', source.source)) {
          add(entry.file, [name, i], `« ${source.source} » n'existe pas dans ${label('sources')}.`, 'relation');
        }
      });
    }
  }

  // 2. Catégories exigeant la vérification (réglementation, fiscalité) : « Vérifié le », L'essentiel,
  //    juridictions et au moins une source officielle, dès que le contenu n'est plus un brouillon.
  for (const collection of ['articles', 'guides'] as const) {
    for (const entry of graph.all(collection)) {
      if (isDraft(entry)) continue;
      const category = graph.get('categories', entry.data.category);
      if (!category?.data.requireVerification) continue;
      const name = category.data.label;
      if (!entry.data.asOf) add(entry.file, ['asOf'], `« Vérifié le » est obligatoire dans la catégorie ${name}.`, 'verification');
      if (entry.data.tldr.length < 3) add(entry.file, ['tldr'], `L'essentiel (3 à 5 points) est obligatoire dans la catégorie ${name}.`, 'verification');
      if (entry.data.jurisdictions.length === 0) add(entry.file, ['jurisdictions'], `Au moins une juridiction est obligatoire dans la catégorie ${name}.`, 'verification');
      if (!entry.data.sources.some((s) => graph.isOfficial(s))) {
        add(entry.file, ['sources'], `Au moins une source officielle est obligatoire dans la catégorie ${name} (types réputés officiels : config/legal.json).`, 'source-officielle');
      }
    }
  }
  for (const collection of ['dossiers', 'traitements'] as const) {
    for (const entry of graph.all(collection)) {
      if (!isDraft(entry) && !entry.data.sources.some((s) => graph.isOfficial(s))) {
        add(entry.file, ['sources'], 'Au moins une source officielle est obligatoire (types réputés officiels : config/legal.json).', 'source-officielle');
      }
    }
  }

  // 3. Avertissements choisis parmi les variantes de config/legal.json.
  const disclaimers = new Set(graph.config.legal.disclaimers.map((d) => d.id));
  const validDisclaimer = (v: string) => !v || v === 'aucun' || disclaimers.has(v);
  for (const collection of ['articles', 'guides'] as const) {
    for (const entry of graph.all(collection)) {
      if (!validDisclaimer(entry.data.disclaimerVariant)) add(entry.file, ['disclaimerVariant'], `Variante « ${entry.data.disclaimerVariant} » absente de config/legal.json.`, 'avertissement');
    }
  }
  for (const entry of graph.all('categories')) {
    if (!validDisclaimer(entry.data.defaultDisclaimer)) add(entry.file, ['defaultDisclaimer'], `Variante « ${entry.data.defaultDisclaimer} » absente de config/legal.json.`, 'avertissement');
  }

  // 4. Juridictions : pas de boucle dans les juridictions parentes.
  for (const entry of graph.all('juridictions')) {
    const seen = new Set([entry.id]);
    let parent = graph.get('juridictions', entry.data.parent);
    while (parent) {
      if (seen.has(parent.id)) {
        add(entry.file, ['parent'], 'Boucle dans les juridictions parentes.', 'juridiction');
        break;
      }
      seen.add(parent.id);
      parent = graph.get('juridictions', parent.data.parent);
    }
  }

  // 5. Unicités : combinaison d'un traitement fiscal, numéro d'infolettre.
  const combos = new Map<string, string>();
  for (const entry of graph.all('traitements')) {
    const key = [entry.data.jurisdiction, entry.data.taxpayerType, entry.data.activity, entry.data.taxType].join(' × ');
    const other = combos.get(key);
    if (other) add(entry.file, ['activity'], `Même combinaison (${key}) que ${other}.`, 'unicite');
    else combos.set(key, entry.file);
  }
  const issues = new Map<number, string>();
  for (const entry of graph.all('newsletters')) {
    const other = issues.get(entry.data.issueNumber);
    if (other) add(entry.file, ['issueNumber'], `Numéro déjà utilisé par ${other}.`, 'unicite');
    else issues.set(entry.data.issueNumber, entry.file);
  }

  // 6. Adresses à la racine du site : pages et catégories partagent l'espace de noms.
  const root = new Map<string, string>();
  for (const entry of [...graph.all('pages'), ...graph.all('categories')]) {
    if ((RESERVED_ROOT_SLUGS as readonly string[]).includes(entry.id)) {
      add(entry.file, [], `L'identifiant « ${entry.id} » est réservé par le site : choisissez-en un autre.`, 'adresse');
    }
    const other = root.get(entry.id);
    if (other) add(entry.file, [], `L'adresse /${entry.id}/ est déjà prise par ${other}.`, 'adresse');
    else root.set(entry.id, entry.file);
  }

  // 7. Anciennes adresses : jamais l'adresse actuelle d'un autre contenu, jamais deux fois la même.
  for (const collection of ['articles', 'guides', 'dossiers'] as const) {
    const owners = new Map<string, string>();
    for (const entry of graph.all(collection)) {
      for (const old of entry.data.previousSlugs) {
        if (graph.get(collection, old)) add(entry.file, ['previousSlugs'], `« ${old} » est l'adresse actuelle d'un autre contenu.`, 'adresse');
        const other = owners.get(old);
        if (other) add(entry.file, ['previousSlugs'], `« ${old} » figure déjà dans les anciennes adresses de ${other}.`, 'adresse');
        else owners.set(old, entry.file);
      }
    }
  }

  checkConfigReferences(graph, add);
  return problems;
}

type Add = (file: string, path: PropertyKey[], message: string, rule: string, severity?: Severity) => void;

// Identifiants cités dans la configuration (accueil, veille) : ils doivent exister eux aussi.
function checkConfigReferences(graph: Graph, add: Add) {
  const HOME = 'config/homepage.json';
  const MANUAL_TARGET: Partial<Record<string, CollectionName>> = {
    'hero-selection': 'articles',
    'content-block': 'articles',
    'most-read': 'articles',
    'dossiers-strip': 'dossiers',
    essentials: 'guides',
    'lexique-spotlight': 'lexique',
  };
  graph.config.homepage.sections.forEach((section, i) => {
    const target = MANUAL_TARGET[section.type];
    if (target && 'manualSelection' in section) {
      for (const id of section.manualSelection) {
        if (!graph.get(target, id)) add(HOME, ['sections', i, 'manualSelection'], `« ${id} » n'existe pas dans ${label(target)}.`, 'relation');
      }
    }
    if (section.type === 'content-block') {
      const { category, format, themes, jurisdictions } = section.filters;
      if (category && !graph.get('categories', category)) add(HOME, ['sections', i, 'category'], `« ${category} » n'existe pas dans ${label('categories')}.`, 'relation');
      if (format && !graph.get('formats', format)) add(HOME, ['sections', i, 'format'], `« ${format} » n'existe pas dans ${label('formats')}.`, 'relation');
      for (const id of themes) if (!graph.get('themes', id)) add(HOME, ['sections', i, 'themes'], `« ${id} » n'existe pas dans ${label('themes')}.`, 'relation');
      for (const id of jurisdictions) if (!graph.get('juridictions', id)) add(HOME, ['sections', i, 'jurisdictions'], `« ${id} » n'existe pas dans ${label('juridictions')}.`, 'relation');
    }
    if (section.type === 'newsletter-cta' && !graph.config.newsletter.lists.some((l) => l.id === section.list)) {
      add(HOME, ['sections', i, 'list'], `La liste « ${section.list} » n'existe pas dans config/newsletter.json.`, 'relation');
    }
    if (section.type === 'partner-block' && section.enabled && !graph.config.ads.partners.some((p) => p.id === section.partnerId)) {
      add(HOME, ['sections', i, 'partnerId'], `Le partenaire « ${section.partnerId} » n'existe pas dans config/ads.json.`, 'relation');
    }
  });
  const VEILLE = 'config/sources-veille.json';
  graph.config.veilleSources.sources.forEach((source, i) => {
    if (source.organisme && !graph.get('organismes', source.organisme)) add(VEILLE, ['sources', i, 'organisme'], `« ${source.organisme} » n'existe pas dans ${label('organismes')}.`, 'relation');
    if (!graph.get('juridictions', source.jurisdiction)) add(VEILLE, ['sources', i, 'jurisdiction'], `« ${source.jurisdiction} » n'existe pas dans ${label('juridictions')}.`, 'relation');
  });
}
