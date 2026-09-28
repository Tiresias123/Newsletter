// /schedule.json : instants des publications programmées, lus par la tâche planifiée (src/lib/schedule.ts), et
// commit construit, lu par la surveillance du site en ligne (scripts/surveillance.ts).
import type { APIRoute } from 'astro';
import { getGraph } from '../lib/content/astro.ts';
import { buildSchedule } from '../lib/schedule.ts';

export const GET: APIRoute = async () =>
  new Response(`${JSON.stringify(buildSchedule(await getGraph(), process.env.WORKERS_CI_COMMIT_SHA), null, 2)}\n`, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
