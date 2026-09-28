// Version du texte de consentement affiché (ARCHITECTURE 11.2) : empreinte courte calculée au build, envoyée
// avec le formulaire et conservée chez le fournisseur. Elle porte sur le texte tel qu'il s'affiche : texte de
// config/newsletter.json avec le nom du site et la typographie du site, puis libellé du lien de confidentialité.
// Renommer le site change donc la version. `npm run consent:version` affiche la version et son texte.
import { createHash } from 'node:crypto';
import { interpolate } from '../i18n.ts';
import { frenchTypography } from '../typo.ts';

export const consentVersion = (text: string) => createHash('sha256').update(text.normalize('NFC')).digest('hex').slice(0, 12);

export function displayedConsent(texts: { consent: string; privacyLinkLabel: string }, siteName: string): { text: string; version: string } {
  const text = frenchTypography(interpolate(texts.consent, { site: siteName }));
  return { text, version: consentVersion(`${text} ${texts.privacyLinkLabel}`) };
}
