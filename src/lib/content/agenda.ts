// Agenda (brief 6.10) : échéances regroupées par mois pour la page, et converties en événements iCalendar.
import { enumLabel } from '../i18n.ts';
import type { IcsEvent } from '../ics.ts';
import { absolute } from '../seo/json-ld.ts';
import type { Entry, Graph } from './graph.ts';

export function agendaByMonth(entries: readonly Entry<'agenda'>[]): Array<{ month: string; entries: Entry<'agenda'>[] }> {
  const groups = new Map<string, Entry<'agenda'>[]>();
  for (const entry of entries) {
    const month = entry.data.date.slice(0, 7);
    groups.set(month, [...(groups.get(month) ?? []), entry]);
  }
  return [...groups].map(([month, list]) => ({ month, entries: list }));
}

export function agendaEvent(graph: Graph, entry: Entry<'agenda'>): IcsEvent {
  const d = entry.data;
  const siteUrl = graph.config.site.url;
  const dossier = graph.get('dossiers', d.relatedDossier);
  return {
    uid: `${entry.id}@${new URL(siteUrl).hostname}`,
    title: d.title,
    date: d.date,
    endDate: d.endDate,
    time: d.time,
    description: d.description,
    // Lien officiel s'il existe, sinon le dossier lié, sinon la page de l'agenda.
    url: d.url || (dossier?.visibility.visible && dossier.url ? absolute(siteUrl, dossier.url) : absolute(siteUrl, '/agenda/')),
    category: enumLabel('agendaType', d.type),
  };
}

export const icsPath = (entry: Entry<'agenda'>) => `/agenda/${entry.id}.ics`;
