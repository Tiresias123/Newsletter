// Contrôles du site construit (dist/), lancés par « npm run build » après Astro et Pagefind : index de
// recherche présent et non vide (un déploiement ne part jamais sans recherche, ARCHITECTURE section 10),
// plan du site, robots.txt et calendrier des publications programmées présents, image Open Graph de chaque
// page bien produite, nombre de fichiers sous le plafond de Cloudflare Workers (20 000, alerte à 15 000 ;
// section 19.1).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REDIRECT_LIMIT } from '../redirects.ts';

export const FILE_LIMIT = 20_000;
export const FILE_WARNING = 15_000;

export type BuildReport = { errors: string[]; warnings: string[]; files: number; indexedPages: number };

export function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((item) => (item.isDirectory() ? listFiles(join(dir, item.name)) : [join(dir, item.name)]));
}

export function countFiles(dir: string): number {
  return listFiles(dir).length;
}

// Images de partage locales (/og/… ou /_astro/…) annoncées par les pages mais absentes du site construit.
function missingSocialImages(dist: string, files: string[]): string[] {
  const missing = new Set<string>();
  for (const file of files.filter((f) => f.endsWith('.html'))) {
    const image = /<meta\s+property="og:image"\s+content="([^"]+)"/.exec(readFileSync(file, 'utf8'))?.[1];
    if (!image) continue;
    const path = new URL(image).pathname;
    if (!existsSync(join(dist, decodeURIComponent(path)))) missing.add(path);
  }
  return [...missing];
}

function indexedPages(dist: string): number | undefined {
  const entry = join(dist, 'pagefind', 'pagefind-entry.json');
  if (!existsSync(entry)) return undefined;
  const data = JSON.parse(readFileSync(entry, 'utf8')) as { languages?: Record<string, { page_count?: number }> };
  return Object.values(data.languages ?? {}).reduce((sum, language) => sum + (language.page_count ?? 0), 0);
}

export function checkBuildOutput(dist: string): BuildReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const list = listFiles(dist);
  const files = list.length;
  const pages = indexedPages(dist);
  if (pages === undefined) errors.push("Index de recherche absent (dist/pagefind/) : la commande « pagefind » n'a pas été lancée après le build.");
  else if (pages === 0) errors.push("Index de recherche vide : aucune page publiée n'a été indexée.");
  for (const required of ['sitemap-index.xml', 'robots.txt', 'schedule.json']) {
    if (!existsSync(join(dist, required))) errors.push(`${required} absent du site construit.`);
  }
  const redirects = join(dist, '_redirects');
  const rules = existsSync(redirects) ? readFileSync(redirects, 'utf8').split('\n').filter((line) => line.trim() && !line.startsWith('#')).length : 0;
  if (rules > REDIRECT_LIMIT) errors.push(`${rules} redirections dans _redirects : au-delà de la limite de ${REDIRECT_LIMIT} de Cloudflare.`);
  const images = missingSocialImages(dist, list);
  if (images.length > 0) errors.push(`Images de partage annoncées mais absentes : ${images.slice(0, 5).join(', ')}${images.length > 5 ? '…' : ''}`);
  if (files > FILE_LIMIT) errors.push(`${files} fichiers produits : au-delà du plafond de ${FILE_LIMIT} fichiers de Cloudflare Workers.`);
  else if (files > FILE_WARNING) warnings.push(`${files} fichiers produits : le plafond de ${FILE_LIMIT} fichiers de Cloudflare Workers approche.`);
  return { errors, warnings, files, indexedPages: pages ?? 0 };
}
