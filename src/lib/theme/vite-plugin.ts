// Module virtuel « virtual:theme.css » : les variables CSS du site, générées depuis config/theme.json.
// Modifier theme.json recharge la page en développement ; aucun fichier généré n'est versionné.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { themeSchema } from '../config/schemas.ts';
import { formatProblems, problemsFromZod } from '../errors.ts';
import { themeCss } from './tokens.ts';

const VIRTUAL_ID = 'virtual:theme.css';
const RESOLVED_ID = '\0virtual:theme.css';

export function themePlugin(): Plugin {
  const file = resolve('config/theme.json');
  return {
    name: 'site-theme-tokens',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) return undefined;
      this.addWatchFile(file);
      const parsed = themeSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')));
      if (!parsed.success) {
        throw new Error(`config/theme.json contient des erreurs :\n${formatProblems(problemsFromZod('config/theme.json', parsed.error))}`);
      }
      return themeCss(parsed.data);
    },
    // theme.json modifié : le module virtuel est recalculé, puis le navigateur recharge la page.
    hotUpdate({ file: changed }) {
      if (changed !== file) return;
      const module = this.environment.moduleGraph.getModuleById(RESOLVED_ID);
      if (module) this.environment.moduleGraph.invalidateModule(module);
      if (this.environment.name === 'client') this.environment.hot.send({ type: 'full-reload' });
    },
  };
}
