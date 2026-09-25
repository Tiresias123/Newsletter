// Agenda complet au format iCalendar, à importer ou à suivre dans un logiciel de calendrier.
import type { APIRoute } from 'astro';
import { getGraph } from '../lib/content/astro.ts';
import { agendaEvent } from '../lib/content/agenda.ts';
import { t } from '../lib/i18n.ts';
import { icsCalendar } from '../lib/ics.ts';

export const GET: APIRoute = async () => {
  const graph = await getGraph();
  const { site } = graph.config;
  const entries = graph.listed('agenda').sort((a, b) => a.data.date.localeCompare(b.data.date));
  const body = icsCalendar(
    entries.map((e) => agendaEvent(graph, e)),
    { name: t('agenda.calendarName', { site: site.name }), timezone: site.timezone, now: graph.ctx.now, productId: `-//${site.name}//Agenda//FR` },
  );
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
