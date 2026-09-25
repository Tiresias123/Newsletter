// Flux de syndication (ARCHITECTURE, section 13) : les 20 derniers contenus (articles et guides), en résumé
// avec lien, car le texte intégral ne rendrait pas les blocs MDX. Un flux général, un par catégorie, et le
// même contenu en JSON Feed 1.1.
import type { Graph } from '../content/graph.ts';
import { editorial, editorialInCategory, type Editorial } from '../content/relations.ts';
import { absolute } from './json-ld.ts';
import { ogImagePath } from './meta.ts';

export const FEED_SIZE = 20;

export type FeedItem = {
  url: string;
  title: string;
  summary: string;
  published: Date;
  modified?: Date;
  tags: string[];
  author?: { name: string; url?: string };
  image: string;
};

function itemOf(graph: Graph, entry: Editorial): FeedItem {
  const d = entry.data;
  const siteUrl = graph.config.site.url;
  const author = graph.get('auteurs', d.author);
  const labels = [graph.get('categories', d.category)?.data.label, ...d.themes.map((id) => graph.get('themes', id)?.data.label)];
  return {
    url: absolute(siteUrl, entry.url ?? '/'),
    title: d.title,
    summary: d.dek,
    published: entry.visibility.instant ?? new Date(`${d.publishedAt}T12:00:00Z`),
    modified: d.updatedAt ? new Date(`${d.updatedAt}T12:00:00Z`) : undefined,
    tags: labels.filter((label): label is string => Boolean(label)),
    author: author && { name: author.data.name, url: author.visibility.visible && author.url ? absolute(siteUrl, author.url) : undefined },
    image: absolute(siteUrl, ogImagePath(entry.url ?? '/')),
  };
}

export function feedItems(graph: Graph, category?: string): FeedItem[] {
  const entries = category ? editorialInCategory(graph, category) : editorial(graph);
  return entries.slice(0, FEED_SIZE).map((entry) => itemOf(graph, entry));
}

// JSON Feed 1.1 (https://jsonfeed.org/version/1.1).
export function jsonFeed(graph: Graph, items: FeedItem[], options: { title: string; description: string; feedPath: string }) {
  const siteUrl = graph.config.site.url;
  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: options.title,
    home_page_url: absolute(siteUrl, '/'),
    feed_url: absolute(siteUrl, options.feedPath),
    description: options.description,
    language: 'fr-CA',
    items: items.map((item) => ({
      id: item.url,
      url: item.url,
      title: item.title,
      summary: item.summary,
      content_text: item.summary,
      image: item.image,
      date_published: item.published.toISOString(),
      ...(item.modified && { date_modified: item.modified.toISOString() }),
      ...(item.tags.length > 0 && { tags: item.tags }),
      ...(item.author && { authors: [{ name: item.author.name, ...(item.author.url && { url: item.author.url }) }] }),
    })),
  };
}
