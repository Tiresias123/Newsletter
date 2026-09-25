// Intégration Astro : écrit dist/_redirects à la fin du build (voir redirects.ts), à partir du graphe chargé
// comme le fait le script check et de la liste réelle des pages produites.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { loadContent } from './check/load.ts';
import { getConfig } from './config/index.ts';
import { buildGraph } from './content/graph.ts';
import { collectRedirects, renderRedirects, resolveRedirects } from './redirects.ts';

export function redirects(): AstroIntegration {
  let root = '';
  return {
    name: 'redirections',
    hooks: {
      'astro:config:done': ({ config }) => {
        root = fileURLToPath(config.root);
      },
      'astro:build:done': ({ dir, pages, logger }) => {
        const config = getConfig();
        const graph = buildGraph(loadContent(root).raw, config, {
          now: new Date(),
          includeDrafts: process.env.SITE_MODE === 'preview',
          timezone: config.site.timezone,
        });
        const live = new Set(pages.map((page) => `/${page.pathname}`));
        const { rules, issues } = resolveRedirects(collectRedirects(graph), live);
        for (const issue of issues) logger.warn(`${issue.source} : ${issue.message}`);
        writeFileSync(new URL('_redirects', dir), renderRedirects(rules));
        logger.info(`Redirections : ${rules.length} règle${rules.length > 1 ? 's' : ''} dans _redirects.`);
      },
    },
  };
}
