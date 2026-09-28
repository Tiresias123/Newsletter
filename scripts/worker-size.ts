// npm run worker:size : taille du Worker tel que Cloudflare le recevrait (wrangler deploy --dry-run, sans rien
// déployer), à garder sous 100 Kio (CLAUDE.md) : la commande échoue au-delà. Utilisée par l'intégration continue.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const LIMIT_KIB = 100;
const outdir = mkdtempSync(join(tmpdir(), 'worker-'));
try {
  execFileSync('npx', ['wrangler', 'deploy', '--dry-run', '--outdir', outdir], { stdio: ['ignore', 'ignore', 'inherit'] });
  // Modules envoyés (le fichier de correspondance des sources et la note de wrangler ne comptent pas).
  const bytes = readdirSync(outdir, { recursive: true })
    .map((name) => join(outdir, String(name)))
    .filter((file) => /\.(?:js|mjs|wasm)$/.test(file) && statSync(file).isFile())
    .reduce((sum, file) => sum + statSync(file).size, 0);
  const kib = bytes / 1024;
  console.log(`Worker : ${kib.toFixed(1)} Kio (limite du projet : ${LIMIT_KIB} Kio).`);
  if (kib > LIMIT_KIB) {
    console.error('Worker trop lourd : une dépendance (Zod, par exemple) a dû y entrer (CLAUDE.md, « Worker léger »).');
    process.exitCode = 1;
  }
} finally {
  rmSync(outdir, { recursive: true, force: true });
}
