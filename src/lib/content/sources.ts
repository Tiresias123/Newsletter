// Sources citées par un contenu, résolues pour l'affichage : titre, type, émetteur, date, lien, copie archivée.
// Les sources officielles (config/legal.json) passent en premier (brief 7.2, étape 13).
import { enumLabel } from '../i18n.ts';
import type { CitedSource } from './fields.ts';
import type { Entry, Graph } from './graph.ts';

export type SourceItem = {
  title: string;
  url: string;
  archivedUrl?: string;
  official: boolean;
  typeLabel: string;
  issuer?: { label: string; url?: string };
  date?: string;
  citation?: string;
};

function fromEntry(graph: Graph, entry: Entry<'sources'>, official: boolean): SourceItem {
  const d = entry.data;
  const organisme = graph.get('organismes', d.issuer);
  const issuer = organisme
    ? { label: organisme.data.acronym || organisme.data.name, url: organisme.visibility.visible ? organisme.url : undefined }
    : d.issuerLabel
      ? { label: d.issuerLabel }
      : undefined;
  return { title: d.title, url: d.url, archivedUrl: d.archivedUrl, official, typeLabel: enumLabel('sourceType', d.sourceType), issuer, date: d.documentDate, citation: d.citation };
}

export function resolveSources(graph: Graph, cited: readonly CitedSource[]): SourceItem[] {
  const items = cited.flatMap((source): SourceItem[] => {
    const official = graph.isOfficial(source);
    if (source.kind === 'ponctuelle') {
      return [{ title: source.label, url: source.url, archivedUrl: source.archivedUrl, official, typeLabel: enumLabel('sourceType', source.type), date: source.date }];
    }
    const entry = graph.get('sources', source.source);
    return entry ? [fromEntry(graph, entry, official)] : [];
  });
  return [...items.filter((i) => i.official), ...items.filter((i) => !i.official)];
}

// Sources réutilisables (bloc de page ListeSources, ressources d'un organisme) : toutes, ou celles demandées,
// officielles d'abord.
export function reusableSources(graph: Graph, filter: { ids?: readonly string[]; jurisdiction?: string; type?: string; issuer?: string } = {}): SourceItem[] {
  const cited = graph
    .all('sources')
    .filter(
      (e) =>
        (!filter.ids || filter.ids.includes(e.id)) &&
        (!filter.jurisdiction || e.data.jurisdiction === filter.jurisdiction) &&
        (!filter.type || e.data.sourceType === filter.type) &&
        (!filter.issuer || e.data.issuer === filter.issuer),
    )
    .map((e): CitedSource => ({ kind: 'reference', source: e.id }));
  return resolveSources(graph, cited);
}
