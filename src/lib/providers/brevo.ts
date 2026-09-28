// Adaptateur Brevo (ARCHITECTURE 11.1 et 11.3) : inscription par le double consentement natif de Brevo, avec la
// preuve de consentement en attributs du contact, et envoi des messages du formulaire de contact en courriel
// transactionnel. Simples appels HTTP à l'API v3, sans trousse de développement (elles changent souvent).
import type { Mailer, OutgoingMail } from '../contact/mailer.ts';
import { NotUsedError, ProviderError, type NewsletterProvider, type Subscriber, type Subscription } from '../newsletter/provider.ts';

export const BREVO_API = 'https://api.brevo.com/v3';

// Attributs à créer une fois dans Brevo (catégorie « normal », type texte, guide de l'auteur) : Brevo ignore
// sans erreur un attribut inconnu. Ils sont écrits au clic de confirmation; la date d'ajout à la liste
// (ADDED_TIME de l'export mensuel) donne la date de confirmation.
export const CONSENT_ATTRIBUTES = {
  at: 'CONSENT_AT',
  source: 'CONSENT_SOURCE',
  textVersion: 'CONSENT_TEXT_VERSION',
  ipHash: 'CONSENT_IP_HASH',
  list: 'NL_LIST',
  tags: 'NL_TAGS',
} as const;

export type BrevoNewsletterSettings = {
  apiKey: string;
  // Modèle de courriel de double consentement créé dans Brevo.
  templateId: number;
  // Page du site où renvoie le lien de confirmation (adresse complète).
  redirectionUrl: string;
  // Identifiant de liste du site → numéro de liste Brevo.
  listIds: Record<string, number>;
};

// Appel à l'API; `accepted` : codes d'erreur de Brevo tenus pour un succès.
async function call(apiKey: string, path: string, body: unknown, accepted: readonly string[] = []): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${BREVO_API}${path}`, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    throw new ProviderError(`Brevo injoignable (${error instanceof Error ? error.name : 'erreur'})`, true);
  }
  // 201 et 204 sans corps : rien à lire.
  if (response.ok) return;
  const error = (await response.json().catch(() => ({}))) as { code?: unknown; message?: unknown };
  const code = typeof error.code === 'string' ? error.code : '';
  if (code && accepted.includes(code)) return;
  // Code d'erreur seulement, jamais le message d'une erreur 400, qui peut citer l'adresse. Un 401 peut venir du
  // blocage des IP inconnues de Brevo (« unrecognised IP address ») : à désactiver, les IP de Cloudflare changent.
  const hint = response.status === 401 && typeof error.message === 'string' && /ip/i.test(error.message) ? ', IP bloquée : désactivez le blocage des IP dans Brevo' : '';
  throw new ProviderError(`Brevo : HTTP ${response.status}${code ? ` (${code})` : ''}${hint}`, response.status === 429 || response.status >= 500);
}

export class BrevoProvider implements NewsletterProvider {
  readonly settings: BrevoNewsletterSettings;
  constructor(settings: BrevoNewsletterSettings) {
    this.settings = settings;
  }

  async subscribe({ email, list, consent, tags }: Subscription): Promise<void> {
    const listId = this.settings.listIds[list];
    if (!listId) throw new ProviderError(`liste « ${list} » sans numéro Brevo (config/newsletter.json)`, false);
    // Adresse déjà inscrite à la liste : 400 duplicate_parameter, sans nouveau courriel. Réponse identique au
    // lecteur : on ne révèle jamais si une adresse est inscrite.
    await call(
      this.settings.apiKey,
      '/contacts/doubleOptinConfirmation',
      {
        email,
        includeListIds: [listId],
        templateId: this.settings.templateId,
        redirectionUrl: this.settings.redirectionUrl,
        attributes: {
          [CONSENT_ATTRIBUTES.at]: consent.at,
          [CONSENT_ATTRIBUTES.source]: consent.source,
          [CONSENT_ATTRIBUTES.textVersion]: consent.textVersion,
          [CONSENT_ATTRIBUTES.ipHash]: consent.ipHash,
          [CONSENT_ATTRIBUTES.list]: list,
          [CONSENT_ATTRIBUTES.tags]: tags.join(','),
        },
      },
      ['duplicate_parameter'],
    );
  }

  async confirm(): Promise<void> {
    throw new NotUsedError('confirm', 'le lien du courriel de confirmation de Brevo confirme l’abonné');
  }

  async unsubscribe(): Promise<void> {
    throw new NotUsedError('unsubscribe', 'le lien de désabonnement de chaque envoi, géré par Brevo');
  }

  async tag(): Promise<void> {
    throw new NotUsedError('tag', 'étiquettes enregistrées à l’inscription');
  }

  async list(): Promise<Subscriber[]> {
    throw new NotUsedError('list', 'export des contacts depuis Brevo, chaque mois');
  }
}

// Messages du formulaire de contact : l'expéditeur est une adresse vérifiée dans Brevo; la réponse va au lecteur.
export class BrevoMailer implements Mailer {
  readonly apiKey: string;
  readonly sender: { email: string; name: string };
  constructor(apiKey: string, sender: { email: string; name: string }) {
    this.apiKey = apiKey;
    this.sender = sender;
  }

  async send(mail: OutgoingMail): Promise<void> {
    // Sans modèle, l'API demande une version HTML : le texte, échappé, ligne pour ligne.
    const html = mail.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    await call(this.apiKey, '/smtp/email', {
      sender: this.sender,
      to: [{ email: mail.to }],
      replyTo: mail.replyTo,
      subject: mail.subject,
      textContent: mail.text,
      htmlContent: `<p>${html}</p>`,
      tags: ['contact'],
    });
  }
}
