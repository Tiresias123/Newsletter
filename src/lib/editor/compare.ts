// Contrôle d'un aller-retour dans l'éditeur (npm run content:format, tests/editor.test.ts) : l'enregistrement
// ne doit changer que l'écriture du fichier, jamais ses données, son rendu ni ses images. Réservé à Node.
import { isDeepStrictEqual } from 'node:util';
import { load } from 'js-yaml';
import { mdxToHast } from 'satteri';
import { editorImageProblems, editorProblems } from '../check/editor-compat.ts';
import { parseLiteral } from '../check/literal.ts';
import * as configSchemas from '../config/schemas.ts';
import { COLLECTIONS, type CollectionName } from '../content/collections.ts';
import { z } from '../zod.ts';
import type { RoundTrip } from './roundtrip.ts';

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export const CONFIG_SCHEMAS: Record<string, z.ZodType> = {
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

export function splitEntry(text: string, extension: 'mdx' | 'json'): { data: unknown; body: string } {
  if (extension === 'json') return { data: JSON.parse(text) as unknown, body: '' };
  const match = FRONTMATTER.exec(text);
  return { data: load(match?.[1] ?? '') ?? {}, body: text.slice(match?.[0].length ?? 0) };
}

// Arbre de rendu du corps (analyseur MDX du site), sans positions, attributs triés, expressions littérales
// lues (sans exécution) : deux écritures d'une même valeur donnent le même arbre.
function clean(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(clean);
  if (!node || typeof node !== 'object') return node;
  const n = node as Record<string, unknown>;
  if (n.type === 'mdxJsxAttributeValueExpression') {
    const parsed = parseLiteral(String(n.value));
    return parsed ? { literal: parsed.value } : { source: String(n.value) };
  }
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(n).sort()) if (key !== 'position' && key !== 'data') out[key] = clean(n[key]);
  if (Array.isArray(out.attributes)) out.attributes = [...(out.attributes as Array<{ name: string }>)].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return out;
}
export const renderTree = (body: string) => JSON.stringify(clean(mdxToHast(body)));

const decode = (bytes: Uint8Array | undefined) => (bytes === undefined ? undefined : new TextDecoder().decode(bytes));

// Ce que l'enregistrement changerait au-delà de l'écriture : liste vide si seul le format change.
export function entryChanges(collection: CollectionName, path: string, text: string, input: Map<string, Uint8Array>, result: RoundTrip): string[] {
  const { extension, images } = COLLECTIONS[collection] as { extension: 'mdx' | 'json'; images?: string };
  const before = splitEntry(text, extension);
  const slug = path.slice(path.lastIndexOf('/') + 1, -extension.length - 1);
  const reasons = [
    ...editorProblems(before.body).map((p) => `ligne ${p.line} : ${p.message}`),
    ...(images ? editorImageProblems(images, slug, before.data, before.body).map((p) => p.message) : []),
  ];
  if (reasons.length > 0) return reasons;
  const moved = result.files.filter((f) => f.path !== path && decode(input.get(f.path)) !== f.text).map((f) => f.path);
  if (moved.length > 0) return [`l'éditeur écrirait ou déplacerait ${moved.join(', ')}`];
  const output = result.files.find((f) => f.path === path)?.text ?? '';
  const after = splitEntry(output, extension);
  const schema = COLLECTIONS[collection].schema({ image: () => z.string() });
  const [old, fresh] = [schema.safeParse(before.data), schema.safeParse(after.data)];
  if (!old.success) return ['données invalides : corrigez d’abord les erreurs signalées par npm run check'];
  if (!fresh.success || !isDeepStrictEqual(old.data, fresh.data)) return ["l'enregistrement changerait les données"];
  if (extension === 'mdx' && renderTree(before.body) !== renderTree(after.body)) return ["l'enregistrement changerait le rendu du texte"];
  return [];
}

export function singletonChanges(name: string, text: string, result: RoundTrip): string[] {
  const schema = CONFIG_SCHEMAS[name];
  if (!schema) return [`réglage inconnu : ${name}`];
  const [old, fresh] = [schema.safeParse(JSON.parse(text)), schema.safeParse(JSON.parse(result.files[0]?.text ?? 'null'))];
  if (!old.success) return ['réglages invalides : corrigez d’abord les erreurs signalées par npm run check'];
  if (!fresh.success || !isDeepStrictEqual(old.data, fresh.data)) return ["l'enregistrement changerait les réglages"];
  return [];
}
