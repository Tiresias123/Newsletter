// Fraîcheur et cohérence des dates : révisions échues, dates dans le futur, publications programmées,
// brouillons oubliés (date du dernier commit git).
import { execFileSync } from 'node:child_process';
import { addMonths, calendarDateInZone, daysBetween } from '../dates.ts';
import { formatDate, formatDateTime } from '../format.ts';
import type { Entry, Graph } from '../content/graph.ts';
import type { Add } from './context.ts';

// Révision signalée à l'avance, et âge à partir duquel un brouillon est jugé oublié.
const REVIEW_NOTICE_DAYS = 14;
const OLD_DRAFT_DAYS = 90;

type Dated = {
  status?: string;
  asOf?: string;
  reviewEvery?: string;
  updatedAt?: string;
  corrections?: Array<{ date: string }>;
};

export function checkFreshness(graph: Graph, entries: Entry[], lastCommit: Map<string, string>, add: Add): void {
  const { now, timezone } = graph.ctx;
  const today = calendarDateInZone(now, timezone);
  for (const entry of entries) {
    const data = entry.data as Dated;
    const { instant } = entry.visibility;
    const draft = data.status === 'brouillon';

    if (!draft && data.asOf && data.reviewEvery && data.reviewEvery !== 'aucun') {
      const due = addMonths(data.asOf, Number(data.reviewEvery));
      const rhythm = `vérifié le ${formatDate(data.asOf)}, révision tous les ${data.reviewEvery} mois`;
      if (due <= today) add(entry.file, ['asOf'], `Révision échue depuis le ${formatDate(due)} (${rhythm}). Revérifiez le contenu, puis mettez à jour « Vérifié le ».`, 'revision', 'avertissement');
      else if (daysBetween(today, due) <= REVIEW_NOTICE_DAYS) add(entry.file, ['asOf'], `Révision à faire d'ici le ${formatDate(due)} (${rhythm}).`, 'revision', 'information');
    }

    if (data.asOf && data.asOf > today) add(entry.file, ['asOf'], `Date dans le futur : ${formatDate(data.asOf)}.`, 'date', 'avertissement');
    if (data.updatedAt && data.updatedAt > today) add(entry.file, ['updatedAt'], `Date dans le futur : ${formatDate(data.updatedAt)}.`, 'date', 'avertissement');
    (data.corrections ?? []).forEach((correction, i) => {
      if (correction.date > today) add(entry.file, ['corrections', i, 'date'], `Date dans le futur : ${formatDate(correction.date)}.`, 'date', 'avertissement');
    });
    if (data.status === 'publie' && instant && instant > now) {
      add(entry.file, ['publishedAt'], `Contenu publié mais daté du ${formatDateTime(instant, '{date} à {time}', timezone)} : pour une publication future, choisissez le statut « Programmé ».`, 'date', 'avertissement');
    }
    if (data.status === 'programme' && instant && instant > now) {
      add(entry.file, ['publishedAt'], `Publication programmée le ${formatDateTime(instant, '{date} à {time}', timezone)}.`, 'programme', 'information');
    }

    const last = draft ? lastCommit.get(entry.file) : undefined;
    const age = last ? daysBetween(calendarDateInZone(new Date(last), timezone), today) : 0;
    if (age >= OLD_DRAFT_DAYS) add(entry.file, [], `Brouillon inchangé depuis ${age} jours : à publier ou à supprimer.`, 'brouillon', 'information');
  }
}

// Date du dernier commit de chaque fichier de content/ ; vide hors d'un dépôt git.
export function lastCommitDates(root: string): Map<string, string> {
  const dates = new Map<string, string>();
  try {
    const log = execFileSync('git', ['log', '--format=%x00%cI', '--name-only', '--', 'content'], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    for (const chunk of log.split('\0').slice(1)) {
      const [date = '', ...files] = chunk.split('\n');
      for (const file of files) if (file && !dates.has(file)) dates.set(file, date.trim());
    }
  } catch {
    // Pas de dépôt git (copie du dossier, archive) : le contrôle des brouillons oubliés est sauté.
  }
  return dates;
}
