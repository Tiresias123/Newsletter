// Protection des formulaires : vérification Turnstile côté serveur, limitation de débit, empreintes salées
// (adresse IP de la preuve de consentement, clés de débit) qui ne conservent ni l'IP ni l'adresse courriel.
import type { Env, RateLimiter } from './http.ts';

export const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Clés secrètes d'essai de Cloudflare (réussite, échec, jeton déjà utilisé) : elles n'acceptent que le jeton
// factice, qui ne porte ni le nom d'hôte ni l'action du site. Admises seulement pour un essai sans envoi réel.
const TEST_SECRET = /^[123]x0{31}AA$/;

type Siteverify = { success?: boolean; hostname?: string; action?: string; 'error-codes'?: string[] };

async function siteverify(secret: string, token: string, ip: string, attempt: string): Promise<Siteverify | undefined> {
  const body = new URLSearchParams({ secret, response: token, idempotency_key: attempt });
  if (ip) body.set('remoteip', ip);
  try {
    const response = await fetch(SITEVERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(10_000) });
    return response.status >= 500 ? undefined : ((await response.json()) as Siteverify);
  } catch {
    return undefined;
  }
}

// Jeton valable 300 secondes et une seule fois : la vérification se fait à chaque envoi, côté serveur. Une
// seconde tentative, avec la même clé d'idempotence, si Cloudflare ne répond pas ou signale une erreur interne.
export async function verifyTurnstile(env: Pick<Env, 'TURNSTILE_SECRET_KEY' | 'MEMORY_SERVICES'>, token: string, expected: { ip: string; hostname: string; action: string }): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY;
  const testing = secret !== undefined && TEST_SECRET.test(secret);
  if (!secret || (testing && env.MEMORY_SERVICES !== 'true')) {
    console.error('turnstile : clé secrète absente, ou clé d’essai hors essai local');
    return false;
  }
  if (!token || token.length > 2048) return false;
  const attempt = crypto.randomUUID();
  let result = await siteverify(secret, token, expected.ip, attempt);
  if (!result || result['error-codes']?.includes('internal-error')) result = await siteverify(secret, token, expected.ip, attempt);
  if (result?.success !== true) {
    // Codes d'erreur seulement (jeton expiré, clé invalide…), jamais l'IP.
    console.warn(`turnstile : refus (${result?.['error-codes']?.join(', ') || 'sans réponse'})`);
    return false;
  }
  if (testing || (result.hostname === expected.hostname && result.action === expected.action)) return true;
  console.warn(`turnstile : nom d’hôte ou action inattendus (${result.hostname ?? '?'}, ${result.action ?? '?'})`);
  return false;
}

// Vrai si chaque clé reste sous la limite; sans liaison configurée, ou si elle est en panne, pas de limite.
export async function underLimits(limiter: RateLimiter | undefined, keys: readonly string[]): Promise<boolean> {
  if (!limiter) return true;
  const results = await Promise.all(keys.map((key) => limiter.limit({ key }).then((outcome) => outcome.success, () => true)));
  return results.every(Boolean);
}

// Partie de l'adresse IP qui sert de clé de débit : l'adresse IPv4 entière, le préfixe /64 d'une adresse IPv6
// (un même abonné dispose souvent de tout le préfixe).
export function ipPrefix(ip: string): string {
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  if (mapped?.[1]) return mapped[1];
  if (!ip.includes(':')) return ip;
  const [head = '', tail] = ip.split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const groups = tail === undefined ? left : [...left, ...Array<string>(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right];
  return `${groups
    .slice(0, 4)
    .map((group) => (Number.parseInt(group, 16) || 0).toString(16))
    .join(':')}::/64`;
}

// Empreinte HMAC-SHA-256 d'une valeur avec le sel secret : la même valeur donne toujours la même empreinte, qui
// ne permet pas de retrouver la valeur sans le sel.
export async function fingerprint(salt: string, value: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(salt), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Clés de débit d'un envoi : par route et par préfixe d'IP, et par route et adresse courriel s'il y en a une
// (contre l'envoi répété de confirmations à une même adresse). Empreintes raccourcies : rien n'est réversible.
export async function rateKeys(salt: string, route: string, ip: string, email?: string): Promise<string[]> {
  const keys = [`${route}:ip:${(await fingerprint(salt, `debit:${ipPrefix(ip)}`)).slice(0, 24)}`];
  if (email) keys.push(`${route}:courriel:${(await fingerprint(salt, `debit:${email.toLowerCase()}`)).slice(0, 24)}`);
  return keys;
}
