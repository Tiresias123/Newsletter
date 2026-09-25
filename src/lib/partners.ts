// Partenaires (config/ads.json) : un partenaire s'affiche seulement si la publicité est activée, s'il l'est
// lui-même, s'il vise cet emplacement et si la date du jour est dans sa campagne.
import { getConfig } from './config/index.ts';
import { calendarDateInZone } from './dates.ts';

export type Placement = 'article' | 'sidebar' | 'home' | 'newsletter';

export function activePartner(partnerId: string, placement: Placement, now = new Date()) {
  const { ads, site } = getConfig();
  if (!ads.enabled) return undefined;
  const today = calendarDateInZone(now, site.timezone);
  return ads.partners.find(
    (p) =>
      p.id === partnerId &&
      p.enabled &&
      p.placement.includes(placement) &&
      (!p.startDate || p.startDate <= today) &&
      (!p.endDate || p.endDate >= today),
  );
}
