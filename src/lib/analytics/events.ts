// Contrat de mesure d'audience (brief 8.7, ARCHITECTURE 12.2) : le site signale des événements sans connaître
// l'outil; le pont de l'outil retenu (Analytics.astro, Umami) les relaie s'il est chargé, sinon rien ne part.
// La page vue est comptée par l'outil lui-même.
export type AnalyticsEvent = 'newsletterSignup' | 'contactMessage' | 'search' | 'outboundClick';
export type EventData = Record<string, string | number>;

export const ANALYTICS_EVENT = 'site:analytics';

export function track(name: AnalyticsEvent, data: EventData = {}): void {
  document.dispatchEvent(new CustomEvent(ANALYTICS_EVENT, { detail: { name, data } }));
}

// Texte qui pourrait contenir un renseignement personnel, à ne pas transmettre : adresse courriel, numéro
// (téléphone, NAS, compte : cinq chiffres ou plus au total, séparateurs compris), ou suite d'au moins vingt
// caractères sans espace (adresse de portefeuille, clé, identifiant).
export const looksPersonal = (text: string): boolean => text.includes('@') || (text.match(/\d/g) ?? []).length >= 5 || /\S{20,}/.test(text);
