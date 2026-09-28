// Santé des sources de la veille (ARCHITECTURE, section 14) : un fil mort ne doit jamais ressembler à une
// semaine calme. Cas distingués : erreur, contenu illisible, robots.txt, fil silencieux, veille arrêtée.
import { CONFIG_FILES } from '../config/index.ts';
import { veilleHealth, veilleItems, type VeilleHealth, type VeilleItem, type VeilleStatus } from '../content/veille.ts';
import { calendarDateInZone, daysBetween } from '../dates.ts';
import { formatDate } from '../format.ts';
import { UNDATED } from '../veille/merge.ts';
import type { Context } from './context.ts';

const STATUS: Record<Exclude<VeilleStatus, 'ok'>, string> = {
  erreur: 'en erreur',
  illisible: 'illisible (page HTML ou fil invalide : pare-feu ou adresse périmée)',
  bloque: 'interdite au robot par le robots.txt du site',
  silencieux: 'silencieuse, sans publication récente dans son fil (figé ou abandonné)',
};

export const VEILLE_WORKFLOW = '.github/workflows/veille.yml';
// La tâche « veille » passe deux fois par jour ouvrable : au-delà de 4 jours sans passage (une fin de semaine et
// un passage manqué compris), elle est arrêtée.
export const MAX_RUN_GAP_DAYS = 4;

export type VeilleCheckOptions = {
  health?: Record<string, VeilleHealth>;
  items?: VeilleItem[];
  // Dernier passage planifié de la tâche « veille » sur main (instant ISO, ou « aucun ») : fourni par la tâche
  // GitHub du rapport hebdomadaire (variable VEILLE_DERNIER_PASSAGE), absent ailleurs.
  lastRun?: string;
};

export function checkVeille({ config, add }: Pick<Context, 'config' | 'add'>, now: Date, { health = veilleHealth(), items = veilleItems(), lastRun }: VeilleCheckOptions = {}): void {
  const file = CONFIG_FILES.veilleSources;
  const today = calendarDateInZone(now, config.site.timezone);
  checkLastRun(add, lastRun, now, config.site.timezone);
  config.veilleSources.sources.forEach((source, i) => {
    if (!source.enabled) return;
    const where = ['sources', i];
    if (!source.url) {
      add(file, [...where, 'url'], `${source.label} : source activée sans adresse, jamais collectée.`, 'veille', 'avertissement');
      return;
    }
    const state = health[source.id];
    if (!state) {
      add(file, where, `${source.label} : pas encore collectée; elle le sera au prochain passage de la tâche « veille » (ou par npm run veille:fetch).`, 'veille', 'information');
      return;
    }
    if (state.status !== 'ok') {
      const detail = state.detail ? ` (${state.detail})` : '';
      const advice = state.status === 'silencieux' ? ' Vérifiez que le fil est toujours alimenté.' : '';
      add(file, where, `${source.label} : source ${STATUS[state.status]} depuis le ${formatDate(state.since.slice(0, 10))}${detail}.${advice} Les publications déjà relevées restent affichées.`, 'veille', 'avertissement');
      return;
    }
    if (state.detail === UNDATED) {
      add(file, where, `${source.label} : ${UNDATED}. Ses publications sont datées du jour de leur première collecte, et un fil figé ne peut pas être repéré.`, 'veille', 'information');
    }
    // Sans mots-clés, le fil et la veille avancent ensemble : une veille qui n'avance plus signale aussi une
    // collecte arrêtée. Avec mots-clés, des mois sans publication retenue sont normaux (voir « silencieux »).
    if (source.keywords.length > 0) return;
    const latest = items.filter((item) => item.sourceId === source.id).map((item) => item.publishedAt.slice(0, 10)).sort().at(-1);
    const quiet = latest ? daysBetween(latest, today) : undefined;
    if (quiet === undefined || quiet > source.staleDays) {
      const since = latest ? `depuis le ${formatDate(latest)}` : 'depuis sa première collecte';
      add(file, where, `${source.label} : aucune nouvelle publication ${since}, au-delà de ${source.staleDays} jours. Vérifiez que le fil est toujours alimenté.`, 'veille', 'avertissement');
    }
  });
}

// Tâche « veille » arrêtée (désactivée, ou suspendue par GitHub) : les états des sources ne bougent plus, et la
// surveillance du site en ligne, qui tourne avec elle, s'arrête aussi.
function checkLastRun(add: Context['add'], lastRun: string | undefined, now: Date, timeZone: string): void {
  if (lastRun === undefined) return;
  const stopped = "La collecte de la veille et la surveillance du site en ligne sont arrêtées : vérifiez l'onglet Actions de GitHub (tâche désactivée, ou suspendue faute d'activité dans le dépôt).";
  const time = Date.parse(lastRun);
  if (Number.isNaN(time)) {
    add(VEILLE_WORKFLOW, [], `Tâche « veille » : aucun passage planifié sur main. ${stopped}`, 'veille', 'avertissement');
    return;
  }
  const days = Math.floor((now.getTime() - time) / 86_400_000);
  if (days > MAX_RUN_GAP_DAYS) {
    add(VEILLE_WORKFLOW, [], `Tâche « veille » : dernier passage planifié le ${formatDate(calendarDateInZone(new Date(time), timeZone))}, il y a ${days} jours. ${stopped}`, 'veille', 'avertissement');
  }
}
