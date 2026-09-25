// Cartes Open Graph de chaque page qui en a une (ARCHITECTURE, section 13) : adresse de l'image (/og/…png),
// puce (catégorie ou type de fiche), sigle et titre. Une page dont l'auteur a choisi une image de partage
// (seo.socialImage) n'en a pas besoin.
import { getConfig } from '../config/index.ts';
import type { Entry, Graph } from '../content/graph.ts';
import { enumLabel, t } from '../i18n.ts';
import { ogImagePath } from './meta.ts';
import type { OgCard } from './og-image.ts';

export const OG_COLLECTIONS = ['articles', 'guides', 'dossiers', 'juridictions', 'organismes', 'textes', 'traitements', 'lexique', 'pages', 'newsletters'] as const;
type OgCollection = (typeof OG_COLLECTIONS)[number];

function cardOf(graph: Graph, entry: Entry<OgCollection>): OgCard {
  switch (entry.collection) {
    case 'articles':
    case 'guides': {
      const d = (entry as Entry<'articles' | 'guides'>).data;
      return { title: d.title, badge: graph.get('categories', d.category)?.data.label ?? t('search.types.guides') };
    }
    case 'dossiers': {
      const d = (entry as Entry<'dossiers'>).data;
      return { title: d.title, badge: t('ogImage.dossier') };
    }
    case 'juridictions':
      return { title: (entry as Entry<'juridictions'>).data.name, badge: t('ogImage.juridiction') };
    case 'organismes': {
      const d = (entry as Entry<'organismes'>).data;
      return { title: d.name, badge: t('ogImage.organisme'), mark: d.acronym || undefined };
    }
    case 'textes': {
      const d = (entry as Entry<'textes'>).data;
      return { title: d.title, badge: enumLabel('textType', d.type) };
    }
    case 'traitements':
      return { title: (entry as Entry<'traitements'>).data.title, badge: t('ogImage.traitement') };
    case 'lexique':
      return { title: (entry as Entry<'lexique'>).data.term, badge: t('ogImage.lexique') };
    case 'newsletters': {
      const d = (entry as Entry<'newsletters'>).data;
      return { title: d.subject, badge: t('ogImage.newsletter', { n: d.issueNumber }) };
    }
    default:
      return { title: (entry as Entry<'pages'>).data.title };
  }
}

// Chemin de l'image sans « /og/ » ni « .png » : paramètre de la route src/pages/og/[...path].png.ts.
const routeParam = (url: string) => ogImagePath(url).replace(/^\/og\//, '').replace(/\.png$/, '');

export function ogCards(graph: Graph): Array<{ path: string; card: OgCard }> {
  const { site } = getConfig();
  const pages = OG_COLLECTIONS.flatMap((collection) =>
    graph
      .all(collection)
      .filter((e) => e.visibility.visible && e.url && !(e.data as { seo?: { socialImage?: unknown } }).seo?.socialImage)
      .map((e) => ({ path: routeParam(e.url ?? '/'), card: cardOf(graph, e) })),
  );
  return [{ path: routeParam('/'), card: { title: site.baseline, mark: site.name } }, ...pages];
}
