// Intégration Astro : écrit sitemap-index.xml et sitemap-0.xml (1, 2… au-delà de 45 000 adresses) à la fin du
// build, à partir des fichiers HTML produits (voir sitemap.ts).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { renderSitemap, renderSitemapIndex, SITEMAP_CHUNK, sitemapEntry, type SitemapEntry } from './sitemap.ts';

export function sitemap(): AstroIntegration {
  let site = '';
  return {
    name: 'plan-du-site',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = config.site ?? '';
      },
      'astro:build:done': ({ dir, pages, logger }) => {
        const root = fileURLToPath(dir);
        const entries: SitemapEntry[] = [];
        for (const { pathname } of pages) {
          const file = `${root}${pathname}index.html`;
          if (!existsSync(file)) continue;
          const entry = sitemapEntry(readFileSync(file, 'utf8'), new URL(`/${pathname}`, site).href);
          if (entry) entries.push(entry);
        }
        entries.sort((a, b) => a.loc.localeCompare(b.loc));
        const files: string[] = [];
        for (let i = 0; i === 0 || i * SITEMAP_CHUNK < entries.length; i++) {
          const name = `sitemap-${i}.xml`;
          writeFileSync(`${root}${name}`, renderSitemap(entries.slice(i * SITEMAP_CHUNK, (i + 1) * SITEMAP_CHUNK)));
          files.push(new URL(`/${name}`, site).href);
        }
        writeFileSync(`${root}sitemap-index.xml`, renderSitemapIndex(files));
        logger.info(`Plan du site : ${entries.length} adresse${entries.length > 1 ? 's' : ''} indexable${entries.length > 1 ? 's' : ''}.`);
      },
    },
  };
}
