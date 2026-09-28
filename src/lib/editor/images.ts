// Champs d'image de l'éditeur. Chaque entrée range ses images dans content/images/<dossier>/<identifiant>/
// (dossier de la collection : src/lib/content/collections.ts). Keystatic y nomme une image de champ d'après
// le champ (cover/src.webp) ; une image du corps garde son nom, mis en minuscules sans accents. Un chemin
// hors de ce dossier serait effacé à l'enregistrement : le script check le signale (ARCHITECTURE, 4.3).
import { fields } from '@keystatic/core';
import { COLLECTIONS, type CollectionName } from '../content/collections.ts';
import { labelled } from './labels.ts';

export function imageFolder(collection: CollectionName): string {
  const folder = (COLLECTIONS[collection] as { images?: string }).images;
  if (!folder) throw new Error(`La collection « ${collection} » n'a pas de dossier d'images (src/lib/content/collections.ts).`);
  return folder;
}

// « Photo Été 2026.JPG » devient « photo-ete-2026.jpg » : le site ne retrouve les images qu'en minuscules.
export function safeImageName(name: string): string {
  const dot = name.lastIndexOf('.');
  const [base, extension] = dot > 0 ? [name.slice(0, dot), name.slice(dot + 1)] : [name, ''];
  const clean = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  return extension ? `${clean(base) || 'image'}.${clean(extension)}` : clean(base) || 'image';
}

// Image d'un champ (couverture, image de partage, logo, photo) : chemin relatif au fichier de contenu.
export const image = (key: string, collection: CollectionName, scope?: string) => {
  const folder = imageFolder(collection);
  return fields.image({ ...labelled(key, scope), directory: `content/images/${folder}`, publicPath: `../images/${folder}/` });
};

// Image du bloc Image : chemin relatif à content/images/, comme l'attend src/components/mdx/Image.astro.
export const bodyImage = (collection: CollectionName) => {
  const folder = imageFolder(collection);
  return fields.image({
    ...labelled('src', 'Image'),
    directory: `content/images/${folder}`,
    publicPath: `${folder}/`,
    transformFilename: safeImageName,
    validation: { isRequired: true },
  });
};
