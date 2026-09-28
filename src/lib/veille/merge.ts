// Fusion d'une collecte dans le cache de la veille (data/veille/cache.json) : dédoublonnage sur l'adresse
// canonique et sur une empreinte du titre, filtre par mots-clés, rétention, état de santé de chaque source.
// Le cache ne change que si une publication ou un état change : pas de commit inutile deux fois par jour.
import { createHash } from 'node:crypto';
import { addMonths, calendarDateInZone, daysBetween, isoInZone } from '../dates.ts';
import type { VeilleCache, VeilleItem, VeilleStatus } from '../content/veille.ts';
import { formatDate } from '../format.ts';
import type { FeedEntry } from './parse.ts';

export type VeilleSourceConfig = { id: string; organisme: string; jurisdiction: string; keywords: string[]; staleDays: number };
export type FetchOutcome = { status: 'ok'; entries: FeedEntry[] } | { status: Exclude<VeilleStatus, 'ok' | 'silencieux'>; detail: string };

const TRACKING = /^(?:utm_[a-z]+|fbclid|gclid|mc_[a-z]+)$/i;
const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export function canonicalUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = '';
  parsed.hostname = parsed.hostname.toLowerCase();
  for (const key of [...parsed.searchParams.keys()]) if (TRACKING.test(key)) parsed.searchParams.delete(key);
  return parsed.href;
}

export const itemId = (url: string) => createHash('sha256').update(canonicalUrl(url)).digest('hex').slice(0, 16);
const titleKey = (sourceId: string, title: string, publishedAt: string) => `${sourceId}|${fold(title)}|${publishedAt.slice(0, 10)}`;

// Mot-clé trouvé au début d'un mot, sans accents ni majuscules; chaque mot peut porter une finale
// (« actif numérique » trouve « actifs numériques »).
export function matchesKeywords(entry: FeedEntry, keywords: readonly string[]): boolean {
  if (keywords.length === 0) return true;
  const haystack = fold(`${entry.title} ${entry.summary}`);
  return keywords.some((keyword) => {
    const words = fold(keyword).split(' ').filter(Boolean);
    return words.length > 0 && new RegExp(`(?:^| )${words.join('[a-z0-9]* ')}`).test(haystack);
  });
}

export const emptyCache = (): VeilleCache => ({ updatedAt: null, sources: {}, items: [] });

// État d'une source après sa collecte. Un fil lisible dont la publication la plus récente, tous sujets
// confondus, dépasse le seuil d'alerte est « silencieux » (fil figé ou abandonné) : les mots-clés, qui peuvent
// ne rien retenir pendant des mois, n'entrent pas en compte. Un fil sans aucune date n'est pas jugé.
export function sourceState(source: Pick<VeilleSourceConfig, 'staleDays'>, outcome: FetchOutcome, now: Date, timeZone: string): { status: VeilleStatus; detail: string } {
  if (outcome.status !== 'ok') return { status: outcome.status, detail: outcome.detail };
  if (outcome.entries.length === 0) return { status: 'silencieux', detail: 'fil vide' };
  const dates = outcome.entries.map((e) => e.published?.getTime()).filter((t): t is number => t !== undefined && t <= now.getTime());
  if (dates.length === 0) return { status: 'ok', detail: '' };
  const latest = calendarDateInZone(new Date(Math.max(...dates)), timeZone);
  if (daysBetween(latest, calendarDateInZone(now, timeZone)) <= source.staleDays) return { status: 'ok', detail: '' };
  return { status: 'silencieux', detail: `dernière publication du fil le ${formatDate(latest)}` };
}

// Applique le résultat de la collecte d'une source; renvoie le nombre de publications ajoutées.
export function applyOutcome(cache: VeilleCache, source: VeilleSourceConfig, outcome: FetchOutcome, now: Date, timeZone: string, retentionMonths: number): number {
  const previous = cache.sources[source.id];
  const state = sourceState(source, outcome, now, timeZone);
  if (!previous || previous.status !== state.status || previous.detail !== state.detail) {
    cache.sources[source.id] = { status: state.status, since: isoInZone(now, timeZone), detail: state.detail };
  }
  if (outcome.status !== 'ok') return 0;
  const cutoff = addMonths(calendarDateInZone(now, timeZone), -retentionMonths);
  const ids = new Set(cache.items.map((i) => i.id));
  const titles = new Set(cache.items.map((i) => titleKey(i.sourceId, i.title, i.publishedAt)));
  let added = 0;
  for (const entry of outcome.entries) {
    if (!matchesKeywords(entry, source.keywords)) continue;
    // Sans date dans le fil : date de la première collecte.
    const publishedAt = isoInZone(entry.published && entry.published.getTime() <= now.getTime() ? entry.published : now, timeZone);
    if (publishedAt.slice(0, 10) < cutoff) continue;
    const item: VeilleItem = {
      id: itemId(entry.url),
      sourceId: source.id,
      title: entry.title,
      url: canonicalUrl(entry.url),
      organisme: source.organisme,
      jurisdiction: source.jurisdiction,
      publishedAt,
      summary: entry.summary,
    };
    const key = titleKey(item.sourceId, item.title, item.publishedAt);
    if (ids.has(item.id) || titles.has(key)) continue;
    ids.add(item.id);
    titles.add(key);
    cache.items.push(item);
    added += 1;
  }
  return added;
}

// Retire les publications trop anciennes et l'état des sources disparues de la configuration; trie.
export function prune(cache: VeilleCache, sourceIds: readonly string[], now: Date, timeZone: string, retentionMonths: number): void {
  const cutoff = addMonths(calendarDateInZone(now, timeZone), -retentionMonths);
  cache.items = cache.items.filter((i) => i.publishedAt.slice(0, 10) >= cutoff).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
  for (const id of Object.keys(cache.sources)) if (!sourceIds.includes(id)) delete cache.sources[id];
}

// Contenu du fichier : `updatedAt` ne bouge que si les publications ou les états ont changé.
export function serializeCache(before: VeilleCache, after: VeilleCache, now: Date, timeZone: string): { text: string; changed: boolean } {
  const strip = (c: VeilleCache) => JSON.stringify({ sources: c.sources, items: c.items });
  const changed = strip(before) !== strip(after);
  const result = { updatedAt: changed ? isoInZone(now, timeZone) : before.updatedAt, sources: after.sources, items: after.items };
  return { text: `${JSON.stringify(result, null, 2)}\n`, changed };
}
