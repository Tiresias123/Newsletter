// Chargement et validation de tous les fichiers de config/.
// Les imports JSON fonctionnent à l'identique dans Astro (avec rechargement à chaud) et dans les scripts Node.
import type { z } from '../zod.ts';
import { ContentValidationError, problemsFromZod, type ValidationProblem } from '../errors.ts';
import {
  adsSchema,
  homepageSchema,
  legalSchema,
  messagesSchema,
  navigationSchema,
  newsletterConfigSchema,
  redirectsSchema,
  servicesSchema,
  siteSchema,
  themeSchema,
  tickerSchema,
  veilleSourcesSchema,
} from './schemas.ts';
import site from '../../../config/site.json' with { type: 'json' };
import navigation from '../../../config/navigation.json' with { type: 'json' };
import homepage from '../../../config/homepage.json' with { type: 'json' };
import theme from '../../../config/theme.json' with { type: 'json' };
import ticker from '../../../config/ticker.json' with { type: 'json' };
import newsletter from '../../../config/newsletter.json' with { type: 'json' };
import legal from '../../../config/legal.json' with { type: 'json' };
import veilleSources from '../../../config/sources-veille.json' with { type: 'json' };
import ads from '../../../config/ads.json' with { type: 'json' };
import redirects from '../../../config/redirects.json' with { type: 'json' };
import services from '../../../config/services.json' with { type: 'json' };
import messages from '../../../config/i18n/fr.json' with { type: 'json' };

const FILES = {
  site: { file: 'config/site.json', schema: siteSchema, data: site },
  navigation: { file: 'config/navigation.json', schema: navigationSchema, data: navigation },
  homepage: { file: 'config/homepage.json', schema: homepageSchema, data: homepage },
  theme: { file: 'config/theme.json', schema: themeSchema, data: theme },
  ticker: { file: 'config/ticker.json', schema: tickerSchema, data: ticker },
  newsletter: { file: 'config/newsletter.json', schema: newsletterConfigSchema, data: newsletter },
  legal: { file: 'config/legal.json', schema: legalSchema, data: legal },
  veilleSources: { file: 'config/sources-veille.json', schema: veilleSourcesSchema, data: veilleSources },
  ads: { file: 'config/ads.json', schema: adsSchema, data: ads },
  redirects: { file: 'config/redirects.json', schema: redirectsSchema, data: redirects },
  services: { file: 'config/services.json', schema: servicesSchema, data: services },
  messages: { file: 'config/i18n/fr.json', schema: messagesSchema, data: messages },
} as const;

type Files = typeof FILES;
export type SiteConfig = { [K in keyof Files]: z.output<Files[K]['schema']> };

// Fichier d'origine de chaque partie de la configuration (messages d'erreur, rapport check).
export const CONFIG_FILES = Object.fromEntries(Object.entries(FILES).map(([key, { file }]) => [key, file])) as Record<keyof Files, string>;

// Valide chaque fichier et rassemble tous les problèmes, pour les afficher d'un coup.
export function validateConfig(): { config: SiteConfig | null; problems: ValidationProblem[] } {
  const problems: ValidationProblem[] = [];
  const config: Record<string, unknown> = {};
  for (const [key, { file, schema, data }] of Object.entries(FILES)) {
    const result = schema.safeParse(data);
    if (result.success) config[key] = result.data;
    else problems.push(...problemsFromZod(file, result.error));
  }
  return { config: problems.length === 0 ? (config as SiteConfig) : null, problems };
}

let cached: SiteConfig | undefined;

// Configuration validée ; le build s'arrête avec un message clair si un fichier est invalide.
export function getConfig(): SiteConfig {
  if (cached) return cached;
  const { config, problems } = validateConfig();
  if (!config) throw new ContentValidationError('La configuration contient des erreurs à corriger :', problems);
  cached = config;
  return config;
}
