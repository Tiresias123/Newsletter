// Santé des sources de la veille (ARCHITECTURE, section 14) : un fil mort ne doit jamais ressembler à une
// semaine calme. Cas distingués : erreur, contenu illisible, robots.txt, fil silencieux, veille arrêtée.
import { CONFIG_FILES } from '../config/index.ts';
import { veilleHealth, veilleItems, type VeilleHealth, type VeilleItem, type VeilleStatus } from '../content/veille.ts';
import { calendarDateInZone, daysBetween } from '../dates.ts';
import { formatDate } from '../format.ts';
import type { Context } from './context.ts';

const STATUS: Record<Exclude<VeilleStatus, 'ok'>, string> = {
  erreur: 'en erreur',
  illisible: 'illisible (page HTML ou fil invalide : pare-feu ou adresse périmée)',
  bloque: 'interdite au robot par le robots.txt du site',
  silencieux: 'silencieuse, sans publication récente dans son fil (figé ou abandonné)',
};

export function checkVeille(
  { config, add }: Pick<Context, 'config' | 'add'>,
  now: Date,
  health: Record<string, VeilleHealth> = veilleHealth(),
  items: VeilleItem[] = veilleItems(),
): void {
  const file = CONFIG_FILES.veilleSources;
  const today = calendarDateInZone(now, config.site.timezone);
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
