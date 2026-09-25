// Collections Astro : chaque dossier de content/ est validé par son schéma au build.
// L'inventaire (dossiers, formats, schémas) vit dans src/lib/content/collections.ts.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { COLLECTIONS, type CollectionName } from './lib/content/collections.ts';

function collection<N extends CollectionName>(name: N) {
  const def = COLLECTIONS[name];
  return defineCollection({
    loader: glob({ pattern: `**/*.${def.extension}`, base: `./${def.directory}` }),
    schema: ({ image }) => def.schema({ image }) as ReturnType<(typeof COLLECTIONS)[N]['schema']>,
  });
}

export const collections = {
  articles: collection('articles'),
  dossiers: collection('dossiers'),
  guides: collection('guides'),
  juridictions: collection('juridictions'),
  organismes: collection('organismes'),
  textes: collection('textes'),
  traitements: collection('traitements'),
  lexique: collection('lexique'),
  newsletters: collection('newsletters'),
  pages: collection('pages'),
  sources: collection('sources'),
  agenda: collection('agenda'),
  auteurs: collection('auteurs'),
  categories: collection('categories'),
  themes: collection('themes'),
  formats: collection('formats'),
  activites: collection('activites'),
  contribuables: collection('contribuables'),
};
