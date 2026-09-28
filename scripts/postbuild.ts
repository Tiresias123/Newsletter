// Contrôles du site construit, après Astro et Pagefind (npm run build) : voir src/lib/check/build-output.ts.
// En production, filet de sécurité des adresses disparues (src/lib/check/vanished.ts).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { checkBuildOutput, listFiles } from '../src/lib/check/build-output.ts';
import { PLACEHOLDER_URL } from '../src/lib/check/index.ts';
import { loadContent } from '../src/lib/check/load.ts';
import { fetchOnlineUrls, vanishedUrls } from '../src/lib/check/vanished.ts';
import { getConfig } from '../src/lib/config/index.ts';
import { COLLECTION_NAMES } from '../src/lib/content/collections.ts';
import { buildGraph } from '../src/lib/content/graph.ts';
import { headersFile, inlineScriptHashes } from '../src/lib/security/headers.ts';
import { previewBuild } from '../src/lib/site-mode.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = `${root}dist/`;

// En-têtes des fichiers statiques : CSP avec l'empreinte de chaque script intégré aux pages construites.
const { services } = getConfig();
const hashes = listFiles(dist)
  .filter((file) => file.endsWith('.html'))
  .flatMap((file) => inlineScriptHashes(readFileSync(file, 'utf8')));
const { analytics: audience } = services;
const analytics = audience.enabled && audience.websiteId ? { script: new URL(audience.scriptUrl).origin, collect: audience.collectOrigins } : undefined;
writeFileSync(`${dist}_headers`, headersFile({ hashes, analytics }));

const report = checkBuildOutput(dist);
const pages = `${report.indexedPages} ${report.indexedPages > 1 ? 'pages indexées' : 'page indexée'}`;
console.log(`Site construit : ${report.files} fichiers, ${pages} pour la recherche.`);

const { site } = getConfig();
if (!previewBuild() && site.url !== PLACEHOLDER_URL) {
  const online = await fetchOnlineUrls(site.url);
  if (!online) {
    report.warnings.push(`plan du site en ligne injoignable (${site.url}) : contrôle des adresses disparues sauté.`);
  } else {
    const produced = new Set(listFiles(dist).filter((f) => f.endsWith('index.html')).map((f) => `/${f.slice(dist.length).replace(/index\.html$/, '')}`));
    const redirected = new Set(readFileSync(`${dist}_redirects`, 'utf8').split('\n').map((line) => line.split(' ')[0] ?? '').filter(Boolean));
    const graph = buildGraph(loadContent(root).raw, getConfig(), { now: new Date(), includeDrafts: false, timezone: site.timezone });
    const drafts = new Set(COLLECTION_NAMES.flatMap((c) => graph.all(c)).filter((e) => !e.visibility.visible && e.url).map((e) => e.url ?? ''));
    for (const { path, unpublished } of vanishedUrls(online, produced, redirected, drafts)) {
      if (unpublished) console.log(`Information : ${path} n'est plus publiée (contenu repassé en brouillon).`);
      else report.warnings.push(`adresse disparue sans redirection : ${path}. Si le contenu a été renommé, ajoutez son ancienne adresse dans « previousSlugs » ou dans config/redirects.json.`);
    }
  }
}
for (const warning of report.warnings) console.warn(`Attention : ${warning}`);
for (const error of report.errors) console.error(`Erreur : ${error}`);
process.exitCode = report.errors.length > 0 ? 1 : 0;
