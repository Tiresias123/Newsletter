// POST /api/newsletter : inscription à l'infolettre avec double consentement (brief 8.5, ARCHITECTURE 11.2).
// Ordre des contrôles : origine, taille, champ piège, champs, configuration, débit par IP, Turnstile, débit par
// adresse (compté seulement après un défi réussi : un tiers ne peut pas épuiser celui d'une autre adresse sans
// résoudre de défi); puis abonné « en attente » chez le fournisseur, avec sa preuve de consentement. Réponse
// toujours générique : on ne révèle jamais si une adresse est déjà inscrite.
import newsletterConfig from '../config/newsletter.json' with { type: 'json' };
import type { NewsletterProvider } from '../src/lib/newsletter/provider.ts';
import { backToForm, clientIp, fail, formFailure, ok, readForm, saltOf, sameOrigin, type Env } from './http.ts';
import { emailRateKey, fingerprint, ipRateKey, underLimits, verifyTurnstile } from './security.ts';
import { email, oneOf, text, validate } from './validate.ts';

export const NEWSLETTER_ACTION = 'newsletter';
const MAX_BYTES = 8 * 1024;
export const PLACEMENTS = ['article', 'barre-laterale', 'page', 'pied-de-page', 'accueil'] as const;

const enabledLists = newsletterConfig.lists.filter((l) => l.enabled).map((l) => l.id);

const RULES = {
  email,
  consent: oneOf(['oui']),
  list: oneOf(enabledLists),
  source: text(1, 300, /^\/\S*$/),
  placement: oneOf(PLACEMENTS),
  consent_version: text(8, 64, /^[a-f0-9]+$/),
  'cf-turnstile-response': text(1, 2048),
};

export async function handleNewsletter(request: Request, env: Env, provider: NewsletterProvider | undefined, now = new Date()): Promise<Response> {
  if (request.method !== 'POST') return fail(405, 'methode', { allow: 'POST' });
  const noScript = backToForm(request);
  if (noScript) return noScript;
  if (!sameOrigin(request)) return fail(403, 'origine');
  const form = await readForm(request, MAX_BYTES);
  if ('error' in form) return formFailure(form.error);
  // Champ piège rempli : un robot. Réponse de succès, sans rien enregistrer.
  if (form.fields.site_web) return ok();
  const fields = validate(form.fields, RULES);
  if (!fields) return fail(400, 'invalide');
  const salt = saltOf(env);
  if (!provider || !salt) {
    console.error('infolettre : fournisseur ou sel absent de la configuration du Worker');
    return fail(503, 'indisponible');
  }
  const ip = clientIp(request);
  const { origin, hostname } = new URL(request.url);
  const limited = () => fail(429, 'debit', { 'retry-after': '60' });
  if (!(await underLimits(env.FORM_LIMITER, [await ipRateKey(salt, 'newsletter', ip)]))) return limited();
  if (!(await verifyTurnstile(env, fields['cf-turnstile-response'], { ip, hostname, action: NEWSLETTER_ACTION }))) return fail(403, 'verification');
  if (!(await underLimits(env.FORM_LIMITER, [await emailRateKey(salt, 'newsletter', fields.email)]))) return limited();
  try {
    await provider.subscribe({
      email: fields.email.toLowerCase(),
      list: fields.list,
      tags: [fields.placement],
      consent: {
        at: now.toISOString(),
        source: `${origin}${fields.source} (${fields.placement})`,
        textVersion: fields.consent_version,
        ipHash: await fingerprint(salt, ip),
      },
    });
  } catch (error) {
    // Journal minimal : jamais l'adresse courriel.
    console.error(`infolettre : échec du fournisseur (${error instanceof Error ? error.message : 'erreur inconnue'})`);
    return fail(502, 'indisponible');
  }
  return ok();
}
