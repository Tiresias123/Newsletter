// Liens d'un contenu : extraction (corps MDX, champs d'adresse) et résolution des adresses internes
// d'après la table des routes (ARCHITECTURE 8.2), que la page soit déjà construite ou prévue plus tard.
import messages from '../../../config/i18n/fr.json' with { type: 'json' };
import { hideCode } from '../content/blocks.ts';
import type { CollectionName } from '../content/collections.ts';
import type { Graph } from '../content/graph.ts';

export type FoundLink = { href: string; line?: number; path?: PropertyKey[] };
export type FoundImage = { src: string; alt: string; line: number };
export type PathStatus = { ok: true } | { ok: false; unpublished: boolean; message: string };

// Clés des données qui portent une adresse interne (menus, agenda, chronologies, appels à l'action).
const LINK_KEYS = new Set(['url', 'href', 'link', 'linkUrl']);
// Fichiers produits au build.
const FILES = new Set(['/rss.xml', '/feed.json', '/sitemap-index.xml', '/robots.txt', '/agenda.ics', '/favicon.svg']);
// Premier segment → collection dont chaque entrée a sa page (/dossiers/ puis /dossiers/[slug]/).
const HUBS: Record<string, CollectionName> = {
  articles: 'articles',
  dossiers: 'dossiers',
  guides: 'guides',
  juridictions: 'juridictions',
  organismes: 'organismes',
  textes: 'textes',
  lexique: 'lexique',
  auteurs: 'auteurs',
  newsletter: 'newsletters',
};
// Listes sans page d'index (/themes/[theme]/).
const LISTS: Record<string, CollectionName> = { themes: 'themes', formats: 'formats' };
const SINGLE_PAGES = new Set(['veille', 'agenda', 'recherche']);
const DEV_ONLY = new Set(['a-verifier', 'exemple']);
const COLLECTION_LABELS: Record<string, string> = messages.collections;

const OK: PathStatus = { ok: true };
const broken = (message: string): PathStatus => ({ ok: false, unpublished: false, message });
const isPageNumber = (rest: string[]) => rest.length === 1 && /^[1-9]\d*$/.test(rest[0] ?? '') && Number(rest[0]) >= 2;

function target(graph: Graph, collection: CollectionName, id: string): PathStatus {
  const entry = graph.get(collection, id);
  if (!entry) return broken(`« ${id} » n'existe pas dans la collection « ${COLLECTION_LABELS[collection] ?? collection} ».`);
  if (!entry.visibility.visible) return { ok: false, unpublished: true, message: `« ${id} » n'est pas publié : la page est absente du site public.` };
  return OK;
}

export function resolveInternalPath(href: string, graph: Graph): PathStatus {
  const path = href.split(/[?#]/)[0] || '/';
  if (FILES.has(path)) return OK;
  const segments = path.split('/').filter(Boolean);
  const [first = '', second, ...rest] = segments;
  if (/\.[a-z0-9]+$/i.test(path)) {
    return segments.length === 2 && second === 'rss.xml' && graph.get('categories', first) ? OK : broken('Fichier inconnu du site.');
  }
  if (!path.endsWith('/')) return broken(`Barre oblique finale manquante : écrivez « ${path}/ ».`);
  if (segments.length === 0) return OK;
  const unknown = broken('Adresse inconnue du site.');
  if (first === 'en') return broken("La version anglaise du site n'existe pas encore.");
  if (DEV_ONLY.has(first)) return broken("Cette page n'existe qu'en développement.");
  if (first === 'fiscalite' && second === 'traitements') {
    if (rest.length === 0) return OK;
    return rest.length === 1 ? target(graph, 'traitements', rest[0] ?? '') : unknown;
  }
  const hub = HUBS[first];
  if (hub) {
    if (second === undefined) return OK;
    if (first === 'articles' && second === 'page') return isPageNumber(rest) ? OK : unknown;
    return rest.length === 0 ? target(graph, hub, second) : unknown;
  }
  const list = LISTS[first];
  if (list) return second !== undefined && rest.length === 0 ? target(graph, list, second) : unknown;
  if (first === 'tags') return second !== undefined && rest.length === 0 ? tagTarget(graph, decodeURIComponent(second)) : unknown;
  if (SINGLE_PAGES.has(first)) return second === undefined ? OK : unknown;
  // Racine partagée : hub de catégorie (et ses pages suivantes) ou page statique.
  if (graph.get('categories', first)) return second === undefined || (second === 'page' && isPageNumber(rest)) ? OK : unknown;
  if (second === undefined && graph.get('pages', first)) return target(graph, 'pages', first);
  return unknown;
}

function tagTarget(graph: Graph, tag: string): PathStatus {
  const tagged = [...graph.all('articles'), ...graph.all('guides')].filter((e) => e.data.tags.includes(tag));
  if (tagged.length === 0) return broken(`Aucun contenu ne porte l'étiquette « ${tag} ».`);
  if (!tagged.some((e) => e.visibility.visible)) return { ok: false, unpublished: true, message: `Aucun contenu publié ne porte l'étiquette « ${tag} ».` };
  return OK;
}

const lineOf = (text: string, index: number) => text.slice(0, index).split('\n').length;

// Liens et images du corps : Markdown ([texte](adresse), ![alt](image), [renvoi]: adresse), href des blocs, <https://…>.
export function bodyLinks(body: string): { links: FoundLink[]; images: FoundImage[] } {
  const text = hideCode(body);
  const links: FoundLink[] = [];
  const images: FoundImage[] = [];
  for (const m of text.matchAll(/(!?)\[([^\]]*)\]\(\s*<?([^\s>)]+)>?(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g)) {
    const line = lineOf(text, m.index);
    if (m[1]) images.push({ alt: (m[2] ?? '').trim(), src: m[3] ?? '', line });
    else links.push({ href: m[3] ?? '', line });
  }
  for (const m of text.matchAll(/^ {0,3}\[[^\]]+\]:[ \t]*<?([^\s>]+)>?/gm)) links.push({ href: m[1] ?? '', line: lineOf(text, m.index) });
  for (const m of text.matchAll(/\bhref=(?:"([^"]*)"|'([^']*)'|\{\s*(["'`])(.*?)\3\s*\})/g)) {
    links.push({ href: m[1] ?? m[2] ?? m[4] ?? '', line: lineOf(text, m.index) });
  }
  for (const m of text.matchAll(/<(https?:\/\/[^\s>]+)>/g)) links.push({ href: m[1] ?? '', line: lineOf(text, m.index) });
  return { links, images };
}

// Adresses saisies dans des données : internes sous les clés d'adresse, externes sous toutes les clés.
export function fieldLinks(value: unknown, path: PropertyKey[] = []): FoundLink[] {
  if (typeof value === 'string') {
    const key = path.at(-1);
    const internal = value.startsWith('/') && typeof key === 'string' && LINK_KEYS.has(key);
    return internal || /^https?:\/\//.test(value) ? [{ href: value, path }] : [];
  }
  if (Array.isArray(value)) return value.flatMap((item, i) => fieldLinks(item, [...path, i]));
  if (typeof value === 'object' && value !== null) return Object.entries(value).flatMap(([key, item]) => fieldLinks(item, [...path, key]));
  return [];
}
