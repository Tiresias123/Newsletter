// Flux RSS général : les 20 derniers articles et guides.
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getGraph } from '../lib/content/astro.ts';
import { rssOptions } from '../lib/seo/rss.ts';
import { feedItems } from '../lib/seo/feeds.ts';

export const GET: APIRoute = async () => {
  const graph = await getGraph();
  const { site } = graph.config;
  return rss(rssOptions(graph, { title: site.name, description: site.description, items: feedItems(graph) }));
};
