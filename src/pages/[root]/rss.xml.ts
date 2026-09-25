// Flux RSS d'une catégorie : /[categorie]/rss.xml.
import rss from '@astrojs/rss';
import type { APIRoute, GetStaticPaths } from 'astro';
import { getGraph } from '../../lib/content/astro.ts';
import { t } from '../../lib/i18n.ts';
import { feedItems } from '../../lib/seo/feeds.ts';
import { rssOptions } from '../../lib/seo/rss.ts';

export const getStaticPaths = (async () => {
  const graph = await getGraph();
  return graph.all('categories').map((category) => ({ params: { root: category.id } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const graph = await getGraph();
  const category = graph.get('categories', params.root);
  if (!category) return new Response(null, { status: 404 });
  const { site } = graph.config;
  return rss(
    rssOptions(graph, {
      title: t('site.pageTitle', { title: category.data.label, site: site.name }),
      description: category.data.description,
      items: feedItems(graph, category.id),
    }),
  );
};
