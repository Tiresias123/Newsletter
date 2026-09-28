// Éditeur Keystatic en mode local (ARCHITECTURE, section 4.2) : ajouté par « astro dev » seulement, sur
// /keystatic. Le build de production reste entièrement statique : ni React, ni route rendue à la demande.
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AstroIntegration } from 'astro';
import type { Plugin } from 'vite';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

const EDITOR_PATH = /^\/(?:keystatic|api\/keystatic)(?:[/?]|$)/;

// Keystatic appelle ses adresses sans barre oblique finale, que le site exige partout (trailingSlash: 'always') :
// on l'ajoute côté serveur pour ses seules adresses. Le navigateur garde l'adresse d'origine.
export function withTrailingSlash(url: string): string {
  if (!EDITOR_PATH.test(url)) return url;
  const [path = '', query] = url.split(/\?(.*)/s);
  return path.endsWith('/') ? url : `${path}/${query === undefined ? '' : `?${query}`}`;
}

// Placé en tête des intermédiaires du serveur, après ceux d'Astro, qui refuseraient l'adresse sans barre finale.
const trailingSlashPlugin: Plugin = {
  name: 'editeur-barre-finale',
  configureServer(server) {
    return () => {
      server.middlewares.stack.unshift({
        route: '',
        handle: (req: IncomingMessage, _res: ServerResponse, next: () => void) => {
          if (req.url) req.url = withTrailingSlash(req.url);
          next();
        },
      });
    };
  },
};

export function editor(): AstroIntegration {
  return {
    name: 'editeur',
    hooks: {
      'astro:config:setup': ({ command, config, logger, updateConfig }) => {
        if (command !== 'dev') return;
        // L'éditeur écrit dans content/ et config/ sans authentification : jamais sur un serveur ouvert au réseau.
        if (config.server.host && !['127.0.0.1', 'localhost', '::1'].includes(String(config.server.host))) {
          logger.warn("Éditeur désactivé : le serveur est ouvert au réseau (option --host). Relancez « npm run dev » sans --host pour utiliser /keystatic.");
          return;
        }
        // Astro exécute ensuite les intégrations ajoutées ici, dans l'ordre.
        updateConfig({ integrations: [react(), keystatic()], vite: { plugins: [trailingSlashPlugin] } });
      },
    },
  };
}
