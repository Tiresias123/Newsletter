// Pages du mode développement (ARCHITECTURE 8.2) : injectées par « astro dev » seulement,
// jamais construites pour le site public.
import type { AstroIntegration } from 'astro';

export function devPages(): AstroIntegration {
  return {
    name: 'pages-de-developpement',
    hooks: {
      'astro:config:setup': ({ command, injectRoute }) => {
        if (command !== 'dev') return;
        injectRoute({ pattern: '/a-verifier', entrypoint: './src/dev/a-verifier.astro' });
        injectRoute({ pattern: '/exemple', entrypoint: './src/dev/exemple.astro' });
      },
    },
  };
}
