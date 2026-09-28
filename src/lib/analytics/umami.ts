// Pont vers Umami (ARCHITECTURE 12.2) : relaie les événements du site (events.ts) et compte les clics vers
// d'autres sites (hôte et chemin seulement). Si le consentement est exigé (réglages « Services »), le script
// n'est chargé qu'après l'accord du lecteur, gardé dans le navigateur. Sans mesure active, ne fait rien.
import { ANALYTICS_EVENT, type EventData } from './events.ts';

type Umami = { track(name: string, data?: EventData): void };
const umami = () => (window as unknown as { umami?: Umami }).umami;
const CHOICE = 'consentement-audience';
// Fonction globale qu'Umami appelle avant chaque envoi (attribut data-before-send du script).
export const BEFORE_SEND = 'umamiBeforeSend';
// Attributs du script recopiés quand il est chargé après consentement.
const SCRIPT_ATTRIBUTES = ['data-website-id', 'data-domains', 'data-do-not-track', 'data-exclude-hash', 'data-before-send'];

// Adresse sans ses paramètres, sauf ceux des campagnes (utm_*, liens de l'infolettre) : les termes de
// recherche (?q=) ne partent jamais.
export function campaignOnly(address: string, origin: string): string {
  try {
    const url = new URL(address, origin);
    for (const key of [...url.searchParams.keys()]) if (!key.startsWith('utm_')) url.searchParams.delete(key);
    return address.startsWith('/') ? `${url.pathname}${url.search}${url.hash}` : url.href;
  } catch {
    return address;
  }
}

// Rien ne part si le navigateur signale le refus du suivi (Global Privacy Control).
function beforeSend(_type: string, payload: Record<string, unknown>): Record<string, unknown> | false {
  if ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return false;
  for (const key of ['url', 'referrer']) {
    const value = payload[key];
    if (typeof value === 'string' && value) payload[key] = campaignOnly(value, location.origin);
  }
  return payload;
}

function readChoice(): string | null {
  try {
    return localStorage.getItem(CHOICE);
  } catch {
    return null;
  }
}

function saveChoice(value: 'oui' | 'non' | null): void {
  try {
    if (value) localStorage.setItem(CHOICE, value);
    else localStorage.removeItem(CHOICE);
  } catch {
    // Stockage refusé : le choix vaut pour cette page seulement.
  }
}

// Script Umami ajouté après consentement, avec les attributs préparés au build.
function load(meta: HTMLMetaElement): void {
  const script = document.createElement('script');
  script.defer = true;
  script.src = meta.content;
  for (const name of SCRIPT_ATTRIBUTES) {
    const value = meta.getAttribute(name);
    if (value) script.setAttribute(name, value);
  }
  document.head.append(script);
}

function askConsent(meta: HTMLMetaElement): void {
  const banner = document.querySelector<HTMLElement>('[data-consent-banner]');
  const choice = readChoice();
  if (choice === 'oui') load(meta);
  if (!banner) return;
  if (!choice) banner.hidden = false;
  banner.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLElement>('[data-consent]');
    if (!button) return;
    const value = button.dataset.consent === 'oui' ? 'oui' : 'non';
    saveChoice(value);
    banner.hidden = true;
    if (value === 'oui') load(meta);
  });
  // Bouton « Mesure d'audience » du pied de page : revenir sur son choix.
  for (const reset of document.querySelectorAll('[data-consent-reset]')) {
    reset.addEventListener('click', () => {
      saveChoice(null);
      banner.hidden = false;
    });
  }
}

export function startAnalyticsBridge(): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="analytics"][data-consent="required"]');
  if (!meta && !document.querySelector('script[data-website-id]')) return;
  (window as unknown as Record<string, unknown>)[BEFORE_SEND] = beforeSend;
  if (meta) askConsent(meta);
  document.addEventListener(ANALYTICS_EVENT, (event) => {
    const { name, data } = (event as CustomEvent<{ name: string; data: EventData }>).detail;
    umami()?.track(name, data);
  });
  document.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!link || !/^https?:$/.test(link.protocol) || link.host === location.host) return;
    umami()?.track('outboundClick', { url: `${link.host}${link.pathname}`.slice(0, 200) });
  });
}
