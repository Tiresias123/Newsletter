// Cache des collections d'Astro : il n'est invalidé que si le texte de src/content.config.ts change, pas quand
// un schéma importé (src/lib/content/) évolue. Sans ce garde-fou, une mise à jour du code laisserait des
// données validées par l'ancien schéma (champ ajouté absent, par exemple). On vide donc le cache dès que
// l'empreinte des fichiers de schéma change.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

const SCHEMA_DIR = 'src/lib/content';
const STORES = ['.astro/data-store.json', 'node_modules/.astro/data-store.json'];
const STAMP = 'node_modules/.astro/schemas-digest.txt';

export function schemasDigest(root: string): string {
  const hash = createHash('sha256');
  const dir = join(root, SCHEMA_DIR);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts')).sort()) {
    hash.update(file).update(readFileSync(join(dir, file)));
  }
  return hash.digest('hex');
}

export function contentCacheGuard(): AstroIntegration {
  return {
    name: 'garde-cache-contenu',
    hooks: {
      'astro:config:setup': ({ config, logger }) => {
        const root = fileURLToPath(config.root);
        const digest = schemasDigest(root);
        const stamp = join(root, STAMP);
        if (existsSync(stamp) && readFileSync(stamp, 'utf8') === digest) return;
        for (const store of STORES) rmSync(join(root, store), { force: true });
        mkdirSync(join(root, 'node_modules/.astro'), { recursive: true });
        writeFileSync(stamp, digest);
        logger.info('Schémas modifiés : cache des collections vidé.');
      },
    },
  };
}
