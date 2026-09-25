// Implémentation Pagefind du contrat SearchProvider (ARCHITECTURE, section 10). L'index (/pagefind/) n'est
// chargé qu'à la première recherche. Une recherche globale donne le nombre de résultats par type ; chaque
// groupe est ensuite recherché à part, pour ne charger que ses premiers résultats.
import type { SearchFilters, SearchHit, SearchProvider } from './types.ts';
import { SEARCH_TYPES } from './types.ts';

type PagefindData = { url: string; excerpt: string; meta: Record<string, string | undefined> };
type PagefindResult = { id: string; data: () => Promise<PagefindData> };
type PagefindSearch = { results: PagefindResult[]; filters?: Record<string, Record<string, number>> };
type PagefindOptions = { filters?: Record<string, string>; sort?: Record<string, 'asc' | 'desc'> };
type PagefindApi = {
  options(options: Record<string, unknown>): Promise<void>;
  init(): Promise<void>;
  filters(): Promise<Record<string, Record<string, number>>>;
  preload(term: string, options?: PagefindOptions): Promise<void>;
  search(term: string | null, options?: PagefindOptions): Promise<PagefindSearch>;
};

// Chemin du paquet produit par « pagefind --site dist » : hors du graphe de Vite, chargé à la demande.
const BUNDLE = '/pagefind/pagefind.js';

const clean = (filters: SearchFilters) => Object.fromEntries(Object.entries(filters).filter(([, value]) => Boolean(value))) as Record<string, string>;

export function pagefindProvider(): SearchProvider & { preload(term: string): void } {
  let api: Promise<PagefindApi> | undefined;
  const load = () =>
    (api ??= (async () => {
      const pagefind = (await import(/* @vite-ignore */ BUNDLE)) as PagefindApi;
      await pagefind.options({ excerptLength: 24 });
      await pagefind.init();
      // Filtres chargés : chaque recherche renvoie alors le nombre de résultats par type.
      await pagefind.filters();
      return pagefind;
    })());

  // Sans mots-clés (filtres seuls, depuis un hub), les résultats sont triés du plus récent au plus ancien.
  const run = async (query: string, filters: SearchFilters) => {
    const pagefind = await load();
    const term = query.trim() || null;
    return pagefind.search(term, { filters: clean(filters), ...(term ? {} : { sort: { date: 'desc' as const } }) });
  };

  const toHit = async (result: PagefindResult): Promise<SearchHit> => {
    const data = await result.data();
    return { url: data.url, title: data.meta.title ?? data.url, excerpt: data.excerpt, date: data.meta.date, category: data.meta.categorie, image: data.meta.image };
  };

  return {
    preload(term) {
      void load().then((pagefind) => pagefind.preload(term));
    },
    async search(query, { filters, perGroup }) {
      const all = await run(query, filters);
      const counts = all.filters?.type ?? {};
      const types = SEARCH_TYPES.filter((type) => (counts[type] ?? 0) > 0 && (!filters.type || filters.type === type));
      const groups = await Promise.all(
        types.map(async (type) => {
          const found = filters.type === type ? all : await run(query, { ...filters, type });
          return { type, total: found.results.length, hits: await Promise.all(found.results.slice(0, perGroup).map(toHit)) };
        }),
      );
      return { total: all.results.length, groups };
    },
    async more(query, { filters, type, offset, count }) {
      const found = await run(query, { ...filters, type });
      return Promise.all(found.results.slice(offset, offset + count).map(toHit));
    },
  };
}
