// Adresses du site (option C, ARCHITECTURE section 8) : un seul endroit pour les construire.
import type { CollectionName } from './content/collections.ts';

export const url = {
  home: () => '/',
  article: (id: string) => `/articles/${id}/`,
  dossier: (id: string) => `/dossiers/${id}/`,
  guide: (id: string) => `/guides/${id}/`,
  juridiction: (id: string) => `/juridictions/${id}/`,
  organisme: (id: string) => `/organismes/${id}/`,
  texte: (id: string) => `/textes/${id}/`,
  traitement: (id: string) => `/fiscalite/traitements/${id}/`,
  lexique: (id: string) => `/lexique/${id}/`,
  auteur: (id: string) => `/auteurs/${id}/`,
  newsletter: (id: string) => `/newsletter/${id}/`,
  page: (id: string) => `/${id}/`,
  category: (id: string) => `/${id}/`,
  theme: (id: string) => `/themes/${id}/`,
  format: (id: string) => `/formats/${id}/`,
  tag: (tag: string) => `/tags/${tagSlug(tag)}/`,
};

// Segment d'adresse d'une étiquette libre : minuscules, sans accents, mots reliés par des traits d'union.
export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Adresse de la page d'une entrée, pour les collections qui en ont une.
export function entryUrl(collection: CollectionName, id: string): string | undefined {
  switch (collection) {
    case 'articles':
      return url.article(id);
    case 'dossiers':
      return url.dossier(id);
    case 'guides':
      return url.guide(id);
    case 'juridictions':
      return url.juridiction(id);
    case 'organismes':
      return url.organisme(id);
    case 'textes':
      return url.texte(id);
    case 'traitements':
      return url.traitement(id);
    case 'lexique':
      return url.lexique(id);
    case 'auteurs':
      return url.auteur(id);
    case 'newsletters':
      return url.newsletter(id);
    case 'pages':
      return url.page(id);
    case 'categories':
      return url.category(id);
    case 'themes':
      return url.theme(id);
    case 'formats':
      return url.format(id);
    default:
      return undefined;
  }
}

// Premiers segments d'adresse réservés : ni une page ni une catégorie ne peut les prendre.
export const RESERVED_ROOT_SLUGS = [
  'articles',
  'dossiers',
  'guides',
  'juridictions',
  'organismes',
  'textes',
  'lexique',
  'veille',
  'agenda',
  'auteurs',
  'newsletter',
  'recherche',
  'themes',
  'tags',
  'formats',
  'api',
  'en',
  'og',
  'keystatic',
  'page',
  'exemple',
  'a-verifier',
  'fonts',
] as const;

// Attributs d'un lien qui s'ouvre dans un nouvel onglet (option openInNewTab des menus).
export function newTabAttributes(newTab: boolean): { target?: '_blank'; rel?: string } {
  return newTab ? { target: '_blank', rel: 'noopener' } : {};
}
