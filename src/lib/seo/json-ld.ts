// Données structurées schema.org (JSON-LD) par type de page (ARCHITECTURE, section 13, et brief 8.3).
// Fonctions pures : elles reçoivent des valeurs déjà résolues et renvoient des objets sérialisables.
import type { SiteConfig } from '../config/index.ts';
import type { Crumb } from '../content/breadcrumbs.ts';

export type JsonLd = Record<string, unknown>;

// Sérialisation sûre dans une balise <script> : « < » est échappé pour qu'aucun contenu ne ferme la balise.
export function serializeJsonLd(nodes: JsonLd | JsonLd[]): string {
  const data = Array.isArray(nodes) ? { '@context': 'https://schema.org', '@graph': nodes } : { '@context': 'https://schema.org', ...nodes };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export const absolute = (siteUrl: string, path: string) => new URL(path, siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`).href;

const organizationId = (siteUrl: string) => `${absolute(siteUrl, '/')}#organisation`;

export function organizationJsonLd(config: SiteConfig): JsonLd {
  const { site } = config;
  const sameAs = site.socials.filter((s) => s.enabled && /^https?:\/\//.test(s.url)).map((s) => s.url);
  return {
    '@type': 'Organization',
    '@id': organizationId(site.url),
    name: site.name,
    url: absolute(site.url, '/'),
    logo: absolute(site.url, site.logo.light || '/favicon.svg'),
    ...(sameAs.length > 0 && { sameAs }),
  };
}

export function websiteJsonLd(config: SiteConfig): JsonLd {
  const { site } = config;
  return { '@type': 'WebSite', name: site.name, url: absolute(site.url, '/'), inLanguage: site.locale, publisher: { '@id': organizationId(site.url) } };
}

export function breadcrumbJsonLd(siteUrl: string, crumbs: readonly Crumb[], currentPath: string): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      item: absolute(siteUrl, crumb.url ?? currentPath),
    })),
  };
}

export type ArticleLd = {
  type: string;
  path: string;
  headline: string;
  description: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: { name: string; path?: string };
  section?: string;
  keywords?: string[];
};

export function articleJsonLd(siteUrl: string, a: ArticleLd): JsonLd {
  return {
    '@type': a.type,
    headline: a.headline,
    description: a.description,
    url: absolute(siteUrl, a.path),
    mainEntityOfPage: absolute(siteUrl, a.path),
    inLanguage: 'fr-CA',
    ...(a.image && { image: [a.image] }),
    ...(a.datePublished && { datePublished: a.datePublished }),
    ...(a.dateModified && { dateModified: a.dateModified }),
    ...(a.author && { author: { '@type': 'Person', name: a.author.name, ...(a.author.path && { url: absolute(siteUrl, a.author.path) }) } }),
    ...(a.section && { articleSection: a.section }),
    ...(a.keywords && a.keywords.length > 0 && { keywords: a.keywords.join(', ') }),
    publisher: { '@id': organizationId(siteUrl) },
  };
}

export function faqJsonLd(items: ReadonlyArray<{ question: string; answer: string }>): JsonLd {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })),
  };
}

export function personJsonLd(siteUrl: string, p: { name: string; path: string; role?: string; description?: string; sameAs?: string[] }): JsonLd {
  return {
    '@type': 'Person',
    name: p.name,
    url: absolute(siteUrl, p.path),
    ...(p.role && { jobTitle: p.role }),
    ...(p.description && { description: p.description }),
    ...(p.sameAs && p.sameAs.length > 0 && { sameAs: p.sameAs }),
  };
}

// Organisme public : GovernmentOrganization, sauf les organismes d'autoréglementation (Organization).
export function organismeJsonLd(siteUrl: string, o: { name: string; acronym?: string; path: string; website: string; description: string; selfRegulatory: boolean }): JsonLd {
  return {
    '@type': o.selfRegulatory ? 'Organization' : 'GovernmentOrganization',
    name: o.name,
    ...(o.acronym && { alternateName: o.acronym }),
    description: o.description,
    url: absolute(siteUrl, o.path),
    sameAs: [o.website],
  };
}

export function definedTermJsonLd(siteUrl: string, term: { name: string; description: string; path: string }, setName: string): JsonLd {
  return {
    '@type': 'DefinedTerm',
    name: term.name,
    description: term.description,
    url: absolute(siteUrl, term.path),
    inDefinedTermSet: { '@type': 'DefinedTermSet', name: setName, url: absolute(siteUrl, '/lexique/') },
  };
}

// Page de fiche ou de liste : WebPage (ou un sous-type), avec le sujet décrit (juridiction, texte…).
export function webPageJsonLd(
  siteUrl: string,
  p: { type?: 'WebPage' | 'CollectionPage' | 'ProfilePage' | 'AboutPage' | 'ContactPage'; path: string; name: string; description?: string; about?: JsonLd; dateModified?: string },
): JsonLd {
  return {
    '@type': p.type ?? 'WebPage',
    name: p.name,
    url: absolute(siteUrl, p.path),
    inLanguage: 'fr-CA',
    ...(p.description && { description: p.description }),
    ...(p.about && { about: p.about }),
    ...(p.dateModified && { dateModified: p.dateModified }),
    isPartOf: { '@type': 'WebSite', url: absolute(siteUrl, '/') },
  };
}
