// Réglages des services à compléter (rapport « Avant la mise en ligne ») : sans eux, les formulaires, la mesure
// d'audience ou les cours de marché ne fonctionnent pas, sans que le site le montre.
import { CONFIG_FILES } from '../config/index.ts';
import type { Severity } from '../content/graph.ts';
import { coingeckoKey, marketWanted } from '../market/index.ts';
import { PLACEHOLDER_URL, type Context } from './context.ts';

// Clés de site d'essai de Cloudflare (réussite, échec, défi forcé; visibles ou invisibles).
const TEST_SITE_KEY = /^[123]x0{20}[A-F]{2}$/;

export function checkServices({ config, add, mode }: Pick<Context, 'config' | 'add' | 'mode'>, hasMarketKey = Boolean(coingeckoKey())): void {
  const { services, newsletter, site } = config;
  const lancement = (file: string, where: PropertyKey[], message: string, severity: Severity = 'avertissement') => add(file, where, message, 'lancement', severity);
  // Réglage d'essai laissé en place : bloquant pour le site en ligne, toléré avant la mise en ligne et en aperçu.
  const essai: Severity = site.url !== PLACEHOLDER_URL && mode === 'production' ? 'bloquant' : 'avertissement';

  if (!services.turnstile.siteKey) {
    lancement(CONFIG_FILES.services, ['turnstile', 'siteKey'], "Clé de site Turnstile à saisir : sans elle, l'inscription à l'infolettre et le formulaire de contact sont refusés.");
  } else if (TEST_SITE_KEY.test(services.turnstile.siteKey)) {
    lancement(CONFIG_FILES.services, ['turnstile', 'siteKey'], "Clé de site d'essai de Turnstile : elle ne sert qu'aux essais locaux. Saisir la clé du widget du site.", essai);
  }
  if (newsletter.provider === 'test') {
    lancement(CONFIG_FILES.newsletter, ['provider'], "Fournisseur d'infolettre « Test (aucun envoi) » : les inscriptions ne sont enregistrées nulle part, alors que le lecteur est invité à confirmer.", essai);
  } else if (newsletter.provider === 'cyberimpact') {
    lancement(CONFIG_FILES.newsletter, ['provider'], "Cyberimpact n'est pas encore relié au site : l'inscription est refusée. Choisir Brevo, ou faire écrire son connecteur.");
  }
  if (newsletter.provider === 'brevo') {
    if (!newsletter.doubleOptInTemplateId) {
      lancement(CONFIG_FILES.newsletter, ['doubleOptInTemplateId'], "Numéro du modèle de double consentement Brevo à saisir : sans lui, l'inscription est refusée.");
    }
    newsletter.lists.forEach((list, i) => {
      if (list.enabled && !list.providerId) lancement(CONFIG_FILES.newsletter, ['lists', i, 'providerId'], `Liste « ${list.label} » active sans numéro de liste Brevo : l'inscription y est refusée.`);
    });
  }
  if (services.contact.enabled) {
    if (!services.contact.senderEmail) {
      lancement(CONFIG_FILES.services, ['contact', 'senderEmail'], "Formulaire de contact activé sans adresse d'expédition (adresse vérifiée chez Brevo) : les messages ne partent pas.");
    }
    if (!site.contactEmail) {
      lancement(CONFIG_FILES.site, ['contactEmail'], 'Formulaire de contact activé sans courriel de contact : les messages ne sont remis que si le secret CONTACT_TO est défini dans Cloudflare.', 'information');
    }
  }
  if (services.analytics.enabled && services.analytics.collectOrigins.length === 0) {
    lancement(CONFIG_FILES.services, ['analytics', 'collectOrigins'], "Mesure d'audience sans adresse de collecte : la politique de sécurité du site bloquerait l'envoi des mesures.");
  }
  if (services.analytics.enabled && services.analytics.domains.length === 0) {
    lancement(CONFIG_FILES.services, ['analytics', 'domains'], "Mesure d'audience sans domaine : les aperçus de branche seraient comptés aussi. Indiquez le domaine du site.", 'information');
  }
  if (marketWanted(config) && !hasMarketKey) {
    lancement(CONFIG_FILES.ticker, ['enabled'], 'Cours de marché activés, mais la clé COINGECKO_API_KEY est absente de ce build : le bandeau et les sections de marché sont masqués.', 'information');
  }
}
