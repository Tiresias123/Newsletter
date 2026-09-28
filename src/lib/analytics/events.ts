// Contrat de mesure d'audience (brief 8.7, ARCHITECTURE 12.2) : le site signale des événements sans connaître
// l'outil; le pont de l'outil retenu (Analytics.astro, Umami) les relaie s'il est chargé, sinon rien ne part.
// La page vue est comptée par l'outil lui-même.
export type AnalyticsEvent = 'newsletterSignup' | 'contactMessage' | 'search' | 'outboundClick';
export type EventData = Record<string, string | number>;

export const ANALYTICS_EVENT = 'site:analytics';

export function track(name: AnalyticsEvent, data: EventData = {}): void {
  document.dispatchEvent(new CustomEvent(ANALYTICS_EVENT, { detail: { name, data } }));
}
