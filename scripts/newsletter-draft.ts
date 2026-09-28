// npm run newsletter:draft : prépare le prochain numéro de l'infolettre (ARCHITECTURE, section 11.4).
//   sans option : écrit content/newsletters/AAAA-NNN.mdx en brouillon, avec les articles publiés et proposés
//                 depuis le dernier envoi ;
//   --html [id] : après relecture, produit exports/infolettre/<id>.html et <id>.txt, à coller dans l'éditeur
//                 « code HTML » du fournisseur (par défaut, le numéro le plus récent).
// L'envoi reste un geste humain, fait dans l'interface du fournisseur.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { findMarkers } from '../src/lib/check/markers.ts';
import { loadContent } from '../src/lib/check/load.ts';
import { getConfig } from '../src/lib/config/index.ts';
import { buildGraph } from '../src/lib/content/graph.ts';
import { entryFile } from '../src/lib/editor/roundtrip.ts';
import { emailStyles, renderEmail } from '../src/lib/newsletter/email.ts';
import { issueEmail, nextIssue } from '../src/lib/newsletter/issue.ts';
import { markdownToEmail } from '../src/lib/newsletter/markdown.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
process.chdir(root);
const config = getConfig();
const content = loadContent(root);
const graph = buildGraph(content.raw, config, { now: new Date(), includeDrafts: false, timezone: config.site.timezone });
const args = process.argv.slice(2);

async function draft() {
  const next = nextIssue(graph);
  const file = `content/newsletters/${next.id}.mdx`;
  if (existsSync(`${root}${file}`)) throw new Error(`${file} existe déjà.`);
  const data = {
    subject: "[À COMPLÉTER PAR L'AUTEUR] Sujet du numéro",
    preheader: "[À COMPLÉTER PAR L'AUTEUR] Texte d'aperçu, affiché après le sujet dans la boîte de réception",
    issueNumber: next.issueNumber,
    status: 'brouillon',
    articles: next.articles,
    list: (config.newsletter.lists.find((l) => l.enabled) ?? config.newsletter.lists[0])?.id,
  };
  // Écrit comme l'éditeur l'écrirait : un premier enregistrement dans l'éditeur ne changera rien.
  const entry = await entryFile('newsletters', next.id, data, "[À COMPLÉTER PAR L'AUTEUR] Mot d'introduction du numéro.\n");
  if (entry.valid !== true) throw new Error(`numéro refusé par l'éditeur : ${entry.valid}`);
  writeFileSync(`${root}${entry.path}`, entry.files.find((f) => f.path === entry.path)?.text ?? '');
  console.log(`Numéro ${next.issueNumber} préparé : ${file}`);
  console.log(`${next.articles.length} article(s) publié(s) depuis le ${next.since} : ${next.articles.join(', ') || 'aucun'}.`);
  if (next.unsentDrafts.length > 0) console.log(`À noter : numéro(s) encore en brouillon : ${next.unsentDrafts.join(', ')}.`);
  console.log('Relisez-le, puis lancez « npm run newsletter:draft -- --html » pour produire le courriel.');
}

function html(id?: string) {
  const issues = graph.all('newsletters').sort((a, b) => b.data.issueNumber - a.data.issueNumber);
  const issue = id ? graph.get('newsletters', id) : issues[0];
  if (!issue) throw new Error(id ? `Numéro introuvable : content/newsletters/${id}.mdx.` : 'Aucun numéro dans content/newsletters/.');
  const intro = markdownToEmail(issue.body, config.site.url, emailStyles(config.theme));
  const { data, problems } = issueEmail(graph, issue, intro);
  const { html: page, text } = renderEmail(data, config.theme);
  const dir = `${root}exports/infolettre/`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}${issue.id}.html`, page);
  writeFileSync(`${dir}${issue.id}.txt`, text);
  console.log(`Courriel du numéro ${issue.data.issueNumber} : exports/infolettre/${issue.id}.html (et .txt, version texte brut).`);
  const markers = [...new Set([...findMarkers(page), ...findMarkers(text)])];
  for (const warning of [...intro.warnings, ...problems]) console.warn(`Attention : ${warning}`);
  if (markers.length > 0) console.warn(`Attention : le courriel contient encore des marqueurs (${markers.join(', ')}) : à remplacer avant l'envoi.`);
}

try {
  const at = args.indexOf('--html');
  if (at >= 0) html(args[at + 1]);
  else await draft();
} catch (error) {
  console.error(`Erreur : ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
