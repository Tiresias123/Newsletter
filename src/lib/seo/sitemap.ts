// Plan du site (ARCHITECTURE, section 13), tiré des pages construites elles-mêmes : une page n'y figure que si
// elle est indexable (balise robots sans « noindex ») et canonique (sa canonique pointe vers elle). La date de
// mise à jour vient des balises article:modified_time ou article:published_time.
export type SitemapEntry = { loc: string; lastmod?: string };

// Plafond de 50 000 adresses par fichier ; marge de sécurité.
export const SITEMAP_CHUNK = 45_000;

const attr = (html: string, pattern: RegExp) => pattern.exec(html)?.[1];
const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function sitemapEntry(html: string, pageUrl: string): SitemapEntry | undefined {
  const robots = attr(html, /<meta\s+name="robots"\s+content="([^"]*)"/i) ?? '';
  if (/noindex/i.test(robots)) return undefined;
  const canonical = attr(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);
  if (canonical && canonical !== pageUrl) return undefined;
  const time = attr(html, /<meta\s+property="article:modified_time"\s+content="([^"]*)"/i) ?? attr(html, /<meta\s+property="article:published_time"\s+content="([^"]*)"/i);
  return { loc: pageUrl, ...(time && { lastmod: time.slice(0, 10) }) };
}

export function renderSitemap(entries: readonly SitemapEntry[]): string {
  const urls = entries.map((e) => `  <url><loc>${escapeXml(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`);
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, '</urlset>', ''].join('\n');
}

export function renderSitemapIndex(sitemaps: readonly string[]): string {
  const items = sitemaps.map((loc) => `  <sitemap><loc>${escapeXml(loc)}</loc></sitemap>`);
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...items, '</sitemapindex>', ''].join('\n');
}
