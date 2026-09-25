// Contrôles du site construit (dist/), lancés par « npm run build » après Astro et Pagefind : index de
// recherche présent et non vide (un déploiement ne part jamais sans recherche, ARCHITECTURE section 10),
// nombre de fichiers sous le plafond de Cloudflare Workers (20 000, alerte à 15 000 ; section 19.1).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const FILE_LIMIT = 20_000;
export const FILE_WARNING = 15_000;

export type BuildReport = { errors: string[]; warnings: string[]; files: number; indexedPages: number };

export function countFiles(dir: string): number {
  return readdirSync(dir, { withFileTypes: true }).reduce((total, item) => total + (item.isDirectory() ? countFiles(join(dir, item.name)) : 1), 0);
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
  const files = countFiles(dist);
  const pages = indexedPages(dist);
  if (pages === undefined) errors.push("Index de recherche absent (dist/pagefind/) : la commande « pagefind » n'a pas été lancée après le build.");
  else if (pages === 0) errors.push("Index de recherche vide : aucune page publiée n'a été indexée.");
  if (files > FILE_LIMIT) errors.push(`${files} fichiers produits : au-delà du plafond de ${FILE_LIMIT} fichiers de Cloudflare Workers.`);
  else if (files > FILE_WARNING) warnings.push(`${files} fichiers produits : le plafond de ${FILE_LIMIT} fichiers de Cloudflare Workers approche.`);
  return { errors, warnings, files, indexedPages: pages ?? 0 };
}
