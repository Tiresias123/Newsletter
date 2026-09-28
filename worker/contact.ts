// POST /api/contact : message du formulaire de contact (brief 8.6), vérifié (origine, taille, champ piège,
// champs, débit, Turnstile) puis transmis par courriel à l'auteur. Rien n'est conservé par le site.
import siteJson from '../config/site.json' with { type: 'json' };
import { CONTACT_TOPICS, contactMail, type Mailer } from '../src/lib/contact/mailer.ts';
import { backToForm, clientIp, fail, formFailure, ok, readForm, sameOrigin, type Env } from './http.ts';
import { ipRateKey, underLimits, verifyTurnstile } from './security.ts';
import { email, oneOf, optional, text, validate } from './validate.ts';

export const CONTACT_ACTION = 'contact';
const MAX_BYTES = 24 * 1024;
// Courriel de contact facultatif dans l'identité du site : absent du fichier tant qu'il n'est pas saisi.
const site = siteJson as typeof siteJson & { contactEmail?: string };
export const MESSAGE_MAX = 5000;

const RULES = {
  // Une seule ligne : le nom entre dans l'objet du courriel.
  name: text(1, 100, /^[^\r\n]*$/),
  email,
  topic: oneOf(CONTACT_TOPICS),
  message: text(10, MESSAGE_MAX),
  page: optional(text(1, 300, /^\/\S*$/), ''),
  'cf-turnstile-response': text(1, 2048),
};

export async function handleContact(request: Request, env: Env, mailer: Mailer | undefined): Promise<Response> {
  if (request.method !== 'POST') return fail(405, 'methode', { allow: 'POST' });
  const noScript = backToForm(request);
  if (noScript) return noScript;
  if (!sameOrigin(request)) return fail(403, 'origine');
  const form = await readForm(request, MAX_BYTES);
  if ('error' in form) return formFailure(form.error);
  if (form.fields.site_web) return ok();
  const fields = validate(form.fields, RULES);
  if (!fields) return fail(400, 'invalide');
  // En mémoire (essai local, aperçus), rien ne part : l'adresse de réception n'est pas exigée (domaine réservé).
  const to = env.CONTACT_TO || site.contactEmail || (env.MEMORY_SERVICES === 'true' ? 'essai@exemple.invalid' : undefined);
  const salt = env.IP_HASH_SALT;
  if (!mailer || !to || !salt) {
    console.error('contact : service d’envoi, adresse de réception ou sel absents de la configuration du Worker');
    return fail(503, 'indisponible');
  }
  const ip = clientIp(request);
  const { origin, hostname } = new URL(request.url);
  if (!(await underLimits(env.FORM_LIMITER, [await ipRateKey(salt, 'contact', ip)]))) return fail(429, 'debit', { 'retry-after': '60' });
  if (!(await verifyTurnstile(env, fields['cf-turnstile-response'], { ip, hostname, action: CONTACT_ACTION }))) return fail(403, 'verification');
  try {
    await mailer.send(contactMail({ ...fields, page: fields.page ? `${origin}${fields.page}` : '' }, to, site.name));
  } catch (error) {
    console.error(`contact : échec de l’envoi (${error instanceof Error ? error.message : 'erreur inconnue'})`);
    return fail(502, 'indisponible');
  }
  return ok();
}
