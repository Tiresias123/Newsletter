// Options communes des flux RSS 2.0 (@astrojs/rss) : langue, liens absolus, résumé et étiquettes.
import type { RSSOptions } from '@astrojs/rss';
import type { Graph } from '../content/graph.ts';
import type { FeedItem } from './feeds.ts';

export function rssOptions(graph: Graph, feed: { title: string; description: string; items: FeedItem[] }): RSSOptions {
  return {
    title: feed.title,
    description: feed.description,
    site: graph.config.site.url,
    trailingSlash: true,
    customData: '<language>fr-ca</language>',
    items: feed.items.map((item) => ({ title: item.title, link: item.url, pubDate: item.published, description: item.summary, categories: item.tags })),
  };
}
