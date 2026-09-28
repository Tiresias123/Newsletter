// npm run surveillance : vérifie que le site en ligne est à jour (src/lib/check/deployment.ts). Lancé par la
// tâche GitHub « veille » deux fois par jour ouvrable : un échec envoie un courriel de GitHub à l'auteur.
// Sans adresse réelle (site pas encore en ligne), rien à surveiller.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { deploymentStatus, type LastChange } from '../src/lib/check/deployment.ts';
import { PLACEHOLDER_URL } from '../src/lib/check/index.ts';
import { getConfig } from '../src/lib/config/index.ts';
import { parseSchedule, SCHEDULE_PATH } from '../src/lib/schedule-rules.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const { site } = getConfig();
if (site.url === PLACEHOLDER_URL) {
  console.log("Surveillance : le site n'a pas encore d'adresse réelle (config/site.json), rien à vérifier.");
  process.exit(0);
}

async function online() {
  try {
    const response = await fetch(new URL(SCHEDULE_PATH, site.url), { signal: AbortSignal.timeout(15_000), headers: { 'cache-control': 'no-cache' } });
    return response.ok ? parseSchedule(await response.json()) : undefined;
  } catch {
    return undefined;
  }
}

const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

// Dernier commit de main qui change le site : la documentation et les tâches GitHub ne déclenchent pas de build.
// --first-parent : une fusion porte sa propre date, pas celle des commits de la branche fusionnée.
function lastChange(built: string | undefined): LastChange | undefined {
  try {
    const [sha = '', iso = ''] = git('log', '-1', '--first-parent', '--format=%H %cI', '--', '.', ':(exclude)docs', ':(exclude).github').split(' ');
    return sha && iso ? { date: new Date(iso), online: built ? contains(built, sha) : undefined } : undefined;
  } catch {
    return undefined;
  }
}

// Le commit construit contient-il `sha` ? Inconnu quand il manque à l'historique récupéré par la tâche.
function contains(built: string, sha: string): boolean | undefined {
  try {
    git('merge-base', '--is-ancestor', sha, built);
    return true;
  } catch (error) {
    return (error as { status?: number }).status === 1 ? false : undefined;
  }
}

const schedule = await online();
const status = deploymentStatus(schedule, lastChange(schedule?.commit), new Date());
if (status.ok) {
  console.log(`Surveillance : site en ligne à jour (build du ${status.builtAt.toISOString()}${schedule?.commit ? `, commit ${schedule.commit.slice(0, 7)}` : ''}).`);
} else {
  console.error(`Surveillance : ${status.problem}.`);
  process.exitCode = 1;
}
