// Clé de site Turnstile du build : celle des réglages « Services » en production; en aperçu, la clé d'essai de
// Cloudflare qui réussit toujours. Les formulaires d'un aperçu marchent ainsi sans déclarer son adresse chez
// Cloudflare, avec un Worker en mode d'essai (MEMORY_SERVICES) : rien n'y est envoyé.
import { getConfig } from '../config/index.ts';
import { isPreview } from '../content/astro.ts';

export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

export const turnstileSiteKey = (): string => (isPreview() ? TURNSTILE_TEST_SITE_KEY : (getConfig().services.turnstile.siteKey ?? ''));
