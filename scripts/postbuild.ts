// Contrôles du site construit, après Astro et Pagefind (npm run build) : voir src/lib/check/build-output.ts.
import { fileURLToPath } from 'node:url';
import { checkBuildOutput } from '../src/lib/check/build-output.ts';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const report = checkBuildOutput(dist);
const pages = `${report.indexedPages} ${report.indexedPages > 1 ? 'pages indexées' : 'page indexée'}`;
console.log(`Site construit : ${report.files} fichiers, ${pages} pour la recherche.`);
for (const warning of report.warnings) console.warn(`Attention : ${warning}`);
for (const error of report.errors) console.error(`Erreur : ${error}`);
process.exitCode = report.errors.length > 0 ? 1 : 0;
