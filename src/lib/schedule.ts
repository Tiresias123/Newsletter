// Publication programmée (ARCHITECTURE, section 15.3). Chaque build publie /schedule.json : les instants
// des publications programmées à venir, sans titre ni adresse, pour que rien ne fuite avant l'heure. La tâche
// planifiée de Cloudflare (phase 4) le relit toutes les 15 minutes et ne relance un build que si l'un de ces
// instants vient de passer ; le build suivant rend le contenu visible, puisque sa date est échue.
import type { Graph } from './content/graph.ts';
import { COLLECTION_NAMES } from './content/collections.ts';
import type { Schedule } from './schedule-rules.ts';

// Règles partagées avec le Worker : format du fichier et décision de relance.
export { isRebuildDue, parseSchedule, RETRY_WINDOW_MS, SCHEDULE_PATH, type Schedule } from './schedule-rules.ts';

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
