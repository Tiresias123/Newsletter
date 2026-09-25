// Données des fiches (brief 6.2 à 6.7) : dossier, juridiction, organisme, texte et traitement fiscal. Tout ce
// qui se déduit du graphe (fiche d'identité, listes liées, échéances, veille) est calculé ici ; les pages
// ne font que la mise en page.
import { formatDate, formatHost, formatRegion } from '../format.ts';
import { enumLabel, t } from '../i18n.ts';
import { disclaimer, disclaimerFor, type Disclaimer } from '../legal.ts';
import { articleCard, jurisdictionBadges, type CardModel } from './cards.ts';
import type { LegalStatus } from './enums.ts';
import type { Entry, Graph } from './graph.ts';
import {
  childJuridictions,
  decisionsOf,
  dossiersCiting,
  dossiersOf,
  editorialAbout,
  organismesOf,
  textesOf,
  traitementsOf,
  upcomingAgenda,
  veilleOf,
  type Editorial,
} from './relations.ts';
import { resolveSources, reusableSources, type SourceItem } from './sources.ts';
import { veilleItems } from './veille.ts';
import { identityRow, regulationSummary, type FicheLink, type IdentityItem, type IdentityValue, type RegulationSummary } from './views.ts';

const visibleUrl = (entry: Entry | undefined) => (entry?.visibility.visible ? entry.url : undefined);
const cards = (graph: Graph, entries: Editorial[]) => entries.map((e) => articleCard(graph, e));
const dateValue = (date: string | undefined): IdentityValue | undefined => (date ? { text: formatDate(date), datetime: date } : undefined);
const entryValue = (entry: Entry<'juridictions' | 'organismes'> | undefined): IdentityValue | undefined =>
  entry && { text: 'acronym' in entry.data ? entry.data.acronym || entry.data.name : entry.data.name, url: visibleUrl(entry) };

// Éléments des listes liées : un contenu non publié garde son nom, sans lien.
export const ficheLinks = {
  dossier: (e: Entry<'dossiers'>): FicheLink => ({ label: e.data.shortTitle || e.data.title, url: visibleUrl(e), status: e.data.legalStatus as LegalStatus }),
  texte: (e: Entry<'textes'>): FicheLink => ({
    label: e.data.shortTitle || e.data.title,
    url: visibleUrl(e),
    status: e.data.legalStatus as LegalStatus | undefined,
    meta: [enumLabel('textType', e.data.type), e.data.adoptedAt && formatDate(e.data.adoptedAt)].filter(Boolean).join(' · '),
  }),
  traitement: (e: Entry<'traitements'>): FicheLink => ({ label: e.data.title, url: visibleUrl(e), meta: enumLabel('taxType', e.data.taxType) }),
  organisme: (e: Entry<'organismes'>): FicheLink => ({
    label: e.data.acronym ? `${e.data.name} (${e.data.acronym})` : e.data.name,
    url: visibleUrl(e),
    meta: enumLabel('authorityType', e.data.authorityType),
  }),
};

export type DossierView = {
  summary: RegulationSummary;
  identity: IdentityItem[];
  keyTextes: FicheLink[];
  timeline: Array<{ date: string; title: string; description?: string; url?: string }>;
  sources: SourceItem[];
  articles: CardModel[];
  agenda: Entry<'agenda'>[];
  disclaimer?: Disclaimer;
};

export function dossierView(graph: Graph, entry: Entry<'dossiers'>): DossierView {
  const d = entry.data;
  const summary = regulationSummary(graph, entry);
  return {
    summary,
    identity: [
      ...identityRow(t('fiche.legalStatus'), [{ text: enumLabel('legalStatus', d.legalStatus) }]),
      ...identityRow(t('fiche.authorities'), summary.authorities.map((a) => ({ text: a.label, url: a.url }))),
      ...identityRow(t('fiche.whoIsAffected'), d.whoIsAffected.map((w) => ({ text: enumLabel('whoIsAffected', w) }))),
      ...summary.dates.flatMap(({ key, date }) => identityRow(t(`editorial.dossierDates.${key}`), [dateValue(date)])),
    ],
    keyTextes: d.keyTextes.flatMap((id) => {
      const texte = graph.get('textes', id);
      return texte ? [ficheLinks.texte(texte)] : [];
    }),
    timeline: [...d.timeline].sort((a, b) => a.date.localeCompare(b.date)),
    sources: resolveSources(graph, d.sources),
    articles: cards(graph, editorialAbout(graph, 'relatedDossiers', entry.id)),
    agenda: upcomingAgenda(graph, { dossier: entry.id }),
    disclaimer: disclaimerFor(d.disclaimerVariant, 'reglementaire'),
  };
}

export function juridictionView(graph: Graph, entry: Entry<'juridictions'>) {
  const d = entry.data;
  const country = d.country ? formatRegion(d.country) : undefined;
  const news = editorialAbout(graph, 'jurisdictions', entry.id);
  return {
    identity: [
      ...identityRow(t('fiche.level'), [{ text: enumLabel('jurisdictionLevel', d.level) }]),
      ...identityRow(t('fiche.country'), [country !== d.name && country ? { text: country } : undefined]),
      ...identityRow(t('fiche.parent'), [entryValue(graph.get('juridictions', d.parent))]),
      ...identityRow(t('fiche.children'), childJuridictions(graph, entry.id).map((c) => ({ text: c.data.name, url: visibleUrl(c) }))),
    ],
    news: cards(graph, news.slice(0, 4)),
    hasMoreNews: news.length > 4,
    dossiers: dossiersOf(graph, { jurisdiction: entry.id }, d.keyDossiers).map(ficheLinks.dossier),
    traitements: traitementsOf(graph, entry.id, d.keyTraitements).map(ficheLinks.traitement),
    organismes: organismesOf(graph, entry.id).map(ficheLinks.organisme),
    agenda: upcomingAgenda(graph, { jurisdiction: entry.id }),
    veille: veilleItems().filter((item) => item.jurisdiction === entry.id),
  };
}

// Flux officiel de l'organisme, s'il est déclaré et activé dans config/sources-veille.json.
function officialFeed(graph: Graph, organisme: string): string | undefined {
  return graph.config.veilleSources.sources.find((s) => s.organisme === organisme && s.enabled)?.url;
}

export function organismeView(graph: Graph, entry: Entry<'organismes'>) {
  const d = entry.data;
  const dossiers = dossiersOf(graph, { authority: entry.id });
  const decisions = decisionsOf(graph, entry.id);
  const about = editorialAbout(graph, 'relatedOrganismes', entry.id);
  const dossierIds = new Set(dossiers.map((e) => e.id));
  return {
    jurisdictions: jurisdictionBadges(graph, [d.jurisdiction]),
    identity: [
      ...identityRow(t('fiche.jurisdiction'), [entryValue(graph.get('juridictions', d.jurisdiction))]),
      ...identityRow(t('fiche.type'), [{ text: enumLabel('authorityType', d.authorityType) }]),
      ...identityRow(t('fiche.website'), [{ text: formatHost(d.website), url: d.website, external: true }]),
      ...identityRow(t('fiche.verifiedOn'), [dateValue(d.asOf)]),
    ],
    feed: officialFeed(graph, entry.id),
    dossiers: dossiers.map(ficheLinks.dossier),
    decisions: decisions.slice(0, 5).map(ficheLinks.texte),
    textes: textesOf(graph, entry.id)
      .filter((e) => !decisions.includes(e))
      .map(ficheLinks.texte),
    articles: cards(graph, about.filter((e) => e.collection === 'articles').slice(0, 3)),
    guides: cards(graph, about.filter((e) => e.collection === 'guides').slice(0, 2)),
    resources: reusableSources(graph, { issuer: entry.id }),
    agenda: upcomingAgenda(graph).filter((e) => e.data.relatedDossier && dossierIds.has(e.data.relatedDossier)),
    veille: veilleOf(entry.id),
  };
}

export function texteView(graph: Graph, entry: Entry<'textes'>) {
  const d = entry.data;
  return {
    jurisdictions: jurisdictionBadges(graph, [d.jurisdiction]),
    identity: [
      ...identityRow(t('fiche.type'), [{ text: enumLabel('textType', d.type) }]),
      ...identityRow(t('fiche.issuer'), [entryValue(graph.get('organismes', d.issuer))]),
      ...identityRow(t('fiche.jurisdiction'), [entryValue(graph.get('juridictions', d.jurisdiction))]),
      ...identityRow(t('fiche.number'), [d.documentNumber ? { text: d.documentNumber } : undefined]),
      ...identityRow(t('fiche.citation'), [d.citation ? { text: d.citation } : undefined]),
      ...identityRow(t('fiche.adoptedAt'), [dateValue(d.adoptedAt)]),
      ...identityRow(t('fiche.inForceAt'), [dateValue(d.inForceAt)]),
      ...identityRow(t('fiche.legalStatus'), [d.legalStatus ? { text: enumLabel('legalStatus', d.legalStatus) } : undefined]),
      ...identityRow(t('fiche.verifiedOn'), [dateValue(d.asOf)]),
    ],
    dossiers: dossiersCiting(graph, entry.id).map(ficheLinks.dossier),
    articles: cards(graph, editorialAbout(graph, 'relatedTextes', entry.id)),
    disclaimer: disclaimer('reglementaire'),
  };
}

export function traitementView(graph: Graph, entry: Entry<'traitements'>) {
  const d = entry.data;
  const label = (collection: 'contribuables' | 'activites', id: string) => graph.get(collection, id)?.data.label ?? id;
  return {
    jurisdictions: jurisdictionBadges(graph, [d.jurisdiction]),
    identity: [
      ...identityRow(t('fiche.jurisdiction'), [entryValue(graph.get('juridictions', d.jurisdiction))]),
      ...identityRow(t('fiche.taxpayer'), [{ text: label('contribuables', d.taxpayerType) }]),
      ...identityRow(t('fiche.activity'), [{ text: label('activites', d.activity) }]),
      ...identityRow(t('fiche.taxType'), [{ text: enumLabel('taxType', d.taxType) }]),
      ...identityRow(t('fiche.taxableEvent'), [d.taxableEvent ? { text: d.taxableEvent } : undefined]),
      ...identityRow(t('fiche.review'), [d.reviewEvery !== 'aucun' ? { text: enumLabel('reviewEvery', d.reviewEvery) } : undefined]),
    ],
    forms: d.forms.map((f): FicheLink => ({ label: t('traitement.form', { code: f.code, name: f.name }), url: f.url, external: Boolean(f.url) })),
    sources: resolveSources(graph, d.sources),
    articles: cards(graph, editorialAbout(graph, 'relatedTraitements', entry.id)),
    // L'avertissement fiscal s'affiche toujours sur un traitement fiscal (ARCHITECTURE, section 7.7).
    disclaimer: disclaimer('fiscal'),
  };
}
