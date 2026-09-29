// npm run trial : le site tel qu'en ligne, sur http://127.0.0.1:8791, pour un essai (guide, section 31) et pour
// les parcours de fumée (playwright.config.ts). Construction d'aperçu (tous les gabarits, formulaires avec la
// clé Turnstile d'essai), puis le Worker et dist/ par wrangler dev, en mode d'essai : rien n'est envoyé, aucun
// secret n'est requis ni lu (ni .dev.vars ni .env). E2E_SANS_BUILD=1 réutilise le dist/ existant. Écoute sur
// 127.0.0.1 seulement. npm et Wrangler sont lancés par Node lui-même : sous Windows, npm et npx sont des scripts
// .cmd, qu'un programme ne peut pas lancer directement.
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const PORT = '8791';
const WRANGLER = join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

if (process.env.E2E_SANS_BUILD !== '1') {
  const env = { ...process.env, SITE_MODE: 'preview' };
  // npm_execpath : le npm qui a lancé la commande (npm run trial, npm run test:e2e).
  const npm = process.env.npm_execpath;
  const build = npm
    ? spawnSync(process.execPath, [npm, 'run', 'build'], { cwd: root, stdio: 'inherit', env })
    : spawnSync('npm run build', { cwd: root, stdio: 'inherit', env, shell: true });
  if (build.error) console.error(`Construction impossible : ${build.error.message}`);
  if (build.status !== 0) process.exit(build.status ?? 1);
}

// Fichier de variables vide : Wrangler ne lit alors ni .dev.vars ni .env, dont un secret ferait échouer l'essai.
const scratch = mkdtempSync(join(tmpdir(), 'essai-'));
const noVars = join(scratch, 'vide.env');
writeFileSync(noVars, '');
const args = ['dev', '--port', PORT, '--ip', '127.0.0.1', '--env-file', noVars, '--var', 'MEMORY_SERVICES:true', '--show-interactive-dev-session=false'];
const server = spawn(process.execPath, [WRANGLER, ...args], { cwd: root, stdio: 'inherit' });
const stop = (code: number) => {
  rmSync(scratch, { recursive: true, force: true });
  process.exit(code);
};
server.on('error', (error) => {
  console.error(`Wrangler ne démarre pas : ${error.message}`);
  stop(1);
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => server.kill(signal));
// Arrêt demandé (Ctrl+C) : sortie normale; Wrangler arrêté par un autre signal (mémoire épuisée…) : échec.
server.on('exit', (code, signal) => stop(code ?? (signal === 'SIGINT' || signal === 'SIGTERM' ? 0 : 1)));
