// npm run content:format : met chaque fichier de content/ et config/ au format qu'écrit l'éditeur Keystatic,
// pour qu'un premier enregistrement dans l'éditeur ne change rien (ARCHITECTURE, section 4.3). Seule l'écriture
// change : un fichier dont l'enregistrement changerait les données, le rendu ou les images (image renommée ou
// hors du dossier du contenu, notes collées…) est laissé tel quel et signalé (src/lib/editor/compare.ts).
// Option --verifier : liste sans rien écrire.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { COLLECTIONS, COLLECTION_NAMES } from '../src/lib/content/collections.ts';
import { entryChanges, singletonChanges } from '../src/lib/editor/compare.ts';
import editorConfig from '../src/lib/editor/index.ts';
import { entryFilesOnDisk, roundTripEntry, roundTripSingleton, type RoundTrip } from '../src/lib/editor/roundtrip.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
process.chdir(root);
const checkOnly = process.argv.includes('--verifier');
const changed: string[] = [];
const refused: string[] = [];

function apply(path: string, text: string, result: RoundTrip, changes: (result: RoundTrip) => string[]) {
  if (result.valid !== true) {
    refused.push(`${path} : ${result.valid}`);
    return;
  }
  const reasons = changes(result);
  if (reasons.length > 0) {
    refused.push(`${path} : ${reasons.join(' ; ')}`);
    return;
  }
  const output = result.files.find((file) => file.path === path)?.text;
  if (output === undefined || output === text) return;
  changed.push(path);
  if (!checkOnly) writeFileSync(path, output);
}

for (const name of COLLECTION_NAMES) {
  const { directory, extension } = COLLECTIONS[name];
  if (!existsSync(directory)) continue;
  for (const file of readdirSync(directory).filter((f) => f.endsWith(`.${extension}`))) {
    const path = `${directory}/${file}`;
    const text = readFileSync(path, 'utf8');
    try {
      const slug = file.slice(0, -extension.length - 1);
      const input = entryFilesOnDisk(name, slug);
      apply(path, text, await roundTripEntry(name, slug, input), (result) => entryChanges(name, path, text, input, result));
    } catch (error) {
      refused.push(`${path} : ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
for (const [name, singleton] of Object.entries(editorConfig.singletons)) {
  const path = `${(singleton as { path: string }).path}.json`;
  const text = readFileSync(path, 'utf8');
  try {
    apply(path, text, await roundTripSingleton(name, text), (result) => singletonChanges(name, text, result));
  } catch (error) {
    refused.push(`${path} : ${error instanceof Error ? error.message : String(error)}`);
  }
}

const verb = checkOnly ? 'à mettre au format' : 'mis au format';
console.log(`${changed.length} fichier(s) ${verb}${changed.length > 0 ? ` :\n  ${changed.join('\n  ')}` : '.'}`);
if (refused.length > 0) console.error(`\nFichiers laissés tels quels (l'éditeur ne peut pas les ouvrir, ou les modifierait) :\n  ${refused.join('\n  ')}`);
process.exitCode = refused.length > 0 || (checkOnly && changed.length > 0) ? 1 : 0;
