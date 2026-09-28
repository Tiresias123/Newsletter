// Publication programmée (ARCHITECTURE, section 15.3). Chaque build publie /schedule.json : les instants
// des publications programmées à venir, sans titre ni adresse, pour que rien ne fuite avant l'heure. La tâche
// planifiée de Cloudflare (phase 4) le relit toutes les 15 minutes et ne relance un build que si l'un de ces
// instants vient de passer ; le build suivant rend le contenu visible, puisque sa date est échue.
import type { Graph } from './content/graph.ts';
import { COLLECTION_NAMES } from './content/collections.ts';

export const SCHEDULE_PATH = '/schedule.json';

// Une échéance relance le build pendant deux heures au plus (build en échec, passage manqué de la tâche
// planifiée) : au-delà, la reconstruction nocturne prend le relais, sans épuiser le quota de builds.
export const RETRY_WINDOW_MS = 2 * 60 * 60 * 1000;

export type Schedule = { version: 1; builtAt: string; publications: string[] };

// Instants à venir des contenus programmés, triés et sans doublon.
export function scheduledInstants(graph: Graph): Date[] {
  const now = graph.ctx.now.getTime();
  const times = COLLECTION_NAMES.flatMap((collection) => graph.all(collection))
    .filter((entry) => entry.visibility.state === 'programme')
    .map((entry) => entry.visibility.instant?.getTime())
    .filter((time): time is number => time !== undefined && time > now);
  return [...new Set(times)].sort((a, b) => a - b).map((time) => new Date(time));
}

export function buildSchedule(graph: Graph): Schedule {
  return { version: 1, builtAt: graph.ctx.now.toISOString(), publications: scheduledInstants(graph).map((d) => d.toISOString()) };
}

// Lecture défensive du fichier publié : un fichier absent ou mal formé ne relance jamais de build.
export function parseSchedule(value: unknown): Schedule | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const { version, builtAt, publications } = value as Record<string, unknown>;
  if (version !== 1 || typeof builtAt !== 'string' || Number.isNaN(Date.parse(builtAt))) return undefined;
  if (!Array.isArray(publications) || !publications.every((p) => typeof p === 'string' && !Number.isNaN(Date.parse(p)))) return undefined;
  return { version, builtAt, publications };
}

// Décision de la tâche planifiée : une publication est échue depuis le dernier build, dans la fenêtre de relance.
export function isRebuildDue(schedule: Schedule, now: Date): boolean {
  const built = Date.parse(schedule.builtAt);
  return schedule.publications.some((iso) => {
    const time = Date.parse(iso);
    return time > built && time <= now.getTime() && now.getTime() - time <= RETRY_WINDOW_MS;
  });
}
