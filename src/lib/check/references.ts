// Références d'un contenu : blocs riches, liens internes et externes, images (existence, poids, usage)
// et copies archivées des sources.
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { CONFIG_FILES } from '../config/index.ts';
import type { CitedSource } from '../content/fields.ts';
import type { Severity } from '../content/graph.ts';
import { describePath } from '../errors.ts';
import { formatNumber } from '../format.ts';
import { checkBlocks } from './blocks.ts';
import type { Context } from './context.ts';
import { bodyLinks, fieldLinks, resolveInternalPath } from './links.ts';

export type Place = { file: string; where: string };

const MAX_IMAGE_BYTES = 500 * 1024;
// Parties de la configuration qui portent des liens affichés sur le site.
const LINKED_CONFIG = ['site', 'navigation', 'homepage', 'legal'] as const;

const toPosix = (path: string) => path.split(sep).join('/');
const archiveHint = (url: string) =>
  `Aucune copie archivée : créez-en une sur https://web.archive.org/save/${url}, puis collez son adresse dans « ${describePath(['archivedUrl'])} ».`;

// Corps MDX (blocs, liens, images Markdown) et liens saisis dans les champs ou la configuration.
// Renvoie les liens externes des contenus affichés, avec leurs emplacements.
export function checkBodiesAndLinks({ graph, config, entries, shown, add, root }: Context, bodyStart: Map<string, number>, usedImages: Set<string>) {
  const imagesDir = join(root, 'content', 'images');
  const external = new Map<string, Place[]>();
  const resolvers = {
    exists: (collection: 'lexique' | 'dossiers', id: string) => graph.get(collection, id) !== undefined,
    partner: (id: string) => config.ads.partners.some((p) => p.id === id),
    image: (src: string) => {
      const file = resolve(imagesDir, src);
      usedImages.add(file);
      return existsSync(file);
    },
  };
  const checkLink = (file: string, where: string, href: string, isShown: boolean) => {
    if (/^(mailto:|tel:|#)/.test(href)) return;
    const own = href === config.site.url || href.startsWith(`${config.site.url}/`);
    if (!own && /^https?:\/\//.test(href)) {
      if (isShown) external.set(href, [...(external.get(href) ?? []), { file, where }]);
      return;
    }
    const path = own ? href.slice(config.site.url.length) || '/' : href;
    if (!path.startsWith('/') || path.startsWith('//')) {
      add(file, where, `Adresse relative « ${href} » : écrivez l'adresse depuis la racine du site (« /dossiers/… »).`, 'lien-interne', 'avertissement');
      return;
    }
    const status = resolveInternalPath(path, graph);
    if (!status.ok && (!status.unpublished || isShown)) add(file, where, `Lien « ${href} » : ${status.message}`, 'lien-interne', 'avertissement');
  };

  for (const entry of entries) {
    const isShown = shown.has(entry);
    const blocking: Severity = isShown ? 'bloquant' : 'avertissement';
    const line = (n: number) => `ligne ${(bodyStart.get(entry.file) ?? 1) + n - 1}`;
    for (const p of checkBlocks(entry.body, resolvers)) add(entry.file, line(p.line), p.message, 'bloc', blocking);
    for (const link of fieldLinks(entry.data)) checkLink(entry.file, describePath(link.path ?? []), link.href, isShown);
    const { links, images } = bodyLinks(entry.body);
    for (const link of links) checkLink(entry.file, line(link.line ?? 1), link.href, isShown);
    for (const image of images) {
      const file = resolve(root, dirname(entry.file), image.src);
      usedImages.add(file);
      if (!existsSync(file)) add(entry.file, line(image.line), `Image introuvable : « ${image.src} ».`, 'image', blocking);
      if (!image.alt) add(entry.file, line(image.line), 'Image sans texte alternatif : utilisez le bloc <Image> (texte alternatif et crédit obligatoires).', 'image', blocking);
      else add(entry.file, line(image.line), 'Image sans crédit : utilisez plutôt le bloc <Image>, qui exige un crédit.', 'image', 'avertissement');
    }
  }
  for (const part of LINKED_CONFIG) {
    for (const link of fieldLinks(config[part])) checkLink(CONFIG_FILES[part], describePath(link.path ?? []), link.href, true);
  }
  return external;
}

// Poids des images et images inutilisées (dépôt qui grossit sans raison).
export function checkImages({ add, root }: Context, usedImages: Set<string>) {
  const dir = join(root, 'content', 'images');
  const stored = existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true, recursive: true }).filter((d) => d.isFile() && !d.name.startsWith('.')).map((d) => join(d.parentPath, d.name))
    : [];
  for (const file of new Set([...stored, ...usedImages])) {
    if (!existsSync(file)) continue;
    const name = toPosix(relative(root, file));
    const size = statSync(file).size;
    if (size > MAX_IMAGE_BYTES) {
      add(name, [], `Image lourde (${formatNumber(Math.round(size / 1024))} Ko, plus de 500 Ko) : réduisez-la à 2 400 pixels de large au plus, en WebP ou en JPEG de qualité 80.`, 'image', 'avertissement');
    }
    if (!usedImages.has(file)) add(name, [], 'Image utilisée par aucun contenu : supprimez-la si elle ne sert plus.', 'image', 'information');
  }
}

// Sources sans copie archivée : à corriger si la source est citée par un contenu affiché.
export function checkArchives({ graph, entries, shown, add }: Context) {
  for (const source of graph.all('sources')) {
    if (!source.data.archivedUrl) add(source.file, ['archivedUrl'], archiveHint(source.data.url), 'archive', shown.has(source) ? 'avertissement' : 'information');
  }
  for (const entry of entries.filter((e) => shown.has(e))) {
    const data = entry.data as { sources?: CitedSource[]; officialSources?: CitedSource[] };
    const field = data.sources ? 'sources' : 'officialSources';
    (data[field] ?? []).forEach((cited, i) => {
      if (cited.kind === 'ponctuelle' && !cited.archivedUrl) add(entry.file, [field, i, 'archivedUrl'], archiveHint(cited.url), 'archive', 'avertissement');
    });
  }
}
