// Choix des contenus de chaque section de l'accueil (config/homepage.json). Fonctions pures, testables.
import type { HomepageSection } from '../config/schemas.ts';
import { calendarDateInZone, daysBetween, type CalendarDate } from '../dates.ts';
import { articleCard, dossierCard, jurisdictionBadges, veilleOrigin, type BadgeModel, type CardModel } from './cards.ts';
import type { Entry, Graph } from './graph.ts';
import { veilleItems, type VeilleItem } from './veille.ts';

type Section<T extends HomepageSection['type']> = Extract<HomepageSection, { type: T }>;
type Pickable = 'articles' | 'guides' | 'dossiers' | 'lexique';

// Sélection manuelle : seuls les contenus existants et publiés sont retenus, dans l'ordre choisi.
function manual<C extends Pickable>(graph: Graph, collection: C, ids: readonly string[]): Entry<C>[] {
  return ids.flatMap((id) => {
    const entry = graph.get(collection, id);
    return entry && entry.visibility.listed ? [entry] : [];
  });
}

const featuredFirst = <E extends Entry>(entries: E[], isFeatured: (e: E) => boolean) => [
  ...entries.filter(isFeatured),
  ...entries.filter((e) => !isFeatured(e)),
];

export function heroItems(graph: Graph, section: Section<'hero-selection'>): CardModel[] {
  const entries =
    section.source === 'manual'
      ? manual(graph, 'articles', section.manualSelection)
      : featuredFirst(graph.listed('articles'), (e) => e.data.editorsPick);
  return entries.slice(0, 5).map((e) => articleCard(graph, e));
}

export function contentBlockItems(graph: Graph, section: Section<'content-block'>): CardModel[] {
  const { category, format, themes, jurisdictions, tags } = section.filters;
  const entries =
    section.source === 'manual'
      ? manual(graph, 'articles', section.manualSelection)
      : graph.listed('articles').filter(
          ({ data }) =>
            (!category || data.category === category) &&
            (!format || data.format === format) &&
            (themes.length === 0 || themes.some((t) => data.themes.includes(t))) &&
            (jurisdictions.length === 0 || jurisdictions.some((j) => data.jurisdictions.includes(j))) &&
            (tags.length === 0 || tags.some((t) => data.tags.includes(t.toLowerCase()))),
        );
  return entries.slice(0, section.count).map((e) => articleCard(graph, e));
}

const dossierDate = (e: Entry<'dossiers'>) => e.data.updatedAt ?? e.data.publishedAt ?? '';

export function dossierItems(graph: Graph, section: Section<'dossiers-strip'>): CardModel[] {
  const auto = [...graph.listed('dossiers')].sort((a, b) => dossierDate(b).localeCompare(dossierDate(a)));
  const entries = section.source === 'manual' ? manual(graph, 'dossiers', section.manualSelection) : featuredFirst(auto, (e) => e.data.featured);
  return entries.slice(0, section.count).map((e) => dossierCard(graph, e));
}

export function essentialItems(graph: Graph, section: Section<'essentials'>): CardModel[] {
  const entries = section.source === 'manual' ? manual(graph, 'guides', section.manualSelection) : featuredFirst(graph.listed('guides'), (e) => e.data.featured);
  return entries.slice(0, section.count).map((e) => articleCard(graph, e));
}

export type AgendaItem = {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  time?: string;
  type: string;
  url?: string;
  jurisdiction?: BadgeModel;
};

export function watchlistItems(
  graph: Graph,
  section: Section<'watchlist'>,
): { agenda: AgendaItem[]; consultations: CardModel[]; today: CalendarDate } {
  const today = calendarDateInZone(graph.ctx.now, graph.ctx.timezone);
  const agenda = graph
    .listed('agenda')
    .filter((e) => (e.data.endDate ?? e.data.date) >= today)
    .sort((a, b) => a.data.date.localeCompare(b.data.date))
    .slice(0, section.count)
    .map((e): AgendaItem => {
      const dossier = graph.get('dossiers', e.data.relatedDossier);
      return {
        id: e.id,
        title: e.data.title,
        date: e.data.date,
        endDate: e.data.endDate,
        time: e.data.time,
        type: e.data.type,
        url: dossier?.visibility.listed ? dossier.url : e.data.url,
        jurisdiction: jurisdictionBadges(graph, [e.data.jurisdiction])[0],
      };
    });
  const consultations = graph
    .listed('dossiers')
    .filter((e) => e.data.legalStatus === 'consultation')
    .slice(0, 3)
    .map((e) => dossierCard(graph, e));
  return { agenda, consultations, today };
}

export type LexiqueItem = { id: string; term: string; definition: string; url?: string };

export function lexiqueItems(graph: Graph, section: Section<'lexique-spotlight'>): LexiqueItem[] {
  let entries = section.source === 'manual' ? manual(graph, 'lexique', section.manualSelection) : [...graph.listed('lexique')].sort((a, b) => a.id.localeCompare(b.id));
  if (section.source === 'auto' && entries.length > section.count) {
    // Rotation quotidienne, stable pendant la journée (la reconstruction nocturne la fait avancer).
    const day = daysBetween('2026-01-01', calendarDateInZone(graph.ctx.now, graph.ctx.timezone));
    const start = ((day % entries.length) + entries.length) % entries.length;
    entries = [...entries.slice(start), ...entries.slice(0, start)];
  }
  return entries.slice(0, section.count).map((e) => ({ id: e.id, term: e.data.term, definition: e.data.shortDefinition, url: e.url }));
}

export function mostReadItems(graph: Graph, section: Section<'most-read'>): CardModel[] {
  return manual(graph, 'articles', section.manualSelection)
    .slice(0, section.count)
    .map((e) => articleCard(graph, e));
}

export function veilleLatestItems(graph: Graph, section: Section<'veille-latest'>): Array<VeilleItem & { organismeLabel: string }> {
  return veilleItems()
    .slice(0, section.count)
    .map((item) => ({ ...item, organismeLabel: veilleOrigin(graph, item).label }));
}
