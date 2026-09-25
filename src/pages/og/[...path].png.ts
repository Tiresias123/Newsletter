// Images Open Graph générées au build : /og/accueil.png et une image par page de contenu (/og/<adresse>.png).
import type { APIRoute, GetStaticPaths } from 'astro';
import { getGraph } from '../../lib/content/astro.ts';
import { ogCards } from '../../lib/seo/og-cards.ts';
import { renderOgImage, type OgCard } from '../../lib/seo/og-image.ts';

export const getStaticPaths = (async () => {
  const graph = await getGraph();
  return ogCards(graph).map(({ path, card }) => ({ params: { path }, props: { card } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const image = await renderOgImage((props as { card: OgCard }).card);
  return new Response(new Uint8Array(image), { headers: { 'Content-Type': 'image/png' } });
};
