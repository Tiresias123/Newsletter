// npm run new:article -- "Titre de l'article" : crée content/articles/<identifiant>.mdx en brouillon, prérempli,
// au format qu'écrit l'éditeur. Options, après « -- » (sinon npm les garde pour lui) : --guide (un guide),
// --categorie <id>, --format <id>, --theme <id>, --auteur <id>. Tout ce qui reste à écrire porte le marqueur
// [À COMPLÉTER PAR L'AUTEUR].
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadContent } from '../src/lib/check/load.ts';
import { getConfig } from '../src/lib/config/index.ts';
import { buildGraph } from '../src/lib/content/graph.ts';
import { newArticle } from '../src/lib/editor/new-entry.ts';
import { entryFile } from '../src/lib/editor/roundtrip.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
process.chdir(root);
const args = process.argv.slice(2);
const option = (name: string) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : undefined;
};
const title = args.filter((arg, i) => !arg.startsWith('--') && !args[i - 1]?.match(/^--(?:categorie|format|theme|auteur)$/)).join(' ');

// Option tapée avant « -- » : npm l'a prise pour lui (npm_config_guide…) et n'a transmis que sa valeur.
const OPTIONS = ['guide', 'categorie', 'format', 'theme', 'auteur'];
const swallowed = OPTIONS.filter((name) => process.env[`npm_config_${name}`] !== undefined);

try {
  if (swallowed.length > 0) throw new Error(`placez les options après « -- » : npm run new:article -- "Titre" --${swallowed[0]}${swallowed[0] === 'guide' ? '' : ' <identifiant>'}`);
  if (!title) throw new Error('titre manquant. Exemple : npm run new:article -- "Les plateformes de négociation doivent s\'inscrire"');
  const config = getConfig();
  const graph = buildGraph(loadContent(root).raw, config, { now: new Date(), includeDrafts: true, timezone: config.site.timezone });
  const article = newArticle(graph, title, { guide: args.includes('--guide'), category: option('categorie'), format: option('format'), theme: option('theme'), author: option('auteur') });
  const entry = await entryFile(article.collection, article.slug, article.data, article.body);
  if (entry.valid !== true) throw new Error(`contenu refusé par l'éditeur : ${entry.valid}`);
  if (existsSync(entry.path)) throw new Error(`${entry.path} existe déjà.`);
  writeFileSync(entry.path, entry.files.find((f) => f.path === entry.path)?.text ?? '');
  const kind = article.collection === 'guides' ? 'Guide' : 'Article';
  console.log(`${kind} créé en brouillon : ${entry.path}`);
  console.log(`Classement par défaut : ${String(article.data.category ?? '—')}, ${String(article.data.format)}, ${String((article.data.themes as string[])[0])} ; à ajuster dans l'éditeur.`);
  console.log(`Éditeur : http://127.0.0.1:4321/keystatic/collection/${article.collection}/item/${article.slug}`);
  console.log(`Aperçu : http://127.0.0.1:4321/${article.collection}/${article.slug}/ (avec « npm run dev »)`);
} catch (error) {
  console.error(`Erreur : ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
