// Modèles de cartes : l'objet unique que reçoivent ArticleCard et les sections (brief, point 3.3).
import { calendarDateInZone } from '../dates.ts';
import type { Entry, Graph } from './graph.ts';

export type BadgeModel = { id: string; label: string; style: string; url?: string };

export type CardModel = {
  kind: 'article' | 'guide' | 'dossier';
  id: string;
  url: string;
  title: string;
  dek: string;
  cover?: { src: unknown; alt: string; credit: string };
  category?: BadgeModel;
  format?: { id: string; label: string };
  jurisdictions: BadgeModel[];
  author?: { id: string; name: string; url?: string; avatar?: unknown };
  // Date de publication (calendrier) et instant exact, pour la date relative.
  date?: string;
  instant?: string;
  readingTime: number;
  level?: string;
  duration?: number;
  legalStatus?: string;
  asOf?: string;
  breaking: boolean;
  preview?: 'brouillon' | 'programme';
};

function jurisdictionBadges(graph: Graph, ids: readonly string[]): BadgeModel[] {
  return ids.flatMap((id) => {
    const j = graph.get('juridictions', id);
    return j ? [{ id, label: j.data.name, style: j.data.badgeStyle, url: j.url }] : [];
  });
}

function previewState(entry: Entry): CardModel['preview'] {
  if (!entry.visibility.previewOnly) return undefined;
  return entry.visibility.state === 'programme' ? 'programme' : 'brouillon';
}

export function articleCard(graph: Graph, entry: Entry<'articles'> | Entry<'guides'>): CardModel {
  const d = entry.data;
  const category = graph.get('categories', d.category);
  const format = graph.get('formats', d.format);
  const author = graph.get('auteurs', d.author);
  const instant = entry.visibility.instant;
  return {
    kind: entry.collection === 'guides' ? 'guide' : 'article',
    id: entry.id,
    url: entry.url ?? '#',
    title: d.title,
    dek: d.dek,
    cover: d.cover?.src ? { src: d.cover.src, alt: d.cover.alt, credit: d.cover.credit } : undefined,
    category: category ? { id: category.id, label: category.data.label, style: category.data.badgeStyle, url: category.url } : undefined,
    format: format ? { id: format.id, label: format.data.label } : undefined,
    jurisdictions: jurisdictionBadges(graph, d.jurisdictions),
    author: author ? { id: author.id, name: author.data.name, url: author.url, avatar: author.data.avatar } : undefined,
    date: instant ? calendarDateInZone(instant, graph.ctx.timezone) : d.publishedAt,
    instant: instant?.toISOString(),
    readingTime: entry.readingTime,
    level: 'level' in d ? d.level : undefined,
    duration: 'level' in d ? (d.duration ?? entry.readingTime) : undefined,
    asOf: d.asOf,
    breaking: d.breaking,
    preview: previewState(entry),
  };
}

export function dossierCard(graph: Graph, entry: Entry<'dossiers'>): CardModel {
  const d = entry.data;
  return {
    kind: 'dossier',
    id: entry.id,
    url: entry.url ?? '#',
    title: d.title,
    dek: d.summary,
    cover: d.cover?.src ? { src: d.cover.src, alt: d.cover.alt, credit: d.cover.credit } : undefined,
    jurisdictions: jurisdictionBadges(graph, d.jurisdictions),
    date: d.updatedAt ?? d.publishedAt,
    readingTime: entry.readingTime,
    legalStatus: d.legalStatus,
    asOf: d.asOf,
    breaking: false,
    preview: previewState(entry),
  };
}
