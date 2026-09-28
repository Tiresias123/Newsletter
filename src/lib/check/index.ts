// Script check (brief, point 8.2) : mêmes schémas, même graphe et mêmes règles que le build, plus les
// contrôles du rapport « À vérifier ». Utilisé par scripts/check.ts et par la page /a-verifier/ en développement.
import { CONFIG_FILES, validateConfig, type SiteConfig } from '../config/index.ts';
import { COLLECTION_NAMES } from '../content/collections.ts';
import type { CitedSource } from '../content/fields.ts';
import { buildGraph, type Entry, type Graph, type GraphProblem, type Severity } from '../content/graph.ts';
import { veilleItems } from '../content/veille.ts';
import { describePath } from '../errors.ts';
import { formatNumber } from '../format.ts';
import { t } from '../i18n.ts';
import { contrastChecks } from '../theme/tokens.ts';
import { PLACEHOLDER_URL, type Add, type CheckMode, type Context } from './context.ts';
import { checkExternalLinks } from './external.ts';
import { checkFreshness, lastCommitDates } from './freshness.ts';
import { loadContent } from './load.ts';
import { findMarkers, markersIn } from './markers.ts';
import { checkArchives, checkBodiesAndLinks, checkImages } from './references.ts';
import { checkServices } from './services.ts';
import { checkVeille } from './veille.ts';
import { collectRedirects, resolveRedirects, siteUrls } from '../redirects.ts';

export type { CheckMode } from './context.ts';
export type CheckOptions = {
  root: string;
  mode?: CheckMode;
  now?: Date;
  externalLinks?: boolean;
  // Configuration déjà validée (tests) ; par défaut, celle de config/.
  config?: SiteConfig;
};
export type CheckResult = { mode: CheckMode; generatedAt: Date; timezone: string; problems: GraphProblem[] };

export { PLACEHOLDER_URL } from './context.ts';
// Parties de la configuration affichées sur le site (les notes de la veille, internes, n'en font pas partie).
const DISPLAYED_CONFIG = ['site', 'navigation', 'homepage', 'newsletter', 'legal', 'messages'] as const;

// Champs nommés au plus dans une ligne du rapport.
const MAX_FIELDS = 4;
const marker = (markers: string[]) => `${markers.length > 1 ? 'Marqueurs' : 'Marqueur'} à remplacer : ${markers.join(', ')}.`;

export async function runCheck({ root, mode = 'production', now = new Date(), externalLinks = false, ...options }: CheckOptions): Promise<CheckResult> {
  const problems: GraphProblem[] = [];
  const add: Add = (file, where, message, rule, severity) =>
    problems.push({ file, field: typeof where === 'string' ? where : describePath(where), message, rule, severity });

  const { config, problems: configProblems } = options.config ? { config: options.config, problems: [] } : validateConfig();
  for (const problem of configProblems) problems.push({ ...problem, rule: 'configuration', severity: 'bloquant' });
  const content = loadContent(root);
  problems.push(...content.problems);
  const timezone = config?.site.timezone ?? 'America/Toronto';
  const result: CheckResult = { mode, generatedAt: now, timezone, problems };
  // Des fichiers illisibles faussent tout le reste : on s'arrête là, comme un compilateur.
  if (!config || problems.some((p) => p.severity === 'bloquant')) {
    add('—', '—', t('report.stopped'), 'arret', 'information');
    return result;
  }

  const graph = buildGraph(content.raw, config, { now, includeDrafts: mode === 'apercu', timezone });
  problems.push(...graph.problems);
  const entries = COLLECTION_NAMES.flatMap((c) => graph.all(c) as Entry[]);
  const ctx: Context = { graph, config, entries, shown: displayedEntries(graph, entries), add, root, mode };

  for (const c of contrastChecks(config.theme)) {
    if (c.ratio < c.minimum) {
      add(CONFIG_FILES.theme, [], `${c.label} : contraste de ${formatNumber(c.ratio, 2)} pour ${formatNumber(c.minimum, 1)} exigé (${c.fg} sur ${c.bg}).`, 'contraste', 'bloquant');
    }
  }
  checkMarkers(ctx);
  const usedImages = new Set(content.images);
  const external = checkBodiesAndLinks(ctx, content.bodyStart, usedImages);
  checkImages(ctx, usedImages);
  checkArchives(ctx);
  checkFreshness(graph, entries, lastCommitDates(root), add);
  checkLaunch(ctx);
  checkServices(ctx);
  checkVeille(ctx, now);
  checkRedirects(ctx);
  if (externalLinks) {
    for (const r of await checkExternalLinks(external.keys())) {
      if (!r.ok) for (const place of external.get(r.url) ?? []) add(place.file, place.where, `Lien externe ${r.url} : ${r.detail}.`, 'lien-externe', 'avertissement');
    }
  }
  return result;
}

// Contenus affichés dans ce mode : visibles, et programmés même avant l'échéance (ils paraîtront sans nouvelle
// intervention : un marqueur oublié ferait sinon échouer chaque build à l'heure dite, sans témoin); pour les
// sources et les auteurs, cités par un tel contenu.
function displayedEntries(graph: Graph, entries: Entry[]): Set<Entry> {
  const displayed = (e: Entry) => e.visibility.visible || e.visibility.state === 'programme';
  const shown = new Set(entries.filter((e) => e.collection !== 'sources' && e.collection !== 'auteurs' && displayed(e)));
  for (const entry of [...shown]) {
    const data = entry.data as { author?: string; sources?: CitedSource[]; officialSources?: CitedSource[] };
    const author = graph.get('auteurs', data.author);
    if (author) shown.add(author);
    for (const cited of [...(data.sources ?? []), ...(data.officialSources ?? [])]) {
      const source = cited.kind === 'reference' ? graph.get('sources', cited.source) : undefined;
      if (source) shown.add(source);
    }
  }
  return shown;
}

// Marqueurs : bloquants dans un contenu affiché en production, tolérés dans les brouillons ;
// dans la configuration, tolérés jusqu'à la mise en ligne.
function checkMarkers({ config, entries, shown, add, mode }: Context) {
  const severity = (blocking: boolean): Severity => (blocking ? 'bloquant' : 'avertissement');
  // Un contenu : une seule ligne, qui nomme les champs concernés.
  for (const entry of entries.filter((e) => shown.has(e))) {
    const found = markersIn(entry.data);
    const inBody = findMarkers(entry.body);
    if (inBody.length > 0) found.push({ path: ['body'], markers: inBody });
    if (found.length === 0) continue;
    const fields = found.map((f) => describePath(f.path));
    const where = fields.length > MAX_FIELDS ? `${fields.slice(0, MAX_FIELDS).join(', ')} et ${fields.length - MAX_FIELDS} autres champs` : fields.join(', ');
    add(entry.file, where, marker([...new Set(found.flatMap((f) => f.markers))]), 'marqueur', severity(mode === 'production'));
  }
  const launched = config.site.url !== PLACEHOLDER_URL;
  for (const part of [...DISPLAYED_CONFIG, ...(config.ads.enabled ? (['ads'] as const) : [])]) {
    for (const { path, markers } of markersIn(config[part], ['note'])) add(CONFIG_FILES[part], path, marker(markers), 'marqueur', severity(launched && mode === 'production'));
  }
}

// Rappels de configuration avant la mise en ligne.
// Redirections (anciennes adresses et config/redirects.json) : doublons, boucles, pages masquées, limite.
// Entre anciennes adresses de contenus, doublons et pages masquées sont déjà signalés par rules.ts.
function checkRedirects({ graph, add }: Context) {
  for (const issue of resolveRedirects(collectRedirects(graph), siteUrls(graph)).issues) {
    const fromConfig = issue.source === CONFIG_FILES.redirects;
    if (!fromConfig && (issue.kind === 'doublon' || issue.kind === 'masque')) continue;
    add(issue.source, fromConfig ? 'redirects' : 'previousSlugs', issue.message, 'redirection', issue.severity);
  }
}

function checkLaunch({ config, add }: Context) {
  if (config.site.url === PLACEHOLDER_URL) {
    add(CONFIG_FILES.site, ['url'], `Adresse du site à saisir : tant qu'elle vaut ${PLACEHOLDER_URL}, les marqueurs de la configuration ne bloquent pas la construction.`, 'lancement', 'avertissement');
  }
  if (!config.legal.officialSourceTypesValidated) {
    add(CONFIG_FILES.legal, ['officialSourceTypesValidated'], 'Types de sources réputés officiels à valider, puis ce champ à passer à true.', 'lancement', 'avertissement');
  }
  const veille = config.homepage.sections.findIndex((s) => s.type === 'veille-latest' && s.enabled);
  if (veille >= 0 && veilleItems().length === 0) {
    add(CONFIG_FILES.homepage, ['sections', veille], "Section « veille » activée, mais le cache est vide : elle reste masquée jusqu'à la première collecte (tâche « veille » ou npm run veille:fetch).", 'lancement', 'information');
  }
}
