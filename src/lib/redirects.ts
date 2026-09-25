// Redirections permanentes (ARCHITECTURE, section 8.3) : les anciennes adresses ne meurent jamais. Deux
// sources : les anciennes adresses des contenus publiés (previousSlugs) et config/redirects.json. Écrites dans
// dist/_redirects, au format de Cloudflare, dans la limite de 2 000 règles.
import type { Graph } from './content/graph.ts';
import { hubUrl } from './content/breadcrumbs.ts';
import { entryUrl } from './urls.ts';
import type { CollectionName } from './content/collections.ts';

export const REDIRECT_LIMIT = 2000;
export type Redirect = { from: string; to: string; status: 301 | 302; source: string };
export type RedirectIssue = { kind: 'doublon' | 'masque' | 'boucle' | 'destination' | 'limite'; source: string; message: string; severity: 'bloquant' | 'avertissement' };

const SLUG_COLLECTIONS = ['articles', 'guides', 'dossiers'] as const;
const PAGE_COLLECTIONS: CollectionName[] = ['articles', 'guides', 'dossiers', 'juridictions', 'organismes', 'textes', 'traitements', 'lexique', 'auteurs', 'newsletters', 'pages', 'categories', 'themes', 'formats'];
const HUBS = ['articles', 'dossiers', 'guides', 'juridictions', 'organismes', 'textes', 'traitements', 'lexique', 'agenda', 'veille', 'auteurs', 'newsletter', 'recherche'] as const;

export function collectRedirects(graph: Graph): Redirect[] {
  const fromContent = SLUG_COLLECTIONS.flatMap((collection) =>
    graph
      .all(collection)
      .filter((entry) => entry.visibility.visible && entry.url)
      .flatMap((entry) => entry.data.previousSlugs.map((old) => ({ from: entryUrl(collection, old) ?? `/${old}/`, to: entry.url ?? '/', status: 301 as const, source: entry.file }))),
  );
  const fromConfig = graph.config.redirects.redirects.map((r) => ({ from: r.from, to: r.to, status: r.status, source: 'config/redirects.json' }));
  return [...fromContent, ...fromConfig];
}

// Adresses des pages du site d'après le graphe (contrôle avant le build ; au build, la liste réelle des pages).
export function siteUrls(graph: Graph): Set<string> {
  const urls = new Set<string>(['/', ...HUBS.map((hub) => hubUrl(hub))]);
  for (const collection of PAGE_COLLECTIONS) {
    for (const entry of graph.all(collection)) if (entry.visibility.visible && entry.url) urls.add(entry.url);
  }
  return urls;
}

const pathOf = (url: string) => url.split(/[?#]/)[0] ?? url;

// Destination finale d'une redirection, chaînes suivies (A → B → C devient A → C) ; undefined en cas de boucle.
function finalTarget(start: Redirect, byFrom: Map<string, Redirect>): string | undefined {
  const seen = new Set([start.from]);
  let to = start.to;
  for (let next = byFrom.get(pathOf(to)); next; next = byFrom.get(pathOf(to))) {
    if (seen.has(next.from)) return undefined;
    seen.add(next.from);
    to = next.to;
  }
  return to;
}

export function resolveRedirects(redirects: readonly Redirect[], live: ReadonlySet<string>): { rules: Redirect[]; issues: RedirectIssue[] } {
  const issues: RedirectIssue[] = [];
  const byFrom = new Map<string, Redirect>();
  for (const redirect of redirects) {
    const other = byFrom.get(redirect.from);
    if (other) issues.push({ kind: 'doublon', source: redirect.source, message: `L'ancienne adresse ${redirect.from} est déjà redirigée (${other.source}).`, severity: 'bloquant' });
    else byFrom.set(redirect.from, redirect);
    if (live.has(redirect.from)) issues.push({ kind: 'masque', source: redirect.source, message: `${redirect.from} est l'adresse d'une page du site : la redirection la masquerait.`, severity: 'bloquant' });
  }
  const rules: Redirect[] = [];
  for (const redirect of byFrom.values()) {
    const to = finalTarget(redirect, byFrom);
    if (to === undefined) {
      issues.push({ kind: 'boucle', source: redirect.source, message: `Boucle de redirections à partir de ${redirect.from}.`, severity: 'bloquant' });
      continue;
    }
    if (to.startsWith('/') && !live.has(pathOf(to))) issues.push({ kind: 'destination', source: redirect.source, message: `${redirect.from} mène à ${to}, qui n'est pas une page du site.`, severity: 'avertissement' });
    rules.push({ ...redirect, to });
  }
  if (rules.length > REDIRECT_LIMIT) issues.push({ kind: 'limite', source: 'config/redirects.json', message: `${rules.length} redirections : au-delà de la limite de ${REDIRECT_LIMIT} de Cloudflare.`, severity: 'bloquant' });
  return { rules, issues };
}

export function renderRedirects(rules: readonly Redirect[]): string {
  return rules.map((r) => `${r.from} ${r.to} ${r.status}`).join('\n') + (rules.length > 0 ? '\n' : '');
}
