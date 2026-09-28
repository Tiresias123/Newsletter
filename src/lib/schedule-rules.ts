// Règles de la publication programmée partagées par le site et le Worker (ARCHITECTURE, section 15.3) : format de
// /schedule.json et décision de relancer un build. Module sans dépendance, pour que le Worker reste léger.

export const SCHEDULE_PATH = '/schedule.json';

// Une échéance relance le build pendant deux heures au plus (build en échec, passage manqué de la tâche
// planifiée) : au-delà, la reconstruction nocturne prend le relais, sans épuiser le quota de builds.
export const RETRY_WINDOW_MS = 2 * 60 * 60 * 1000;

export type Schedule = { version: 1; builtAt: string; publications: string[] };

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
