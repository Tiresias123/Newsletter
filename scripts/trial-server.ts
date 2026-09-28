// npm run trial : le site tel qu'en ligne, sur http://127.0.0.1:8791, pour un essai (guide, section 31) et pour
// les parcours de fumée (playwright.config.ts). Construction d'aperçu (tous les gabarits, formulaires avec la
// clé Turnstile d'essai), puis le Worker et dist/ par wrangler dev, en mode d'essai : rien n'est envoyé, aucun
// secret n'est requis. E2E_SANS_BUILD=1 réutilise le dist/ existant. Écoute sur 127.0.0.1 seulement.
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const PORT = '8791';

if (process.env.E2E_SANS_BUILD !== '1') {
  const build = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit', env: { ...process.env, SITE_MODE: 'preview' } });
  if (build.status !== 0) process.exit(build.status ?? 1);
}

const server = spawn('npx', ['wrangler', 'dev', '--port', PORT, '--ip', '127.0.0.1', '--var', 'MEMORY_SERVICES:true', '--show-interactive-dev-session=false'], {
  cwd: root,
  stdio: 'inherit',
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => server.kill(signal));
server.on('exit', (code) => process.exit(code ?? 0));
