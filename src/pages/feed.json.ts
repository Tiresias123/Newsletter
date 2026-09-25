// Flux JSON Feed 1.1 : le même contenu que /rss.xml.
import type { APIRoute } from 'astro';
import { getGraph } from '../lib/content/astro.ts';
import { feedItems, jsonFeed } from '../lib/seo/feeds.ts';

export const GET: APIRoute = async () => {
  const graph = await getGraph();
  const { site } = graph.config;
  const body = jsonFeed(graph, feedItems(graph), { title: site.name, description: site.description, feedPath: '/feed.json' });
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/feed+json; charset=utf-8' } });
};
