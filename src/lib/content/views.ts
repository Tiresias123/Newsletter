// Données prêtes à afficher pour les gabarits : tout ce qui se déduit du graphe (dossier lié, sources,
// contenus liés, avertissement) est calculé ici, pour que les pages restent de simples mises en page.
import { disclaimerFor, type Disclaimer } from '../legal.ts';
import { articleCard, jurisdictionBadges, type BadgeModel, type CardModel } from './cards.ts';
import type { LegalStatus } from './enums.ts';
import type { Entry, Graph } from './graph.ts';
import { relatedEditorial, type Editorial } from './relations.ts';
import { resolveSources, type SourceItem } from './sources.ts';

export type LinkItem = { id: string; label: string; url?: string; meta?: string };

export const DOSSIER_DATES = ['proposalDate', 'publicationDate', 'adoptedDate', 'effectiveDate', 'implementationDate', 'repealDate'] as const;
export type DossierDate = (typeof DOSSIER_DATES)[number];

export type RegulationSummary = {
  title: string;
  url?: string;
  status: LegalStatus;
  authorities: LinkItem[];
  jurisdictions: BadgeModel[];
  dates: Array<{ key: DossierDate; date: string }>;
  officialSources: SourceItem[];
};

// Lien vers une entrée : sans adresse si elle n'est pas publiée (le nom reste affiché).
function link<C extends 'organismes' | 'textes' | 'traitements' | 'dossiers'>(graph: Graph, collection: C, id: string, label: (e: Entry<C>) => string): LinkItem[] {
  const entry = graph.get(collection, id);
  return entry ? [{ id, label: label(entry), url: entry.visibility.visible ? entry.url : undefined }] : [];
}

export function regulationSummary(graph: Graph, dossier: Entry<'dossiers'>): RegulationSummary {
  const d = dossier.data;
  return {
    title: d.shortTitle || d.title,
    url: dossier.visibility.visible ? dossier.url : undefined,
    status: d.legalStatus as LegalStatus,
    authorities: d.authorities.flatMap((id) => link(graph, 'organismes', id, (e) => e.data.acronym || e.data.name)),
    jurisdictions: jurisdictionBadges(graph, d.jurisdictions),
    dates: DOSSIER_DATES.flatMap((key) => (d[key] ? [{ key, date: d[key] as string }] : [])),
    officialSources: resolveSources(graph, d.sources).filter((s) => s.official),
  };
}

export type ArticleView = {
  category?: Entry<'categories'>;
  format?: Entry<'formats'>;
  jurisdictions: BadgeModel[];
  author?: Entry<'auteurs'>;
  showTrust: boolean;
  effectiveDate?: string;
  regulation?: RegulationSummary;
  sources: SourceItem[];
  related: { dossiers: LinkItem[]; textes: LinkItem[]; organismes: LinkItem[]; traitements: LinkItem[] };
  disclaimer?: Disclaimer;
  relatedCards: CardModel[];
};

export function articleView(graph: Graph, entry: Editorial): ArticleView {
  const d = entry.data;
  const category = graph.get('categories', d.category);
  const dossier = d.relatedDossiers.map((id) => graph.get('dossiers', id)).find((e) => e?.visibility.visible);
  const regulation = dossier ? regulationSummary(graph, dossier) : undefined;
  return {
    category,
    format: graph.get('formats', d.format),
    jurisdictions: jurisdictionBadges(graph, d.jurisdictions),
    author: graph.get('auteurs', d.author),
    showTrust: Boolean(category?.data.requireVerification || d.asOf || d.reviewedBy || d.corrections.length > 0),
    effectiveDate: dossier?.data.effectiveDate,
    regulation,
    sources: resolveSources(graph, d.sources),
    related: {
      dossiers: d.relatedDossiers.flatMap((id) => link(graph, 'dossiers', id, (e) => e.data.shortTitle || e.data.title)),
      textes: d.relatedTextes.flatMap((id) => link(graph, 'textes', id, (e) => e.data.shortTitle || e.data.title)),
      organismes: d.relatedOrganismes.flatMap((id) => link(graph, 'organismes', id, (e) => e.data.acronym || e.data.name)),
      traitements: d.relatedTraitements.flatMap((id) => link(graph, 'traitements', id, (e) => e.data.title)),
    },
    disclaimer: disclaimerFor(d.disclaimerVariant, category?.data.defaultDisclaimer),
    relatedCards: relatedEditorial(graph, entry).map((e) => articleCard(graph, e)),
  };
}
