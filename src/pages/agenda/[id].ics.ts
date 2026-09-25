// Une échéance au format iCalendar (« Ajouter à mon agenda »).
import type { APIRoute, GetStaticPaths } from 'astro';
import { getGraph } from '../../lib/content/astro.ts';
import { agendaEvent } from '../../lib/content/agenda.ts';
import { t } from '../../lib/i18n.ts';
import { icsCalendar } from '../../lib/ics.ts';

export const getStaticPaths = (async () => {
  const graph = await getGraph();
  return graph.listed('agenda').map((e) => ({ params: { id: e.id } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const graph = await getGraph();
  const entry = graph.get('agenda', params.id);
  if (!entry) return new Response(null, { status: 404 });
  const { site } = graph.config;
  const body = icsCalendar([agendaEvent(graph, entry)], {
    name: t('agenda.calendarName', { site: site.name }),
    timezone: site.timezone,
    now: graph.ctx.now,
    productId: `-//${site.name}//Agenda//FR`,
  });
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
