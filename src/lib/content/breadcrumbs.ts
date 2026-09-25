// Fil d'Ariane de chaque type de page : affiché en tête et repris en BreadcrumbList (schema.org).
// Le dernier élément, la page courante, n'a pas de lien.
import { t } from '../i18n.ts';
import { url } from '../urls.ts';
import type { Entry, Graph } from './graph.ts';

export type Crumb = { label: string; url?: string };

type Hub = 'articles' | 'dossiers' | 'guides' | 'juridictions' | 'organismes' | 'textes' | 'traitements' | 'lexique' | 'agenda' | 'veille' | 'auteurs' | 'newsletter' | 'recherche';

const HUB_URLS: Record<Hub, string> = {
  articles: '/articles/',
  dossiers: '/dossiers/',
  guides: '/guides/',
  juridictions: '/juridictions/',
  organismes: '/organismes/',
  textes: '/textes/',
  traitements: '/fiscalite/traitements/',
  lexique: '/lexique/',
  agenda: '/agenda/',
  veille: '/veille/',
  auteurs: '/auteurs/',
  newsletter: '/newsletter/',
  recherche: '/recherche/',
};

export const home = (): Crumb => ({ label: t('breadcrumb.home'), url: url.home() });
export const hubCrumb = (hub: Hub): Crumb => ({ label: t(`hubs.${hub}.title`), url: HUB_URLS[hub] });
export const hubUrl = (hub: Hub): string => HUB_URLS[hub];

// Page d'index d'une rubrique : Accueil › Rubrique.
export const forHub = (hub: Hub): Crumb[] => [home(), { label: t(`hubs.${hub}.title`) }];

export const breadcrumbs = {
  article(graph: Graph, entry: Entry<'articles'>): Crumb[] {
    const category = graph.get('categories', entry.data.category);
    return [home(), ...(category ? [{ label: category.data.label, url: category.url }] : []), { label: entry.data.title }];
  },
  guide(entry: Entry<'guides'>): Crumb[] {
    return [home(), hubCrumb('guides'), { label: entry.data.title }];
  },
  dossier(entry: Entry<'dossiers'>): Crumb[] {
    return [home(), hubCrumb('dossiers'), { label: entry.data.shortTitle || entry.data.title }];
  },
  juridiction(graph: Graph, entry: Entry<'juridictions'>): Crumb[] {
    const parent = graph.get('juridictions', entry.data.parent);
    const parentCrumb = parent?.visibility.visible ? [{ label: parent.data.name, url: parent.url }] : [];
    return [home(), hubCrumb('juridictions'), ...parentCrumb, { label: entry.data.name }];
  },
  organisme(entry: Entry<'organismes'>): Crumb[] {
    return [home(), hubCrumb('organismes'), { label: entry.data.acronym || entry.data.name }];
  },
  texte(entry: Entry<'textes'>): Crumb[] {
    return [home(), hubCrumb('textes'), { label: entry.data.shortTitle || entry.data.title }];
  },
  traitement(graph: Graph, entry: Entry<'traitements'>): Crumb[] {
    const fiscalite = graph.get('categories', 'fiscalite');
    const parent = fiscalite ? [{ label: fiscalite.data.label, url: fiscalite.url }] : [];
    return [home(), ...parent, hubCrumb('traitements'), { label: entry.data.title }];
  },
  lexique(entry: Entry<'lexique'>): Crumb[] {
    return [home(), hubCrumb('lexique'), { label: entry.data.term }];
  },
  auteur(entry: Entry<'auteurs'>): Crumb[] {
    return [home(), hubCrumb('auteurs'), { label: entry.data.name }];
  },
  newsletter(entry: Entry<'newsletters'>): Crumb[] {
    return [home(), hubCrumb('newsletter'), { label: entry.data.subject }];
  },
  page(entry: Entry<'pages'>): Crumb[] {
    return [home(), { label: entry.data.title }];
  },
  category(entry: Entry<'categories'>): Crumb[] {
    return [home(), { label: entry.data.label }];
  },
};
