// npm run veille:fetch : collecte les fils des sources activées de config/sources-veille.json et met à jour
// data/veille/cache.json (ARCHITECTURE, section 14). Lancé par la tâche GitHub « veille » deux fois par jour
// ouvrable; le build ne télécharge jamais rien. Une source en panne ne retire rien du cache : son état est noté
// et le rapport « À vérifier » le signale.
//   --diagnostic : essaie aussi les sources désactivées qui ont une adresse, affiche le résultat, n'écrit rien;
//   --source <id> : une seule source.
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getConfig } from '../src/lib/config/index.ts';
import { veilleCacheSchema, type VeilleCache } from '../src/lib/content/veille.ts';
import { applyOutcome, emptyCache, prune, serializeCache, sourceState, type FetchOutcome } from '../src/lib/veille/merge.ts';
import { parseFeed, UnreadableFeedError } from '../src/lib/veille/parse.ts';
import { robotsAllows } from '../src/lib/veille/robots.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
process.chdir(root);
const CACHE = 'data/veille/cache.json';
const TIMEOUT_MS = 20_000;
const args = process.argv.slice(2);
const diagnostic = args.includes('--diagnostic');
const only = args.includes('--source') ? args[args.indexOf('--source') + 1] : undefined;

const config = getConfig();
const { timezone } = config.site;
// Robot identifié, avec une adresse de contact (bonne conduite, ARCHITECTURE section 14).
const AGENT = `VeilleReglementaireBot/1.0 (+${config.site.url.replace(/\/$/, '')}/a-propos/${config.site.contactEmail ? `; ${config.site.contactEmail}` : ''})`;
const ACCEPT = 'application/atom+xml, application/rss+xml, application/feed+json, application/xml;q=0.9, text/xml;q=0.9, application/json;q=0.8, */*;q=0.5';

const request = (url: string) => fetch(url, { headers: { 'user-agent': AGENT, accept: ACCEPT }, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) });
const reason = (error: unknown) => (error instanceof Error ? (error.name === 'TimeoutError' ? `délai de ${TIMEOUT_MS / 1000} s dépassé` : error.message) : String(error));

const robotsCache = new Map<string, Promise<string | Error>>();
function robotsOf(origin: string): Promise<string | Error> {
  let pending = robotsCache.get(origin);
  if (!pending) {
    pending = request(`${origin}/robots.txt`).then(
      async (response) => {
        if (response.status >= 500) return new Error(`robots.txt : HTTP ${response.status}`);
        return response.ok ? response.text() : '';
      },
      (error: unknown) => new Error(`robots.txt : ${reason(error)}`),
    );
    robotsCache.set(origin, pending);
  }
  return pending;
}

async function collect(url: string): Promise<FetchOutcome & { http?: number; type?: string }> {
  const target = new URL(url);
  const robots = await robotsOf(target.origin);
  if (robots instanceof Error) return { status: 'erreur', detail: robots.message };
  if (!robotsAllows(robots, AGENT, `${target.pathname}${target.search}`)) return { status: 'bloque', detail: 'interdit par le robots.txt du site' };
  let response: Response;
  try {
    response = await request(url);
  } catch (error) {
    return { status: 'erreur', detail: reason(error) };
  }
  const type = response.headers.get('content-type') ?? '';
  if (!response.ok) return { status: 'erreur', detail: `HTTP ${response.status}`, http: response.status, type };
  try {
    return { status: 'ok', entries: parseFeed(await response.text(), response.url || url, timezone), http: response.status, type };
  } catch (error) {
    if (error instanceof UnreadableFeedError) return { status: 'illisible', detail: error.message, http: response.status, type };
    return { status: 'erreur', detail: reason(error), http: response.status, type };
  }
}

function readCache(): VeilleCache {
  try {
    return veilleCacheSchema.parse(JSON.parse(readFileSync(CACHE, 'utf8')));
  } catch {
    return emptyCache();
  }
}

const sources = config.veilleSources.sources.filter((s) => s.url && (diagnostic || s.enabled) && (!only || s.id === only));
if (only && sources.length === 0) {
  console.error(`Erreur : source « ${only} » introuvable, sans adresse ou désactivée (essayez --diagnostic).`);
  process.exit(1);
}

const before = readCache();
const cache: VeilleCache = structuredClone(before);
const now = new Date();
const added: string[] = [];
const failing: string[] = [];
for (const source of sources) {
  const outcome = await collect(source.url as string);
  if (diagnostic) {
    const latest = outcome.status === 'ok' ? outcome.entries.map((e) => e.published?.toISOString() ?? '').sort().at(-1) : '';
    const count = outcome.status === 'ok' ? `${outcome.entries.length} entrée(s), la plus récente : ${latest || 'sans date'}` : outcome.detail;
    const state = sourceState(source, outcome, now, timezone);
    const status = state.status === outcome.status ? state.status : `${outcome.status}, ${state.status} (${state.detail})`;
    console.log(`${source.enabled ? '●' : '○'} ${source.id} : ${status}${outcome.http ? ` (HTTP ${outcome.http}, ${outcome.type || 'type inconnu'})` : ''} : ${count}`);
    if (outcome.status === 'ok') {
      for (const e of outcome.entries.slice(0, 3)) {
        console.log(`    « ${e.title} » ${e.url}`);
        // Début du résumé : ce que les mots-clés peuvent retenir en plus du titre.
        if (e.summary) console.log(`      ${e.summary.slice(0, 200)}${e.summary.length > 200 ? '…' : ''}`);
      }
    }
    continue;
  }
  const count = applyOutcome(cache, { ...source, organisme: source.organisme ?? '' }, outcome, now, timezone, config.veilleSources.retentionMonths);
  if (count > 0) added.push(`${source.id} ${count}`);
  if (outcome.status !== 'ok') failing.push(`${source.id} (${outcome.status} : ${outcome.detail})`);
}

if (!diagnostic) {
  prune(cache, config.veilleSources.sources.map((s) => s.id), now, timezone, config.veilleSources.retentionMonths);
  const { text, changed } = serializeCache(before, cache, now, timezone);
  if (changed) writeFileSync(CACHE, text);
  const total = added.reduce((sum, a) => sum + Number(a.split(' ')[1]), 0);
  console.log(`${sources.length} source(s) collectée(s), ${total} nouvelle(s) publication(s)${added.length ? ` : ${added.join(', ')}` : ''}.`);
  if (failing.length) console.log(`Sources en échec : ${failing.join('; ')}.`);
  console.log(changed ? `${CACHE} mis à jour.` : `${CACHE} inchangé.`);
  // Tâche GitHub : message du commit, créé seulement si le cache a changé.
  if (process.env.GITHUB_OUTPUT) {
    const message = total > 0 ? `chore(veille): ${total} nouvelle${total > 1 ? 's' : ''} publication${total > 1 ? 's' : ''}` : 'chore(veille): état des sources';
    appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\nmessage=${message}\n`);
  }
}
