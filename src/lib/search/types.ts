// Contrat de la recherche (ARCHITECTURE, section 10) : l'interface ne connaît que SearchProvider, dont
// Pagefind est la première implémentation. Types partagés entre le build (données d'indexation) et le
// navigateur (interface de recherche).

// Types de contenu indexés, dans l'ordre d'affichage des groupes de résultats.
export const SEARCH_TYPES = ['dossiers', 'articles', 'guides', 'textes', 'traitements', 'organismes', 'juridictions', 'lexique', 'auteurs', 'newsletters', 'pages'] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

// Filtres indexés : valeurs en identifiants (stables), libellés fournis à l'interface à part.
export const FILTER_KEYS = ['type', 'categorie', 'theme', 'format', 'juridiction', 'annee'] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];
export type SearchFilters = Partial<Record<FilterKey, string>>;

export type SearchHit = { url: string; title: string; excerpt: string; date?: string; category?: string; image?: string };
export type SearchGroup = { type: string; total: number; hits: SearchHit[] };
export type SearchResponse = { total: number; groups: SearchGroup[] };

export interface SearchProvider {
  // Recherche groupée par type : `perGroup` résultats chargés par groupe.
  search(query: string, options: { filters: SearchFilters; perGroup: number }): Promise<SearchResponse>;
  // Résultats suivants d'un groupe (bouton « Afficher plus »).
  more(query: string, options: { filters: SearchFilters; type: string; offset: number; count: number }): Promise<SearchHit[]>;
}

// Libellés des valeurs de filtre (identifiant → libellé), calculés au build.
export type FilterLabels = Record<FilterKey, Record<string, string>>;
