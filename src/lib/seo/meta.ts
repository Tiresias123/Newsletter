// Balises d'en-tête d'une page : ce que chaque gabarit transmet à BaseLayout (ARCHITECTURE, section 13).
import type { Crumb } from '../content/breadcrumbs.ts';
import type { JsonLd } from './json-ld.ts';

export type SeoProps = {
  title?: string;
  description?: string;
  // noindex : la page reste accessible, mais hors des moteurs et du plan du site.
  noindex?: boolean;
  type?: 'website' | 'article' | 'profile';
  // Canonique imposée par l'auteur (champ seo.canonical) ; par défaut, l'adresse de la page.
  canonical?: string;
  // Image Open Graph (chemin du site) ; par défaut, celle de l'accueil.
  image?: string;
  imageAlt?: string;
  article?: { publishedTime?: string; modifiedTime?: string; author?: string; section?: string; tags?: string[] };
  // Libellés des cartes X (« Écrit par », « Durée de lecture estimée »).
  labels?: Array<{ label: string; value: string }>;
  jsonLd?: JsonLd[];
  crumbs?: Crumb[];
  // Flux propre à la page (hub de catégorie), annoncé en plus du flux général.
  rss?: { title: string; url: string };
};

// Image Open Graph d'une page : /og/<chemin de la page>.png, /og/accueil.png pour l'accueil.
export function ogImagePath(url: string): string {
  const path = url.split(/[?#]/)[0]?.replace(/^\/+|\/+$/g, '') ?? '';
  return `/og/${path || 'accueil'}.png`;
}
