// npm run veille:fetch : collecte les fils des sources activées de config/sources-veille.json et met à jour
// data/veille/cache.json (ARCHITECTURE, section 14). Lancé par la tâche GitHub « veille » deux fois par jour
// ouvrable; le build ne télécharge jamais rien. Une source en panne ne retire rien du cache : son état est noté
// et le rapport « À vérifier » le signale.
//   --diagnostic : essaie aussi les sources désactivées qui ont une adresse, affiche le résultat, n'écrit rien;
//   --source <id> : une seule source.
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PLACEHOLDER_URL } from '../src/lib/check/context.ts';
import { getConfig } from '../src/lib/config/index.ts';
import { veilleCacheSchema, type VeilleCache } from '../src/lib/content/veille.ts';
import { createCollector, ROBOT } from '../src/lib/veille/collect.ts';
import { applyOutcome, emptyCache, matchesKeywords, prune, serializeCache, sourceState } from '../src/lib/veille/merge.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
process.chdir(root);
const CACHE = 'data/veille/cache.json';
const TIMEOUT_MS = 20_000;
const args = process.argv.slice(2);
const diagnostic = args.includes('--diagnostic');
const only = args.includes('--source') ? args[args.indexOf('--source') + 1] : undefined;

const config = getConfig();
const { timezone } = config.site;
// Robot identifié (bonne conduite, ARCHITECTURE section 14) : adresse du site une fois celui-ci en ligne, et
// courriel de contact de l'identité du site (le rapport « À vérifier » le demande).
const contact = [config.site.url !== PLACEHOLDER_URL ? `+${config.site.url.replace(/\/$/, '')}/` : '', config.site.contactEmail ?? ''].filter(Boolean).join('; ');
const AGENT = `${ROBOT}/1.0${contact ? ` (${contact})` : ''}`;
const collect = createCollector({ agent: AGENT, timeoutMs: TIMEOUT_MS, timeZone: timezone });

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
    const status = state.status !== outcome.status ? `${outcome.status}, ${state.status} (${state.detail})` : state.detail && outcome.status === 'ok' ? `ok (${state.detail})` : state.status;
    console.log(`${source.enabled ? '●' : '○'} ${source.id} : ${status}${outcome.http ? ` (HTTP ${outcome.http}, ${outcome.type || 'type inconnu'})` : ''} : ${count}`);
    if (outcome.status === 'ok') {
      // Avec des mots-clés : les entrées qu'ils retiennent (toutes dates confondues), pour les ajuster.
      const kept = source.keywords.length > 0 ? outcome.entries.filter((e) => matchesKeywords(e, source.keywords)) : outcome.entries;
      if (source.keywords.length > 0) console.log(`    ${kept.length} entrée(s) retenue(s) par les mots-clés`);
      for (const e of kept.slice(0, 3)) {
        console.log(`    « ${e.title} » ${e.url}${e.published ? ` (${e.published.toISOString().slice(0, 10)})` : ''}`);
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
