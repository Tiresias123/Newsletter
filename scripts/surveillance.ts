// npm run surveillance : vérifie que le site en ligne est à jour (src/lib/check/deployment.ts). Lancé par la
// tâche GitHub « veille » deux fois par jour ouvrable : un échec envoie un courriel de GitHub à l'auteur.
// Sans adresse réelle (site pas encore en ligne), rien à surveiller.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { deploymentStatus } from '../src/lib/check/deployment.ts';
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

function lastCommit(): Date | undefined {
  try {
    // Dernier envoi qui change le site : la documentation et les tâches GitHub ne déclenchent pas de build.
    const iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', '.', ':(exclude)docs', ':(exclude).github'], { cwd: root, encoding: 'utf8' }).trim();
    return iso ? new Date(iso) : undefined;
  } catch {
    return undefined;
  }
}

const status = deploymentStatus(await online(), lastCommit(), new Date());
if (status.ok) {
  console.log(`Surveillance : site en ligne à jour (build du ${status.builtAt.toISOString()}).`);
} else {
  console.error(`Surveillance : ${status.problem}.`);
  process.exitCode = 1;
}
