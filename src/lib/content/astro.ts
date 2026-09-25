// Côté Astro : charge les collections et construit le graphe (une fois par build, à chaque requête en développement).
import { getCollection, getEntry, render } from 'astro:content';
import { getConfig } from '../config/index.ts';
import { ContentValidationError } from '../errors.ts';
import type { VisibilityContext } from '../visibility.ts';
import { COLLECTION_NAMES, type CollectionName } from './collections.ts';
import { buildGraph, type Graph, type RawCollections } from './graph.ts';

// Aperçu (développement ou build de branche avec SITE_MODE=preview) : brouillons visibles, pages en noindex.
export function isPreview(): boolean {
  return import.meta.env.DEV || process.env.SITE_MODE === 'preview';
}

export function visibilityContext(): VisibilityContext {
  return { now: new Date(), includeDrafts: isPreview(), timezone: getConfig().site.timezone };
}

let cached: Promise<Graph> | undefined;

async function load(): Promise<Graph> {
  const pairs = await Promise.all(
    COLLECTION_NAMES.map(async (name) => {
      const entries = await getCollection(name);
      return [name, entries.map((e) => ({ id: e.id, data: e.data, body: e.body, filePath: e.filePath }))] as const;
    }),
  );
  const graph = buildGraph(Object.fromEntries(pairs) as RawCollections, getConfig(), visibilityContext());
  const blocking = graph.problems.filter((p) => p.severity === 'bloquant');
  if (blocking.length > 0) throw new ContentValidationError('Le contenu contient des erreurs à corriger :', blocking);
  return graph;
}

export function getGraph(): Promise<Graph> {
  if (import.meta.env.DEV) return load();
  cached ??= load();
  return cached;
}

// Corps MDX d'une entrée, prêt à afficher, avec ses titres (sommaire) ; les blocs sont ceux de src/components/mdx.
export async function renderEntry(collection: CollectionName, id: string) {
  const entry = await getEntry(collection, id);
  if (!entry) throw new Error(`Contenu introuvable : ${collection}/${id}.`);
  return render(entry);
}
