// Outils communs aux routes du Worker : environnement, réponses JSON sans cache avec en-têtes de sécurité
// (le fichier _headers ne s'applique pas aux réponses du Worker), lecture bornée des formulaires.
import { HSTS, PERMISSIONS_POLICY } from '../src/lib/security/policy.ts';

// Liaisons et secrets du Worker (wrangler.jsonc, secrets Cloudflare; .dev.vars en local).
export interface Env {
  // Fichiers statiques de dist/.
  ASSETS: { fetch(request: Request | string): Promise<Response> };
  // Limitation de débit (facultative : sans elle, Turnstile, le champ piège et le double consentement protègent).
  FORM_LIMITER?: RateLimiter;
  TURNSTILE_SECRET_KEY?: string;
  // Clé d'API du fournisseur d'infolettre (Brevo), qui sert aussi à l'envoi des messages du formulaire de contact.
  NEWSLETTER_API_KEY?: string;
  // Sel secret des empreintes (adresse IP de la preuve de consentement, clés de débit) : ne jamais le changer.
  IP_HASH_SALT?: string;
  // Adresse de réception du formulaire de contact; sinon celle de config/site.json.
  CONTACT_TO?: string;
  // Deploy Hook de Workers Builds (publication programmée, reconstruction nocturne).
  DEPLOY_HOOK_URL?: string;
  // Mode d'essai (« true » : .dev.vars en local, bloc previews des aperçus de branche) : inscriptions et messages
  // restent en mémoire, rien n'est envoyé ni conservé.
  MEMORY_SERVICES?: string;
}

export const trialMode = (env: Pick<Env, 'MEMORY_SERVICES'>) => env.MEMORY_SERVICES === 'true';

// Sel des empreintes; en essai, un sel fixe suffit, puisqu'aucune empreinte n'y est conservée : un aperçu de
// branche marche sans aucun secret.
export const saltOf = (env: Pick<Env, 'IP_HASH_SALT' | 'MEMORY_SERVICES'>) => env.IP_HASH_SALT || (trialMode(env) ? 'essai' : undefined);

export interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

// Codes d'erreur renvoyés au formulaire, qui affiche le texte correspondant (config/).
export type ErrorCode = 'invalide' | 'origine' | 'verification' | 'debit' | 'indisponible' | 'methode' | 'introuvable' | 'taille';

// Mêmes protections que les pages (dist/_headers), plus une CSP qui n'autorise rien : une réponse JSON ne charge rien.
const SECURITY: Record<string, string> = {
  'cache-control': 'no-store',
  'strict-transport-security': HSTS,
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': PERMISSIONS_POLICY,
  'x-frame-options': 'DENY',
  'cross-origin-opener-policy': 'same-origin',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
};

export const json = (status: number, body: Record<string, unknown>, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...SECURITY, ...extra } });

export const ok = () => json(200, { ok: true });
export const fail = (status: number, error: ErrorCode, extra: Record<string, string> = {}) => json(status, { ok: false, error }, extra);

// Adresse IP du lecteur, transmise par Cloudflare.
export const clientIp = (request: Request) => request.headers.get('cf-connecting-ip') ?? '';

// Le formulaire est servi par le même Worker : une requête d'une autre origine n'est pas légitime.
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  return origin !== null && origin === new URL(request.url).origin;
}

// Formulaire envoyé sans JavaScript (le script du site demande du JSON) : il ne peut pas porter de jeton
// Turnstile. Retour à la page du formulaire, qui explique qu'il faut activer JavaScript.
export function backToForm(request: Request): Response | undefined {
  if ((request.headers.get('accept') ?? '').includes('application/json')) return undefined;
  const { origin } = new URL(request.url);
  const referer = URL.parse(request.headers.get('referer') ?? '');
  const target = referer?.origin === origin ? `${origin}${referer.pathname}` : `${origin}/`;
  return new Response(null, { status: 303, headers: { location: target, ...SECURITY } });
}

// Corps lu par morceaux et abandonné au-delà de `maxBytes`, même sans en-tête Content-Length.
async function readBody(request: Request, maxBytes: number): Promise<Uint8Array<ArrayBuffer> | undefined> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return undefined;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

// Échec de lecture : corps trop gros, type autre qu'un formulaire, ou formulaire illisible (multipart tronqué…).
export type FormError = 'taille' | 'type' | 'illisible';

// Champs d'un formulaire (multipart ou urlencoded), refusé au-delà de `maxBytes`.
export async function readForm(request: Request, maxBytes: number): Promise<{ fields: Record<string, string> } | { error: FormError }> {
  if (Number(request.headers.get('content-length') ?? '0') > maxBytes) return { error: 'taille' };
  const type = request.headers.get('content-type') ?? '';
  if (!/^(multipart\/form-data|application\/x-www-form-urlencoded)\b/i.test(type)) return { error: 'type' };
  const body = await readBody(request, maxBytes);
  if (!body) return { error: 'taille' };
  try {
    const form = await new Response(body, { headers: { 'content-type': type } }).formData();
    const fields: Record<string, string> = {};
    for (const [key, value] of form) if (typeof value === 'string') fields[key] = value;
    return { fields };
  } catch {
    return { error: 'illisible' };
  }
}

// Réponse à un formulaire illisible : 413 pour la taille, 415 pour le type, 400 pour le reste.
export const formFailure = (error: FormError) => (error === 'taille' ? fail(413, 'taille') : fail(error === 'type' ? 415 : 400, 'invalide'));
