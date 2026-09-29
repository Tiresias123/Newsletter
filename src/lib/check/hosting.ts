// Branchement du domaine (guide de l'auteur, section 41) : une fois la vraie adresse du site saisie, le Worker
// doit servir ce domaine (wrangler.jsonc, "routes") et fermer son adresse workers.dev, qui doublerait le site.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLACEHOLDER_URL, type Context } from './context.ts';

const FILE = 'wrangler.jsonc';
const GUIDE = "(guide de l'auteur, section 41)";

type Wrangler = { route?: unknown; routes?: unknown; workers_dev?: unknown };

// JSON avec commentaires et virgules finales, format de wrangler.jsonc; marque d'ordre des octets ignorée, comme
// le fait Wrangler. Les chaînes sont recopiées telles quelles : « // » dans une adresse n'est pas un commentaire.
export function parseJsonc(text: string): unknown {
  const source = text.replace(/^\uFEFF/, '');
  let out = '';
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      let j = i + 1;
      while (j < source.length && source[j] !== '"') j += source[j] === '\\' ? 2 : 1;
      out += source.slice(i, j + 1);
      i = j;
    } else if (c === '/' && source[i + 1] === '/') {
      while (i + 1 < source.length && source[i + 1] !== '\n') i++;
    } else if (c === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end < 0 ? source.length : end + 1;
    } else if (c === '}' || c === ']') {
      out = out.replace(/,\s*$/, '') + c;
    } else {
      out += c;
    }
  }
  return JSON.parse(out);
}

// Routes déclarées : "routes", ou "route" seule, comme l'admet Wrangler; chacune en chaîne ou en objet.
function routesOf(wrangler: Wrangler): unknown[] {
  if (Array.isArray(wrangler.routes)) return wrangler.routes;
  return wrangler.route === undefined ? [] : [wrangler.route];
}

// Nom d'hôte que sert une route : domaine personnalisé (« exemple.ca ») ou route de zone (« exemple.ca/* »).
function routeHost(route: unknown): string | undefined {
  const pattern = typeof route === 'object' && route !== null ? (route as { pattern?: unknown }).pattern : route;
  if (typeof pattern !== 'string') return undefined;
  return pattern.replace(/^https?:\/\//i, '').split('/')[0]?.replace(/\.$/, '').toLowerCase();
}

export function checkHosting({ config, add, root }: Pick<Context, 'config' | 'add' | 'root'>, read = () => readFileSync(join(root, FILE), 'utf8')): void {
  let text: string;
  try {
    text = read();
  } catch {
    // Fichier absent (jeu d'essai, configuration écrite dans un autre format) : rien à contrôler.
    return;
  }
  let wrangler: Wrangler;
  try {
    const parsed = parseJsonc(text);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error(FILE);
    wrangler = parsed as Wrangler;
  } catch {
    add(FILE, [], 'Fichier illisible (virgule, guillemet ou accolade mal placés) : le déploiement échouerait.', 'lancement', 'bloquant');
    return;
  }
  const host = config.site.url !== PLACEHOLDER_URL ? URL.parse(config.site.url)?.hostname : undefined;
  if (!host) return;
  const routes = routesOf(wrangler);
  if (!routes.some((route) => routeHost(route) === host)) {
    add(FILE, ['routes'], `Le domaine du site (${host}) n'est pas rattaché au Worker : déclarer { "pattern": "${host}", "custom_domain": true } dans "routes" ${GUIDE}.`, 'lancement', 'avertissement');
  }
  // Sans réglage explicite, Wrangler ferme l'adresse workers.dev dès qu'une route existe.
  if (wrangler.workers_dev === true || (wrangler.workers_dev === undefined && routes.length === 0)) {
    add(FILE, ['workers_dev'], `L'adresse workers.dev du Worker reste ouverte et doublerait le site : ajouter "workers_dev": false ${GUIDE}.`, 'lancement', 'avertissement');
  }
}
