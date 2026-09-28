// L'éditeur Keystatic, miroir des schémas Zod (ARCHITECTURE, section 4.3) : chaque fichier du dépôt s'ouvre
// dans l'éditeur, s'enregistre, et ressort avec les mêmes données et le même rendu ; il est déjà au format
// qu'écrit l'éditeur, pour qu'un premier enregistrement ne change rien.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { mdxToHast } from 'satteri';
import { describe, expect, it } from 'vitest';
import * as configSchemas from '../src/lib/config/schemas.ts';
import { COLLECTIONS, COLLECTION_NAMES, type CollectionName } from '../src/lib/content/collections.ts';
import editorConfig from '../src/lib/editor/index.ts';
import { entryFilesOnDisk, roundTripEntry, roundTripSingleton } from '../src/lib/editor/roundtrip.ts';
import { z } from '../src/lib/zod.ts';

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const CONFIG_SCHEMAS: Record<string, z.ZodType> = {
  site: configSchemas.siteSchema,
  navigation: configSchemas.navigationSchema,
  homepage: configSchemas.homepageSchema,
  theme: configSchemas.themeSchema,
  newsletter: configSchemas.newsletterConfigSchema,
  legal: configSchemas.legalSchema,
  veilleSources: configSchemas.veilleSourcesSchema,
  ads: configSchemas.adsSchema,
  redirects: configSchemas.redirectsSchema,
  ticker: configSchemas.tickerSchema,
  messages: configSchemas.messagesSchema,
};

// Arbre de rendu du corps (analyseur MDX du site), sans positions, attributs triés, expressions évaluées.
type Estree = { type: string; value?: unknown; elements?: Estree[]; properties?: Array<{ key: Estree & { name?: string }; value: Estree }>; operator?: string; argument?: Estree };
function evaluate(e: Estree): unknown {
  if (e.type === 'Literal') return e.value;
  if (e.type === 'ArrayExpression') return (e.elements ?? []).map(evaluate);
  if (e.type === 'ObjectExpression') return Object.fromEntries((e.properties ?? []).map((p) => [p.key.name ?? p.key.value, evaluate(p.value)]));
  if (e.type === 'UnaryExpression' && e.operator === '-') return -(evaluate(e.argument as Estree) as number);
  return `<${e.type}>`;
}
function clean(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(clean);
  if (!node || typeof node !== 'object') return node;
  const n = node as Record<string, unknown> & { data?: { estree?: { body: Array<{ expression: Estree }> } } };
  // Expression d'attribut : évaluée (contenu du dépôt, littéraux seulement), pour ignorer sa seule écriture.
  if (n.type === 'mdxJsxAttributeValueExpression') return { value: n.data?.estree ? evaluate(n.data.estree.body[0]?.expression as Estree) : (new Function(`return (${String(n.value)});`)() as unknown) };
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(n).sort()) if (key !== 'position' && key !== 'data') out[key] = clean(n[key]);
  if (Array.isArray(out.attributes)) out.attributes = [...(out.attributes as Array<{ name: string }>)].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return out;
}
const render = (body: string) => JSON.stringify(clean(mdxToHast(body)));

function split(text: string, extension: 'mdx' | 'json') {
  if (extension === 'json') return { data: JSON.parse(text) as unknown, body: '' };
  const match = FRONTMATTER.exec(text);
  return { data: load(match?.[1] ?? '') ?? {}, body: text.slice(match?.[0].length ?? 0) };
}

const files = COLLECTION_NAMES.flatMap((name) => {
  const { directory, extension } = COLLECTIONS[name];
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((file) => file.endsWith(`.${extension}`))
    .map((file) => ({ name, extension, slug: file.slice(0, -extension.length - 1), path: `${directory}/${file}` }));
});
const singletonFiles = Object.entries(editorConfig.singletons).map(([name, s]) => ({ name, path: `${(s as { path: string }).path}.json` }));

describe("formulaires de l'éditeur", () => {
  it('couvrent chaque collection du site, au même endroit et au même format', () => {
    expect(Object.keys(editorConfig.collections).sort()).toEqual([...COLLECTION_NAMES].sort());
    for (const name of COLLECTION_NAMES) {
      const col = editorConfig.collections[name] as { path: string; format: { data?: string; contentField?: string } };
      expect(col.path).toBe(`${COLLECTIONS[name].directory}/*`);
      expect(col.format.data === 'json').toBe(COLLECTIONS[name].extension === 'json');
    }
    expect(singletonFiles.every(({ path }) => existsSync(path))).toBe(true);
  });

  it('offrent chaque champ des schémas Zod, sans champ de trop', () => {
    const ctx = { image: () => z.string() };
    for (const name of COLLECTION_NAMES) {
      const zodKeys = Object.keys((COLLECTIONS[name].schema(ctx) as unknown as { shape: object }).shape).sort();
      const formKeys = Object.keys((editorConfig.collections[name] as { schema: object }).schema).filter((key) => !key.startsWith('_') && key !== 'body');
      expect([name, formKeys.sort()]).toEqual([name, zodKeys]);
    }
  });
});

describe.each(files)('$path', ({ name, extension, slug, path }) => {
  it("s'ouvre et s'enregistre dans l'éditeur sans perte ni changement", async () => {
    const text = readFileSync(path, 'utf8');
    const input = entryFilesOnDisk(name, slug);
    const result = await roundTripEntry(name, slug, input);
    expect(result.valid).toBe(true);
    // Les images restent où elles sont : aucune n'est renommée ni déplacée par l'enregistrement.
    expect(result.files.filter((f) => !input.has(f.path)).map((f) => f.path)).toEqual([]);
    const output = result.files.find((f) => f.path === path)?.text ?? '';
    const [before, after] = [split(text, extension), split(output, extension)];
    const schema = COLLECTIONS[name as CollectionName].schema({ image: () => z.string() });
    expect(schema.parse(after.data)).toEqual(schema.parse(before.data));
    if (extension === 'mdx') expect(render(after.body)).toBe(render(before.body));
    expect(output, 'Fichier hors du format de l’éditeur : lancez « npm run content:format ».').toBe(text);
  });
});

describe.each(singletonFiles)('$path', ({ name, path }) => {
  it("s'ouvre et s'enregistre dans l'éditeur sans perte ni changement", async () => {
    const text = readFileSync(path, 'utf8');
    const result = await roundTripSingleton(name, text);
    expect(result.valid).toBe(true);
    const schema = CONFIG_SCHEMAS[name] as z.ZodType;
    expect(schema.parse(JSON.parse(result.files[0]?.text ?? ''))).toEqual(schema.parse(JSON.parse(text)));
    expect(result.files[0]?.text, 'Fichier hors du format de l’éditeur : lancez « npm run content:format ».').toBe(text);
  });
});
