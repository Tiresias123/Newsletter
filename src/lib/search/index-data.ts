// Données d'indexation d'une page (ARCHITECTURE, section 10) : type, filtres (juridiction, catégorie, thème,
// format, année), date de tri et métadonnées affichées dans les résultats. Calculées depuis le graphe.
import { calendarDateInZone } from '../dates.ts';
import type { Entry, Graph } from '../content/graph.ts';
import { t } from '../i18n.ts';
import type { FilterKey, FilterLabels, SearchType } from './types.ts';
import { SEARCH_TYPES } from './types.ts';

export type SearchData = {
  type: SearchType;
  filters: Partial<Record<Exclude<FilterKey, 'type' | 'annee'>, string[]>>;
  date?: string;
  category?: string;
};

export const typeLabel = (type: SearchType) => t(`search.types.${type}`);

function publicationDate(graph: Graph, entry: Entry): string | undefined {
  const instant = entry.visibility.instant;
  return instant ? calendarDateInZone(instant, graph.ctx.timezone) : undefined;
}

export function searchDataOf(graph: Graph, entry: Entry): SearchData | undefined {
  const fiscalite = graph.get('categories', 'fiscalite') ? ['fiscalite'] : [];
  switch (entry.collection) {
    case 'articles':
    case 'guides': {
      const d = (entry as Entry<'articles' | 'guides'>).data;
      const category = graph.get('categories', d.category);
      return {
        type: entry.collection,
        filters: { juridiction: d.jurisdictions, categorie: d.category ? [d.category] : [], theme: d.themes, format: [d.format] },
        date: publicationDate(graph, entry),
        category: category?.data.label,
      };
    }
    case 'dossiers': {
      const d = (entry as Entry<'dossiers'>).data;
      return { type: 'dossiers', filters: { juridiction: d.jurisdictions, theme: d.themes }, date: d.updatedAt ?? publicationDate(graph, entry) };
    }
    case 'juridictions':
      return { type: 'juridictions', filters: { juridiction: [entry.id] } };
    case 'organismes':
      return { type: 'organismes', filters: { juridiction: [(entry as Entry<'organismes'>).data.jurisdiction] } };
    case 'textes': {
      const d = (entry as Entry<'textes'>).data;
      return { type: 'textes', filters: { juridiction: [d.jurisdiction] }, date: d.adoptedAt };
    }
    case 'traitements': {
      const d = (entry as Entry<'traitements'>).data;
      return { type: 'traitements', filters: { juridiction: [d.jurisdiction], categorie: fiscalite }, date: d.updatedAt ?? d.asOf };
    }
    case 'lexique':
      return { type: 'lexique', filters: {} };
    case 'auteurs':
      return { type: 'auteurs', filters: {} };
    case 'newsletters':
      return { type: 'newsletters', filters: {}, date: (entry as Entry<'newsletters'>).data.sentAt };
    case 'pages':
      return { type: 'pages', filters: {} };
    default:
      return undefined;
  }
}

// Libellés des valeurs de filtre pour l'interface de recherche.
export function filterLabels(graph: Graph): FilterLabels {
  const byId = <T extends { id: string }>(entries: T[], label: (e: T) => string) => Object.fromEntries(entries.map((e) => [e.id, label(e)]));
  const byOrder = <T extends { data: { order: number } }>(a: T, b: T) => a.data.order - b.data.order;
  const years = new Set<string>();
  for (const collection of ['articles', 'guides', 'dossiers', 'textes', 'newsletters'] as const) {
    for (const entry of graph.listed(collection)) {
      const date = searchDataOf(graph, entry)?.date;
      if (date) years.add(date.slice(0, 4));
    }
  }
  return {
    type: Object.fromEntries(SEARCH_TYPES.map((type) => [type, typeLabel(type)])),
    categorie: byId(graph.all('categories').sort(byOrder), (e) => e.data.label),
    theme: byId(graph.all('themes').sort(byOrder), (e) => e.data.label),
    format: byId(graph.all('formats').sort(byOrder), (e) => e.data.label),
    juridiction: byId(graph.listed('juridictions').sort(byOrder), (e) => e.data.name),
    annee: Object.fromEntries([...years].sort().reverse().map((y) => [y, y])),
  };
}
