// Collecte d'une source de la veille (scripts/veille-fetch.ts) : robots.txt du site, puis le fil. Toute erreur
// (réseau, délai dépassé, connexion coupée pendant la lecture) reste celle de la source : elle n'arrête jamais
// la collecte des autres.
import type { FetchOutcome } from './merge.ts';
import { decodeFeed, parseFeed, UnreadableFeedError } from './parse.ts';
import { robotsAllows } from './robots.ts';

// Jeton de produit du robot : le nom que les robots.txt peuvent viser (User-agent).
export const ROBOT = 'VeilleReglementaireBot';
const ACCEPT = 'application/atom+xml, application/rss+xml, application/feed+json, application/xml;q=0.9, text/xml;q=0.9, application/json;q=0.8, */*;q=0.5';

export type Collected = FetchOutcome & { http?: number; type?: string };
export type CollectorOptions = { agent: string; timeoutMs: number; timeZone: string; fetch?: typeof fetch };

// Cause lisible d'un échec : délai dépassé, ou message de l'erreur et code système (« fetch failed (ENOTFOUND) »).
export function describeError(error: unknown, timeoutMs: number): string {
  if (!(error instanceof Error)) return String(error);
  if (error.name === 'TimeoutError') return `délai de ${timeoutMs / 1000} s dépassé`;
  const code = (error.cause as { code?: unknown } | undefined)?.code;
  return typeof code === 'string' ? `${error.message} (${code})` : error.message;
}

export function createCollector({ agent, timeoutMs, timeZone, fetch: fetcher = fetch }: CollectorOptions): (url: string) => Promise<Collected> {
  const reason = (error: unknown) => describeError(error, timeoutMs);
  const request = (url: string) => fetcher(url, { headers: { 'user-agent': agent, accept: ACCEPT }, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) });
  // Un robots.txt par site, lu une fois par collecte. RFC 9309 : absent (4xx), tout est permis; serveur en
  // panne (5xx) ou réponse coupée, rien ne l'est.
  const robotsCache = new Map<string, Promise<string | Error>>();
  const robotsOf = (origin: string) => {
    let pending = robotsCache.get(origin);
    if (!pending) {
      pending = request(`${origin}/robots.txt`)
        .then(async (response) => (response.status >= 500 ? new Error(`robots.txt : HTTP ${response.status}`) : response.ok ? await response.text() : ''))
        .catch((error: unknown) => new Error(`robots.txt : ${reason(error)}`));
      robotsCache.set(origin, pending);
    }
    return pending;
  };

  async function attempt(url: string): Promise<Collected> {
    const target = new URL(url);
    const robots = await robotsOf(target.origin);
    if (robots instanceof Error) return { status: 'erreur', detail: robots.message };
    if (!robotsAllows(robots, ROBOT, `${target.pathname}${target.search}`)) return { status: 'bloque', detail: 'interdit par le robots.txt du site' };
    const response = await request(url);
    const type = response.headers.get('content-type') ?? '';
    if (!response.ok) return { status: 'erreur', detail: `HTTP ${response.status}`, http: response.status, type };
    const body = decodeFeed(new Uint8Array(await response.arrayBuffer()), type);
    try {
      return { status: 'ok', entries: parseFeed(body, response.url || url, timeZone), http: response.status, type };
    } catch (error) {
      if (error instanceof UnreadableFeedError) return { status: 'illisible', detail: error.message, http: response.status, type };
      throw error;
    }
  }

  return async (url) => {
    try {
      return await attempt(url);
    } catch (error) {
      return { status: 'erreur', detail: reason(error) };
    }
  };
}
