// Lecture du contenu depuis le disque pour le script check, hors d'Astro : mêmes dossiers, mêmes schémas
// et mêmes identifiants que content.config.ts. Les images restent des chemins dont on vérifie l'existence.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { load, YAMLException } from 'js-yaml';
import { z } from '../zod.ts';
import { problemsFromZod } from '../errors.ts';
import { COLLECTIONS, COLLECTION_NAMES } from '../content/collections.ts';
import { SLUG_PATTERN } from '../content/fields.ts';
import type { GraphProblem, RawCollections, RawEntry } from '../content/graph.ts';

export type LoadedContent = {
  raw: RawCollections;
  problems: GraphProblem[];
  // Images citées par les champs des contenus (chemins absolus).
  images: Set<string>;
  // Ligne du fichier où commence le corps MDX, pour situer les erreurs des blocs et des liens.
  bodyStart: Map<string, number>;
};

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
const WHOLE_FILE = 'fichier entier';

const toPosix = (path: string) => path.split(sep).join('/');

// Chemin d'image relatif au fichier, comme image() d'Astro ; l'image doit exister.
function imageField(base: string, images: Set<string>) {
  return () =>
    z.string().superRefine((value, check) => {
      if (/^https?:\/\//.test(value)) {
        check.addIssue({ code: 'custom', message: 'Image distante non prise en charge : enregistrez-la dans content/images/.' });
        return;
      }
      const target = resolve(base, value);
      if (existsSync(target)) images.add(target);
      else check.addIssue({ code: 'custom', message: `Image introuvable : « ${value} » (chemin relatif au fichier).` });
    });
}

type Parsed = { data: unknown; body?: string; bodyLine?: number } | { error: string };

function parse(text: string, extension: 'mdx' | 'json'): Parsed {
  if (extension === 'json') {
    try {
      return { data: JSON.parse(text) };
    } catch (error) {
      const where = /line (\d+) column (\d+)/.exec(String(error));
      const place = where ? ` près de la ligne ${where[1]}, colonne ${where[2]}` : '';
      return { error: `JSON invalide${place} : virgule en trop ou manquante, guillemet ou accolade non fermés.` };
    }
  }
  const match = FRONTMATTER.exec(text);
  if (!match) return { error: 'Entête manquant : le fichier doit commencer par une ligne « --- ».' };
  try {
    const data = load(match[1] ?? '') ?? {};
    return { data, body: text.slice(match[0].length), bodyLine: match[0].split('\n').length };
  } catch (error) {
    const line = error instanceof YAMLException ? error.mark.line + 2 : undefined;
    return { error: `Entête invalide${line ? ` à la ligne ${line}` : ''} : vérifiez l'indentation, les deux-points et les guillemets.` };
  }
}

export function loadContent(root: string): LoadedContent {
  const problems: GraphProblem[] = [];
  const images = new Set<string>();
  const bodyStart = new Map<string, number>();
  const raw = {} as RawCollections;
  const report = (file: string, message: string, severity: GraphProblem['severity'] = 'bloquant') =>
    problems.push({ file, field: WHOLE_FILE, message, rule: 'fichier', severity });

  for (const name of COLLECTION_NAMES) {
    const { directory, extension, schema } = COLLECTIONS[name];
    const entries: RawEntry[] = [];
    raw[name] = entries;
    const dir = join(root, directory);
    if (!existsSync(dir)) continue;
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      if (item.name.startsWith('.')) continue;
      const file = toPosix(relative(root, join(dir, item.name)));
      if (item.isDirectory()) {
        report(file, `Sous-dossier non pris en charge : placez les fichiers directement dans ${directory}/.`);
        continue;
      }
      const id = basename(item.name, extname(item.name));
      if (extname(item.name) !== `.${extension}`) {
        report(file, `Fichier ignoré par le site : l'extension attendue est « .${extension} ».`, 'avertissement');
        continue;
      }
      if (!SLUG_PATTERN.test(id)) {
        report(file, `Nom de fichier invalide : lettres minuscules sans accents, chiffres et tirets seulement (ex. « loi-c-15.${extension} »).`);
        continue;
      }
      const parsed = parse(readFileSync(join(dir, item.name), 'utf8'), extension);
      if ('error' in parsed) {
        report(file, parsed.error);
        continue;
      }
      const result = schema({ image: imageField(dirname(join(dir, item.name)), images) }).safeParse(parsed.data);
      if (!result.success) {
        problems.push(...problemsFromZod(file, result.error).map((p) => ({ ...p, rule: 'schema', severity: 'bloquant' as const })));
        continue;
      }
      if (parsed.bodyLine) bodyStart.set(file, parsed.bodyLine);
      entries.push({ id, data: result.data, body: parsed.body, filePath: file });
    }
  }
  return { raw, problems, images, bodyStart };
}
