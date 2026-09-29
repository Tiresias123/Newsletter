// Worker du site (ARCHITECTURE 15.1) : sert les pages statiques de dist/ et ne s'exécute que pour /api/*
// (formulaires, sonde de disponibilité) et pour la tâche planifiée (publication programmée, reconstruction
// nocturne). Les réglages publics viennent de config/ (intégrés au déploiement), les secrets de Cloudflare.
import newsletterConfig from '../config/newsletter.json' with { type: 'json' };
import servicesConfig from '../config/services.json' with { type: 'json' };
import siteConfig from '../config/site.json' with { type: 'json' };
import { MemoryMailer, type Mailer } from '../src/lib/contact/mailer.ts';
import { MemoryProvider } from '../src/lib/newsletter/memory.ts';
import type { NewsletterProvider } from '../src/lib/newsletter/provider.ts';
import { BrevoMailer, BrevoProvider } from '../src/lib/providers/brevo.ts';
import { contactRecipient, handleContact } from './contact.ts';
import { fail, ok, saltOf, trialMode, type Env } from './http.ts';
import { handleNewsletter } from './newsletter.ts';
import { runScheduled, type ScheduledEvent } from './scheduled.ts';
import { turnstileReady } from './security.ts';

type NewsletterSettings = { provider: string; doubleOptInTemplateId?: number; confirmationUrl?: string; lists: Array<{ id: string; providerId?: number }> };
type ContactSettings = { enabled: boolean; senderEmail?: string; senderName?: string };

// Mode d'essai (MEMORY_SERVICES=true : .dev.vars en local, aperçus de branche) ou fournisseur « Test (aucun
// envoi) » : inscriptions et messages gardés en mémoire le temps de l'essai, rien n'est envoyé.
const memory = { provider: new MemoryProvider(), mailer: new MemoryMailer() };

export function newsletterProvider(env: Env, request: Request): NewsletterProvider | undefined {
  const settings = newsletterConfig as NewsletterSettings;
  if (trialMode(env) || settings.provider === 'test') return memory.provider;
  if (settings.provider !== 'brevo' || !env.NEWSLETTER_API_KEY || !settings.doubleOptInTemplateId) return undefined;
  const listIds = Object.fromEntries(settings.lists.filter((l) => l.providerId).map((l) => [l.id, l.providerId as number]));
  return new BrevoProvider({
    apiKey: env.NEWSLETTER_API_KEY,
    templateId: settings.doubleOptInTemplateId,
    redirectionUrl: new URL(settings.confirmationUrl ?? '/newsletter/confirmation/', new URL(request.url).origin).href,
    listIds,
  });
}

export function contactMailer(env: Env): Mailer | undefined {
  const contact = servicesConfig.contact as ContactSettings;
  if (contact.enabled && trialMode(env)) return memory.mailer;
  if (!contact.enabled || !contact.senderEmail || !env.NEWSLETTER_API_KEY) return undefined;
  return new BrevoMailer(env.NEWSLETTER_API_KEY, { email: contact.senderEmail, name: contact.senderName || siteConfig.name });
}

// GET /api/sante, pour la sonde de disponibilité (guide de l'auteur, section 41) : 200 si le Worker peut recevoir
// les formulaires actifs (fournisseur, service d'envoi, adresse de réception, sel et clé secrète de Turnstile en
// place), 503 sinon. Présence des réglages seulement, pas leur validité : aucun appel aux fournisseurs, la route
// ne coûte rien et ne révèle rien de plus que les formulaires eux-mêmes.
function health(request: Request, env: Env): Response {
  if (request.method !== 'GET' && request.method !== 'HEAD') return fail(405, 'methode', { allow: 'GET, HEAD' });
  const contact = (servicesConfig.contact as ContactSettings).enabled;
  const forms = saltOf(env) && turnstileReady(env) && newsletterProvider(env, request);
  const ready = Boolean(forms && (!contact || (contactMailer(env) && contactRecipient(env))));
  const response = ready ? ok() : fail(503, 'indisponible');
  return request.method === 'HEAD' ? new Response(null, response) : response;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/sante' || pathname === '/api/sante/') return health(request, env);
    if (pathname === '/api/newsletter' || pathname === '/api/newsletter/') return handleNewsletter(request, env, newsletterProvider(env, request));
    if (pathname === '/api/contact' || pathname === '/api/contact/') return handleContact(request, env, contactMailer(env));
    if (pathname.startsWith('/api/')) return fail(404, 'introuvable');
    return env.ASSETS.fetch(request);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: { waitUntil(promise: Promise<unknown>): void }): Promise<void> {
    ctx.waitUntil(runScheduled(event, env));
  },
};
