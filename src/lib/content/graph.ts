// Graphe de contenu : charge toutes les collections une fois, résout les relations, calcule
// adresses, temps de lecture et visibilité. Les pages ne font que lire ce graphe (ARCHITECTURE, section 9).
import type { SiteConfig } from '../config/index.ts';
import type { ValidationProblem } from '../errors.ts';
import { entryUrl } from '../urls.ts';
import { visibilityOf, type Visibility, type VisibilityContext } from '../visibility.ts';
import { COLLECTION_NAMES, type CollectionData, type CollectionName } from './collections.ts';
import type { CitedSource } from './fields.ts';
import { checkGraph } from './rules.ts';

export type RawEntry = { id: string; data: unknown; body?: string; filePath?: string };
export type RawCollections = Record<CollectionName, RawEntry[]>;

export type Entry<C extends CollectionName = CollectionName> = {
  collection: C;
  id: string;
  data: CollectionData<C>;
  body: string;
  file: string;
  url?: string;
  visibility: Visibility;
  wordCount: number;
  readingTime: number;
};

export type Severity = 'bloquant' | 'avertissement' | 'information';
export type GraphProblem = ValidationProblem & { severity: Severity; rule: string };

export type Graph = {
  config: SiteConfig;
  ctx: VisibilityContext;
  get<C extends CollectionName>(collection: C, id: string | undefined): Entry<C> | undefined;
  all<C extends CollectionName>(collection: C): Entry<C>[];
  listed<C extends CollectionName>(collection: C): Entry<C>[];
  isOfficial(source: CitedSource): boolean;
  problems: GraphProblem[];
};

const WORDS_PER_MINUTE = 200;

// Mots lisibles d'un corps MDX : balises de composants, liens et syntaxe Markdown retirés.
export function countWords(body: string): number {
  const text = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|~-]+/g, ' ');
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

type Publishable = { status: string; publishedAt?: string; publishedTime?: string };

// Données de publication d'une entrée : une infolettre « envoyée » est publiée à sa date d'envoi ;
// les collections sans statut (sources, auteurs, taxonomies) sont toujours visibles.
function publication(collection: CollectionName, data: unknown): Publishable | undefined {
  if (typeof data !== 'object' || data === null || !('status' in data)) return undefined;
  if (collection !== 'newsletters') return data as Publishable;
  const { status, sentAt } = data as { status: string; sentAt?: string };
  return { status: status === 'envoye' ? 'publie' : 'brouillon', publishedAt: sentAt };
}

// Tri par date de publication décroissante, puis par identifiant (ordre stable).
export function byNewest(a: Entry, b: Entry): number {
  const ta = a.visibility.instant?.getTime() ?? 0;
  const tb = b.visibility.instant?.getTime() ?? 0;
  return tb - ta || a.id.localeCompare(b.id);
}

export function buildGraph(raw: RawCollections, config: SiteConfig, ctx: VisibilityContext): Graph {
  const store = new Map<CollectionName, Map<string, Entry>>();
  for (const collection of COLLECTION_NAMES) {
    const entries = new Map<string, Entry>();
    for (const item of raw[collection] ?? []) {
      const body = item.body ?? '';
      const wordCount = countWords(body);
      const published = publication(collection, item.data);
      const visibility: Visibility = published
        ? visibilityOf(published, ctx)
        : { state: 'publie', visible: true, listed: true, previewOnly: false };
      entries.set(item.id, {
        collection,
        id: item.id,
        data: item.data as CollectionData<typeof collection>,
        body,
        file: item.filePath ?? `${collection}/${item.id}`,
        url: entryUrl(collection, item.id),
        visibility,
        wordCount,
        readingTime: Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE)),
      });
    }
    store.set(collection, entries);
  }

  const officialTypes = new Set<string>(config.legal.officialSourceTypes);

  const graph: Graph = {
    config,
    ctx,
    get: (collection, id) => (id ? (store.get(collection)?.get(id) as Entry<typeof collection> | undefined) : undefined),
    all: (collection) => [...(store.get(collection)?.values() ?? [])] as Entry<typeof collection>[],
    listed: (collection) =>
      ([...(store.get(collection)?.values() ?? [])].filter((e) => e.visibility.listed) as Entry<typeof collection>[]).sort(byNewest),
    // Une source est officielle selon son type (config/legal.json) ; un communiqué l'est s'il émane d'un organisme de la base.
    isOfficial(source) {
      if (source.kind === 'ponctuelle') return officialTypes.has(source.type);
      const entry = graph.get('sources', source.source);
      if (!entry) return false;
      if (officialTypes.has(entry.data.sourceType)) return true;
      return entry.data.sourceType === 'communique' && config.legal.communiqueFromOrganismeIsOfficial && graph.get('organismes', entry.data.issuer) !== undefined;
    },
    problems: [],
  };
  graph.problems = checkGraph(graph);
  return graph;
}
