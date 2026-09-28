// Ouverture puis enregistrement d'une entrée comme le fait l'éditeur Keystatic 0.6.9, hors du navigateur
// (tests, scripts, mise au format). Les fonctions internes sont tirées du code livré de Keystatic et cherchées
// par leur nom : les noms de fichiers changent à chaque version. parseEntry et serializeEntryToFiles, non
// exportées, reprennent le code de keystatic-core-ui.js. Réservé à Node : jamais importé par l'éditeur.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { dump } from 'js-yaml';
import editorConfig from './index.ts';
import { MDX_OPTIONS } from './collections-editorial.ts';
import { COLLECTIONS, type CollectionName } from '../content/collections.ts';
import { bodyComponents, pageComponents } from './components.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
type Fn = (...args: Any[]) => Any;
export type RoundTrip = { valid: true | string; files: Array<{ path: string; text: string }> };

const NEEDED = [
  'parseProps',
  'serializeProps$1',
  'clientSideValidateProp',
  'toFormattedFormDataError',
  'getEntryDataFilepath',
  'getCollectionFormat',
  'getSingletonFormat',
  'getCollectionItemPath',
  'getSingletonPath',
  'loadDataFile',
] as const;

type Internals = Record<(typeof NEEDED)[number], Fn> & { fields: Any; config: Any };
let loaded: Promise<Internals> | undefined;

async function load(): Promise<Internals> {
  const dist = join(dirname(createRequire(join(process.cwd(), 'package.json')).resolve('@keystatic/core/package.json')), 'dist');
  const found = new Map<string, Fn>();
  for (const file of readdirSync(dist).filter((f) => /^(?:index|required-files)-[0-9a-f]+\.js$/.test(f))) {
    const mod = (await import(pathToFileURL(join(dist, file)).href)) as Record<string, unknown>;
    for (const value of Object.values(mod)) if (typeof value === 'function' && !found.has(value.name)) found.set(value.name, value as Fn);
  }
  const missing = NEEDED.filter((name) => !found.has(name));
  if (missing.length > 0) throw new Error(`Keystatic a changé : fonctions introuvables (${missing.join(', ')}). Adaptez src/lib/editor/roundtrip.ts.`);
  const core = (await import(pathToFileURL(join(dist, 'keystatic-core.js')).href)) as { fields: Any };
  // Corps MDX : l'analyse n'existe que dans le code destiné au navigateur ; les blocs, eux, sont identiques.
  const collections = Object.fromEntries(
    Object.entries(editorConfig.collections).map(([name, col]: [string, Any]) => [
      name,
      {
        ...col,
        schema: Object.fromEntries(
          Object.entries(col.schema).map(([key, field]: [string, Any]) => [
            key,
            field.formKind === 'content' ? core.fields.mdx({ label: field.label, components: name === 'pages' ? pageComponents() : bodyComponents(name as CollectionName), options: MDX_OPTIONS }) : field,
          ]),
        ),
      },
    ]),
  );
  // Seule dépendance au navigateur rencontrée : une extension de tableau crée un élément à l'ouverture.
  (globalThis as Any).document ??= { createElement: () => ({ classList: { add() {} }, style: {}, appendChild() {}, insertBefore() {}, setAttribute() {} }), createTextNode: () => ({}) };
  return { ...(Object.fromEntries(NEEDED.map((name) => [name, found.get(name)])) as Record<(typeof NEEDED)[number], Fn>), fields: core.fields, config: { ...editorConfig, collections } };
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Reprise de parseEntry (keystatic-core-ui.js) : fichier → état du formulaire.
function parseEntry(k: Internals, args: { dirpath: string; format: Any; schema: Any; slug?: { field: string; slug: string } }, files: Map<string, Uint8Array>) {
  const dataFilepath = k.getEntryDataFilepath(args.dirpath, args.format);
  const data = files.get(dataFilepath);
  if (!data) throw new Error(`Fichier introuvable : ${dataFilepath}`);
  const { loaded: value, extraFakeFile } = k.loadDataFile(data, args.format);
  const all = new Map(files);
  if (extraFakeFile) all.set(`${args.dirpath}/${extraFakeFile.path}`, extraFakeFile.contents);
  const filesUnder = (root: string) => new Map([...all].filter(([name]) => name.startsWith(`${root}/`)).map(([name, contents]) => [name.slice(root.length + 1), contents]));
  try {
    const slug = args.slug;
    return k.parseProps(k.fields.object(args.schema), value, [], [], (schema: Any, fieldValue: unknown, path: string[], pathWithSlugs: string[]) => {
      if (slug && path.length === 1 && path[0] === slug.field) return schema.parse(fieldValue, { slug: slug.slug });
      if (schema.formKind === 'asset') {
        const filepath = schema.filename(fieldValue, { suggestedFilenamePrefix: pathWithSlugs.join('/'), slug: args.slug?.slug });
        const base = schema.directory ? `${schema.directory}${args.slug ? `/${args.slug.slug}` : ''}` : args.dirpath;
        return schema.parse(fieldValue, { asset: filepath ? all.get(`${base}/${filepath}`) : undefined, slug: args.slug?.slug });
      }
      if (schema.formKind === 'content' || schema.formKind === 'assets') {
        const root = `${args.dirpath}/${pathWithSlugs.join('/')}`;
        const external = new Map((schema.directories ?? []).map((dir: string) => [dir, filesUnder(`${dir}${args.slug ? `/${args.slug.slug}` : ''}`)]));
        const extra = { other: filesUnder(root), external, slug: args.slug?.slug };
        return schema.formKind === 'content' ? schema.parse(fieldValue, { ...extra, content: all.get(root + schema.contentExtension) }) : schema.parse(fieldValue, extra);
      }
      return schema.parse(fieldValue, undefined);
    }, false);
  } catch (error) {
    throw k.toFormattedFormDataError(error);
  }
}

// Reprise de serializeEntryToFiles (keystatic-core-ui.js) : état → fichiers écrits.
function serializeEntry(k: Internals, args: { basePath: string; schema: Any; format: Any; state: Any; slug?: { field: string; value: string } }) {
  let { value, extraFiles } = k['serializeProps$1'](args.state, k.fields.object(args.schema), args.slug?.field, args.slug?.value, true);
  let text = args.format.data === 'json' ? `${JSON.stringify(value, null, 2)}\n` : dump(value);
  if (args.format.contentField) {
    const name = `${args.format.contentField.path.join('/')}${args.format.contentField.contentExtension}`;
    const content = extraFiles.find((file: Any) => file.path === name);
    extraFiles = extraFiles.filter((file: Any) => file !== content);
    text = `---\n${text}---\n${decoder.decode(content.contents)}`;
  }
  return [
    { path: k.getEntryDataFilepath(args.basePath, args.format), text },
    ...extraFiles.map((file: Any) => ({ path: `${file.parent ? (args.slug ? `${file.parent}/${args.slug.value}` : file.parent) : args.basePath}/${file.path}`, text: decoder.decode(file.contents) })),
  ];
}

// Validation faite au clic sur « Enregistrer » : true, ou le message de Keystatic.
function validate(k: Internals, schema: Any, state: Any, slugField?: string): true | string {
  const warn = console.warn;
  let message = 'invalide';
  console.warn = (error: unknown) => (message = String(error));
  try {
    return k.clientSideValidateProp(k.fields.object(schema), state, slugField ? { field: slugField, slugs: new Set(), glob: '*' } : undefined) ? true : message;
  } finally {
    console.warn = warn;
  }
}

export async function roundTripEntry(collection: string, slug: string, files: Map<string, Uint8Array>): Promise<RoundTrip> {
  const k = await (loaded ??= load());
  const col = k.config.collections[collection];
  const format = k.getCollectionFormat(k.config, collection);
  const dirpath = k.getCollectionItemPath(k.config, collection, slug);
  const state = parseEntry(k, { dirpath, format, schema: col.schema, slug: { field: col.slugField, slug } }, files);
  return {
    valid: validate(k, col.schema, state, col.slugField),
    files: serializeEntry(k, { basePath: dirpath, schema: col.schema, format, state, slug: { field: col.slugField, value: slug } }),
  };
}

export async function roundTripSingleton(name: string, text: string): Promise<RoundTrip> {
  const k = await (loaded ??= load());
  const schema = k.config.singletons[name].schema;
  const format = k.getSingletonFormat(k.config, name);
  const dirpath = k.getSingletonPath(k.config, name);
  const state = parseEntry(k, { dirpath, format, schema }, new Map([[k.getEntryDataFilepath(dirpath, format), encoder.encode(text)]]));
  return { valid: validate(k, schema, state), files: serializeEntry(k, { basePath: dirpath, schema, format, state }) };
}

// Fichier d'une nouvelle entrée, exactement comme l'éditeur l'écrirait (scripts new:article, newsletter:draft).
export async function entryFile(collection: string, slug: string, data: Record<string, unknown>, body = ''): Promise<RoundTrip & { path: string }> {
  const k = await (loaded ??= load());
  const format = k.getCollectionFormat(k.config, collection);
  const path = k.getEntryDataFilepath(k.getCollectionItemPath(k.config, collection, slug), format);
  const text = format.data === 'json' ? JSON.stringify(data) : `---\n${dump(data)}---\n${body}`;
  const result = await roundTripEntry(collection, slug, new Map([[path, encoder.encode(text)]]));
  return { ...result, path };
}

// Fichiers qu'ouvre l'éditeur pour une entrée : son fichier et les images de son dossier.
export function entryFilesOnDisk(collection: CollectionName, slug: string): Map<string, Uint8Array> {
  const { directory, extension } = COLLECTIONS[collection];
  const files = new Map<string, Uint8Array>([[`${directory}/${slug}.${extension}`, readFileSync(`${directory}/${slug}.${extension}`)]]);
  const folder = (COLLECTIONS[collection] as { images?: string }).images;
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const path = `${dir}/${item.name}`;
      if (item.isDirectory()) walk(path);
      else files.set(path, readFileSync(path));
    }
  };
  if (folder) walk(`content/images/${folder}/${slug}`);
  return files;
}

export const editorCollections = () => Object.keys(editorConfig.collections);
export const editorSingletons = () => Object.keys(editorConfig.singletons);
