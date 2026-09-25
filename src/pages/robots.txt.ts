// robots.txt : tout est ouvert aux moteurs en production, avec le plan du site ; un aperçu est fermé.
import type { APIRoute } from 'astro';
import { getConfig } from '../lib/config/index.ts';
import { isPreview } from '../lib/content/astro.ts';
import { absolute } from '../lib/seo/json-ld.ts';

export const GET: APIRoute = () => {
  const { site } = getConfig();
  const body = isPreview() ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n\nSitemap: ${absolute(site.url, '/sitemap-index.xml')}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
