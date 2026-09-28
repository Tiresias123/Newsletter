// Fraîcheur du site en ligne (brief 8.8, « notification d'échec de build ») : /schedule.json donne l'heure du
// build en ligne. Un build qui échoue laisse le site sur sa version précédente sans bruit; la tâche GitHub de
// surveillance compare cette heure au dernier envoi et à la reconstruction nocturne, et échoue (courriel de
// GitHub à l'auteur) si l'écart est anormal.
import type { Schedule } from '../schedule-rules.ts';

// La reconstruction nocturne a lieu chaque jour : au-delà, un build a échoué ou la tâche planifiée est arrêtée.
export const MAX_AGE_HOURS = 30;
// Délai laissé à un build après un envoi (file d'attente, durée du build).
export const BUILD_GRACE_MINUTES = 60;

export type DeploymentStatus = { ok: true; builtAt: Date } | { ok: false; problem: string };

// Dernier commit de main qui change le site : sa date et, quand /schedule.json nomme le commit construit, s'il
// fait partie du build en ligne (inconnu : comparaison des dates).
export type LastChange = { date: Date; online?: boolean };

export function deploymentStatus(schedule: Schedule | undefined, last: LastChange | undefined, now: Date): DeploymentStatus {
  if (!schedule) return { ok: false, problem: 'le site en ligne ne répond pas, ou /schedule.json est illisible' };
  const builtAt = new Date(schedule.builtAt);
  const age = (now.getTime() - builtAt.getTime()) / 3_600_000;
  if (age > MAX_AGE_HOURS) {
    return { ok: false, problem: `le site en ligne n'a pas été reconstruit depuis ${Math.floor(age)} heures (reconstruction nocturne manquée : build en échec ou tâche planifiée arrêtée)` };
  }
  const missing = last && (last.online === false || (last.online === undefined && last.date.getTime() > builtAt.getTime()));
  if (last && missing && now.getTime() - last.date.getTime() > BUILD_GRACE_MINUTES * 60_000) {
    return { ok: false, problem: `le dernier envoi (${last.date.toISOString()}) n'est pas en ligne : le build a probablement échoué (voir Workers Builds dans Cloudflare)` };
  }
  return { ok: true, builtAt };
}
