// Filet de sécurité des adresses (ARCHITECTURE, section 8.3) : à chaque build de production, les adresses du
// plan du site en ligne sont comparées à celles du site construit. Une adresse disparue sans redirection est
// signalée ; si le contenu existe encore en brouillon, la dépublication est voulue (simple information).
// Site injoignable ou plan absent (premier déploiement) : le contrôle est sauté, avec un avertissement.

export function sitemapLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => (m[1] ?? '').replace(/&amp;/g, '&'));
}

export async function fetchOnlineUrls(siteUrl: string, fetcher: typeof fetch = fetch, timeoutMs = 10_000): Promise<string[] | undefined> {
  const get = async (url: string) => {
    const response = await fetcher(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) throw new Error(String(response.status));
    return response.text();
  };
  try {
    const index = await get(new URL('/sitemap-index.xml', siteUrl).href);
    const pages = await Promise.all(sitemapLocs(index).map(async (sitemap) => sitemapLocs(await get(sitemap))));
    return pages.flat();
  } catch {
    return undefined;
  }
}

export type Vanished = { path: string; unpublished: boolean };

// Chemins en ligne absents du nouveau site et non redirigés ; `unpublished` : contenu encore présent en brouillon.
export function vanishedUrls(online: readonly string[], produced: ReadonlySet<string>, redirected: ReadonlySet<string>, drafts: ReadonlySet<string>): Vanished[] {
  return online
    .map((url) => new URL(url).pathname)
    .filter((path) => !produced.has(path) && !redirected.has(path))
    .map((path) => ({ path, unpublished: drafts.has(path) }));
}
