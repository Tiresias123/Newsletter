// État de la mesure d'audience au build, partagé par le script (Analytics.astro), le bandeau de consentement et le
// pied de page : active sur le site en ligne seulement (ni en développement, ni dans un aperçu), avec ou sans
// consentement préalable.
import { getConfig } from '../config/index.ts';
import { isPreview } from '../content/astro.ts';

export function analyticsState(): { active: boolean; consentRequired: boolean } {
  const { analytics, cookieConsent } = getConfig().services;
  const active = !isPreview() && analytics.enabled && Boolean(analytics.websiteId);
  return { active, consentRequired: active && cookieConsent.enabled };
}
