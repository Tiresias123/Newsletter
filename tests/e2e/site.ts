// Pages et termes des parcours de fumée, tirés du contenu tel que la construction d'aperçu le publie (brouillons
// compris) : les parcours ne visent aucun contenu particulier, que l'auteur peut renommer ou supprimer.
import { fileURLToPath } from 'node:url';
import { loadContent } from '../../src/lib/check/load.ts';
import { getConfig } from '../../src/lib/config/index.ts';
import { hubUrl } from '../../src/lib/content/breadcrumbs.ts';
import type { CollectionName } from '../../src/lib/content/collections.ts';
import { buildGraph, type Entry } from '../../src/lib/content/graph.ts';
import { tagIndex } from '../../src/lib/content/relations.ts';
import { url } from '../../src/lib/urls.ts';

const root = fileURLToPath(new URL('../..', import.meta.url));
const config = getConfig();
const graph = buildGraph(loadContent(root).raw, config, { now: new Date(), includeDrafts: true, timezone: config.site.timezone });

const visible = (collection: CollectionName): Entry[] => graph.all(collection).filter((e) => e.visibility.visible && e.url);
// Entrée au plus long corps : celle qui montre le plus de blocs.
const richest = (collection: CollectionName) => visible(collection).sort((a, b) => b.body.length - a.body.length || a.id.localeCompare(b.id))[0];
const first = (collection: CollectionName) => visible(collection).sort((a, b) => a.id.localeCompare(b.id))[0];

const HUBS = ['articles', 'dossiers', 'guides', 'juridictions', 'organismes', 'textes', 'traitements', 'lexique', 'agenda', 'veille', 'auteurs', 'newsletter', 'recherche'] as const;
const FICHES: CollectionName[] = ['articles', 'guides', 'dossiers', 'juridictions', 'organismes', 'textes', 'traitements', 'lexique', 'auteurs', 'newsletters'];
const [firstTag] = [...tagIndex(graph).values()].map((tag) => tag.label).sort();

// Accueil, rubriques et pages fixes; l'entrée la plus fournie de chaque collection; une catégorie, un thème,
// un format, une étiquette; les pages Contact et Confidentialité, qui portent des blocs propres.
export const PAGES = [
  ...new Set(
    [
      '/',
      ...HUBS.map((hub) => hubUrl(hub)),
      '/newsletter/confirmation/',
      ...FICHES.map((collection) => richest(collection)?.url),
      first('categories')?.url,
      first('themes')?.url,
      first('formats')?.url,
      firstTag === undefined ? undefined : url.tag(firstTag),
      ...['contact', 'confidentialite'].map((id) => visible('pages').find((page) => page.id === id)?.url),
    ].filter((path): path is string => path !== undefined),
  ),
];

// Terme de recherche : le mot le plus long du titre de l'article le plus fourni, présent dans l'index.
export const SEARCH_TERM = String((richest('articles')?.data as { title?: string } | undefined)?.title ?? '')
  .split(/[^\p{L}\p{N}]+/u)
  .reduce((longest, word) => (word.length > longest.length ? word : longest), '');
