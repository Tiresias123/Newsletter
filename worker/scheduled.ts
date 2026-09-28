// Tâche planifiée (ARCHITECTURE 15.3) : une seule expression dans wrangler.jsonc, le forfait gratuit n'en
// permettant que cinq par compte. Toutes les 15 minutes, relance un build par le Deploy Hook si une publication
// programmée vient d'échoir (lu dans /schedule.json, publié par le dernier build); à partir de 5 h 07 UTC,
// reconstruction complète (« À surveiller », agenda, cours de marché), relancée aux passages suivants tant
// que le site en ligne date d'avant 5 h 07, pendant la même fenêtre de deux heures.
import { isRebuildDue, parseSchedule, RETRY_WINDOW_MS, SCHEDULE_PATH, type Schedule } from '../src/lib/schedule-rules.ts';
import type { Env } from './http.ts';

// 5 h 07 UTC : 1 h 07 à Montréal en heure avancée, 0 h 07 en heure normale; toujours après minuit. L'expression
// de wrangler.jsonc doit passer à cette minute.
export const NIGHTLY_UTC = { hour: 5, minute: 7 } as const;

export type ScheduledEvent = { cron: string; scheduledTime: number };
export type RunResult = 'reconstruction' | 'rien' | 'sans-hook' | 'echec';

// Heure prévue du passage, et non l'heure réelle : un passage en retard reste celui de 5 h 07.
export function isNightly(scheduledTime: number): boolean {
  const at = new Date(scheduledTime);
  return at.getUTCHours() === NIGHTLY_UTC.hour && at.getUTCMinutes() === NIGHTLY_UTC.minute;
}

// Reconstruction nocturne due : passé 5 h 07 UTC depuis moins de deux heures, le site en ligne datant d'avant.
// Un Deploy Hook en échec ou un passage manqué est ainsi rattrapé au passage suivant.
export function nightlyDue(schedule: Schedule, now: Date): boolean {
  const nightly = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), NIGHTLY_UTC.hour, NIGHTLY_UTC.minute);
  const since = now.getTime() - nightly;
  return since >= 0 && since <= RETRY_WINDOW_MS && Date.parse(schedule.builtAt) < nightly;
}

// Fichier du déploiement en cours, lu par la liaison des fichiers statiques, sans passer par le réseau.
async function currentSchedule(env: Env): Promise<Schedule | undefined> {
  try {
    const response = await env.ASSETS.fetch(new Request(new URL(SCHEDULE_PATH, 'https://assets.local').href));
    return response.ok ? parseSchedule(await response.json()) : undefined;
  } catch {
    return undefined;
  }
}

export async function runScheduled(event: ScheduledEvent, env: Env): Promise<RunResult> {
  if (!env.DEPLOY_HOOK_URL) {
    console.error('tâche planifiée : DEPLOY_HOOK_URL absent de la configuration du Worker');
    return 'sans-hook';
  }
  const now = new Date(event.scheduledTime);
  const schedule = await currentSchedule(env);
  // Sans /schedule.json lisible, la reconstruction nocturne a lieu au seul passage de 5 h 07.
  const nightly = schedule ? nightlyDue(schedule, now) : isNightly(event.scheduledTime);
  if (!nightly && !(schedule && isRebuildDue(schedule, now))) return 'rien';
  const reason = nightly ? 'reconstruction nocturne' : 'publication programmée';
  try {
    const response = await fetch(env.DEPLOY_HOOK_URL, { method: 'POST', signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    // Un build encore en file n'est pas dédoublé : Cloudflare renvoie celui qui attend.
    const body = (await response.json().catch(() => ({}))) as { result?: { already_exists?: boolean } };
    console.log(`tâche planifiée : ${body.result?.already_exists ? 'build déjà en file' : 'build demandé'} (${reason})`);
    return 'reconstruction';
  } catch (error) {
    console.error(`tâche planifiée : échec du Deploy Hook, ${reason} (${error instanceof Error ? error.message : 'erreur inconnue'})`);
    return 'echec';
  }
}
