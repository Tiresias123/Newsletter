// Branchement du domaine (guide de l'auteur, section 41) : une fois la vraie adresse du site saisie, le Worker
// doit servir ce domaine (wrangler.jsonc, "routes") et fermer son adresse workers.dev, qui doublerait le site.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLACEHOLDER_URL, type Context } from './context.ts';

const FILE = 'wrangler.jsonc';
const GUIDE = "(guide de l'auteur, section 41)";

type Wrangler = { routes?: unknown; workers_dev?: unknown };

// JSON avec commentaires et virgules finales, format de wrangler.jsonc. Les chaînes sont recopiées telles
// quelles : « // » dans une adresse n'est pas un commentaire.
export function parseJsonc(text: string): unknown {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') j += text[j] === '\\' ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j;
    } else if (c === '/' && text[i + 1] === '/') {
      while (i + 1 < text.length && text[i + 1] !== '\n') i++;
    } else if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      i = end < 0 ? text.length : end + 1;
    } else if (c === '}' || c === ']') {
      out = out.replace(/,\s*$/, '') + c;
    } else {
      out += c;
    }
  }
  return JSON.parse(out);
}

// Domaines personnalisés déclarés : { "pattern": "exemple.ca", "custom_domain": true }.
function customDomains(routes: unknown): string[] {
  if (!Array.isArray(routes)) return [];
  return routes.flatMap((route: unknown) => {
    if (typeof route !== 'object' || route === null) return [];
    const { pattern, custom_domain } = route as { pattern?: unknown; custom_domain?: unknown };
    return custom_domain === true && typeof pattern === 'string' ? [pattern] : [];
  });
}

export function checkHosting({ config, add, root }: Pick<Context, 'config' | 'add' | 'root'>, read = () => readFileSync(join(root, FILE), 'utf8')): void {
  let wrangler: Wrangler;
  try {
    wrangler = parseJsonc(read()) as Wrangler;
  } catch {
    add(FILE, [], 'Fichier illisible (virgule, guillemet ou accolade mal placés) : le déploiement échouerait.', 'lancement', 'bloquant');
    return;
  }
  const host = config.site.url !== PLACEHOLDER_URL ? URL.parse(config.site.url)?.hostname : undefined;
  if (!host) return;
  if (!customDomains(wrangler.routes).includes(host)) {
    add(FILE, ['routes'], `Le domaine du site (${host}) n'est pas rattaché au Worker : ajouter "routes": [{ "pattern": "${host}", "custom_domain": true }] ${GUIDE}.`, 'lancement', 'avertissement');
  }
  if (wrangler.workers_dev !== false) {
    add(FILE, ['workers_dev'], `L'adresse workers.dev du Worker reste ouverte et doublerait le site : ajouter "workers_dev": false ${GUIDE}.`, 'lancement', 'avertissement');
  }
}
