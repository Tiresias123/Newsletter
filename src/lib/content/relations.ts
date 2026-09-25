// Relations calculées, jamais saisies (ARCHITECTURE, section 7.16) : articles d'un dossier, d'un organisme,
// d'une juridiction ; organismes d'une juridiction ; textes d'un émetteur ; agenda d'un dossier ; articles liés.
// Seuls les contenus listés (publiés, ou visibles en aperçu) sont retenus, du plus récent au plus ancien.
import { calendarDateInZone } from '../dates.ts';
import { tagSlug } from '../urls.ts';
import { findBlocks } from './blocks.ts';
import { byNewest, type Entry, type Graph } from './graph.ts';
import { veilleItems, type VeilleItem } from './veille.ts';

export type Editorial = Entry<'articles'> | Entry<'guides'>;
type Linkable = 'relatedDossiers' | 'relatedTextes' | 'relatedOrganismes' | 'relatedTraitements' | 'jurisdictions' | 'themes';

const DECISION_TYPES: readonly string[] = ['decision-administrative', 'decision-judiciaire'];
const byName = (a: string, b: string) => a.localeCompare(b, 'fr-CA');

// Articles et guides listés, du plus récent au plus ancien.
export function editorial(graph: Graph): Editorial[] {
  return [...graph.listed('articles'), ...graph.listed('guides')].sort(byNewest) as Editorial[];
}

// Articles et guides qui citent un contenu dans un champ de relation (ou un thème, une juridiction).
export function editorialAbout(graph: Graph, field: Linkable, id: string): Editorial[] {
  return editorial(graph).filter((e) => (e.data[field] as readonly string[]).includes(id));
}

export function editorialInCategory(graph: Graph, category: string): Editorial[] {
  return editorial(graph).filter((e) => e.data.category === category);
}

export function editorialTagged(graph: Graph, tag: string): Editorial[] {
  return editorial(graph).filter((e) => e.data.tags.includes(tag));
}

// Étiquettes des contenus listés, regroupées par segment d'adresse : le libellé tel que saisi la première fois
// et les contenus qui la portent (« Staking » et « staking » mènent à la même page).
export function tagIndex(graph: Graph): Map<string, { label: string; entries: Editorial[] }> {
  const index = new Map<string, { label: string; entries: Editorial[] }>();
  for (const entry of editorial(graph)) {
    for (const tag of entry.data.tags) {
      const slug = tagSlug(tag);
      if (!slug) continue;
      const item = index.get(slug) ?? { label: tag, entries: [] };
      if (!item.entries.includes(entry)) item.entries.push(entry);
      index.set(slug, item);
    }
  }
  return index;
}

export function editorialWithFormat(graph: Graph, format: string): Editorial[] {
  return editorial(graph).filter((e) => e.data.format === format);
}

export function editorialByAuthor(graph: Graph, author: string): Editorial[] {
  return editorial(graph).filter((e) => e.data.author === author);
}

// Articles liés (brief 7.2, étape 18), six au plus, sans doublon : sélection manuelle, même dossier,
// thèmes partagés (les plus nombreux d'abord), même catégorie ; du plus récent au plus ancien dans chaque groupe.
export function relatedEditorial(graph: Graph, entry: Editorial, max = 6): Editorial[] {
  const pool = editorial(graph).filter((e) => e !== entry);
  const picked: Editorial[] = [];
  const take = (candidates: Editorial[]) => {
    for (const candidate of candidates) {
      if (picked.length >= max) return;
      if (!picked.includes(candidate)) picked.push(candidate);
    }
  };
  take(entry.data.relatedArticles.flatMap((id) => pool.filter((e) => e.collection === 'articles' && e.id === id)));
  const dossiers = new Set(entry.data.relatedDossiers);
  take(pool.filter((e) => e.data.relatedDossiers.some((id) => dossiers.has(id))));
  const themes = new Set(entry.data.themes);
  const shared = (e: Editorial) => e.data.themes.filter((id) => themes.has(id)).length;
  take(pool.filter((e) => shared(e) > 0).sort((a, b) => shared(b) - shared(a) || byNewest(a, b)));
  if (entry.data.category) take(pool.filter((e) => e.data.category === entry.data.category));
  return picked;
}

export function organismesOf(graph: Graph, jurisdiction: string): Entry<'organismes'>[] {
  return graph.listed('organismes').filter((e) => e.data.jurisdiction === jurisdiction).sort((a, b) => byName(a.data.name, b.data.name));
}

// Textes d'un émetteur, du plus récent au plus ancien (date d'adoption ou de décision).
export function textesOf(graph: Graph, issuer: string): Entry<'textes'>[] {
  return graph
    .listed('textes')
    .filter((e) => e.data.issuer === issuer)
    .sort((a, b) => (b.data.adoptedAt ?? '').localeCompare(a.data.adoptedAt ?? '') || byName(a.data.title, b.data.title));
}

export function decisionsOf(graph: Graph, issuer: string): Entry<'textes'>[] {
  return textesOf(graph, issuer).filter((e) => DECISION_TYPES.includes(e.data.type));
}

// Dossiers d'une juridiction ou d'une autorité, la sélection éditoriale (« dossiers clés ») en tête.
export function dossiersOf(graph: Graph, filter: { jurisdiction?: string; authority?: string }, first: readonly string[] = []): Entry<'dossiers'>[] {
  const matching = graph
    .listed('dossiers')
    .filter((e) => (!filter.jurisdiction || e.data.jurisdictions.includes(filter.jurisdiction)) && (!filter.authority || e.data.authorities.includes(filter.authority)));
  return [...matching.filter((e) => first.includes(e.id)), ...matching.filter((e) => !first.includes(e.id))];
}

// Dossiers qui retiennent un texte parmi leurs textes clés.
export function dossiersCiting(graph: Graph, texte: string): Entry<'dossiers'>[] {
  return graph.listed('dossiers').filter((e) => e.data.keyTextes.includes(texte));
}

export function traitementsOf(graph: Graph, jurisdiction: string, first: readonly string[] = []): Entry<'traitements'>[] {
  const matching = graph.listed('traitements').filter((e) => e.data.jurisdiction === jurisdiction);
  return [...matching.filter((e) => first.includes(e.id)), ...matching.filter((e) => !first.includes(e.id))];
}

export function childJuridictions(graph: Graph, parent: string): Entry<'juridictions'>[] {
  return graph
    .listed('juridictions')
    .filter((e) => e.data.parent === parent)
    .sort((a, b) => a.data.order - b.data.order || byName(a.data.name, b.data.name));
}

// Échéances à venir (ou en cours), de la plus proche à la plus lointaine.
export function upcomingAgenda(graph: Graph, filter: { dossier?: string; jurisdiction?: string } = {}): Entry<'agenda'>[] {
  const today = calendarDateInZone(graph.ctx.now, graph.ctx.timezone);
  return graph
    .listed('agenda')
    .filter((e) => (e.data.endDate ?? e.data.date) >= today)
    .filter((e) => (!filter.dossier || e.data.relatedDossier === filter.dossier) && (!filter.jurisdiction || e.data.jurisdiction === filter.jurisdiction))
    .sort((a, b) => a.data.date.localeCompare(b.data.date) || (a.data.time ?? '').localeCompare(b.data.time ?? ''));
}

export function veilleOf(organisme: string): VeilleItem[] {
  return veilleItems().filter((item) => item.organisme === organisme);
}

// Contenus qui emploient un terme du lexique par le bloc Definition (calcul mis en cache pour le graphe).
type TermUser = Editorial | Entry<'dossiers'>;
const usage = new WeakMap<Graph, Map<string, TermUser[]>>();
export function entriesUsingTerm(graph: Graph, term: string): TermUser[] {
  let byTerm = usage.get(graph);
  if (!byTerm) {
    byTerm = new Map();
    for (const entry of [...editorial(graph), ...graph.listed('dossiers')]) {
      for (const block of findBlocks(entry.body)) {
        const id = block.name === 'Definition' ? block.props.term : undefined;
        if (typeof id !== 'string') continue;
        const list = byTerm.get(id) ?? [];
        if (!list.includes(entry)) list.push(entry);
        byTerm.set(id, list);
      }
    }
    usage.set(graph, byTerm);
  }
  return byTerm.get(term) ?? [];
}
