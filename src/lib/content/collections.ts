// Inventaire des collections : dossier, format de fichier et schéma.
// Partagé par content.config.ts (Astro) et par le script check (Node), pour qu'ils ne divergent jamais.
import type { z } from '../zod.ts';
import type { SchemaContext } from './fields.ts';
import {
  agendaSchema,
  articleSchema,
  auteurSchema,
  categorySchema,
  dossierSchema,
  formatSchema,
  guideSchema,
  jurisdictionSchema,
  lexiqueSchema,
  newsletterSchema,
  organismeSchema,
  pageSchema,
  simpleTaxonomySchema,
  sourceSchema,
  texteSchema,
  themeSchema,
  traitementSchema,
} from './schemas.ts';

export type CollectionDefinition = {
  directory: string;
  extension: 'mdx' | 'json';
  schema: (ctx: SchemaContext) => z.ZodType;
};

export const COLLECTIONS = {
  articles: { directory: 'content/articles', extension: 'mdx', schema: articleSchema },
  dossiers: { directory: 'content/dossiers', extension: 'mdx', schema: dossierSchema },
  guides: { directory: 'content/guides', extension: 'mdx', schema: guideSchema },
  juridictions: { directory: 'content/juridictions', extension: 'mdx', schema: jurisdictionSchema },
  organismes: { directory: 'content/organismes', extension: 'mdx', schema: organismeSchema },
  textes: { directory: 'content/textes', extension: 'mdx', schema: texteSchema },
  traitements: { directory: 'content/traitements-fiscaux', extension: 'mdx', schema: traitementSchema },
  lexique: { directory: 'content/lexique', extension: 'mdx', schema: lexiqueSchema },
  newsletters: { directory: 'content/newsletters', extension: 'mdx', schema: newsletterSchema },
  pages: { directory: 'content/pages', extension: 'mdx', schema: pageSchema },
  sources: { directory: 'content/sources', extension: 'json', schema: sourceSchema },
  agenda: { directory: 'content/agenda', extension: 'json', schema: agendaSchema },
  auteurs: { directory: 'content/auteurs', extension: 'json', schema: auteurSchema },
  categories: { directory: 'content/taxonomies/categories', extension: 'json', schema: categorySchema },
  themes: { directory: 'content/taxonomies/themes', extension: 'json', schema: themeSchema },
  formats: { directory: 'content/taxonomies/formats', extension: 'json', schema: formatSchema },
  activites: { directory: 'content/taxonomies/activites-fiscales', extension: 'json', schema: simpleTaxonomySchema },
  contribuables: { directory: 'content/taxonomies/types-contribuables', extension: 'json', schema: simpleTaxonomySchema },
} as const satisfies Record<string, CollectionDefinition>;

export type CollectionName = keyof typeof COLLECTIONS;
export const COLLECTION_NAMES = Object.keys(COLLECTIONS) as CollectionName[];

// Données validées d'une collection (images résolues en chaîne ou en objet selon le contexte).
export type CollectionData<C extends CollectionName> = z.output<ReturnType<(typeof COLLECTIONS)[C]['schema']>>;
