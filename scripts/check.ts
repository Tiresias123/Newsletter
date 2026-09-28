// npm run check : validations du point 8.2 du brief et rapport docs/A-VERIFIER.md (non versionné).
// Mode production par défaut (brouillons masqués) ; SITE_MODE=preview, ou une branche autre que main dans
// Workers Builds, vérifie le mode aperçu (src/lib/site-mode.ts).
// Option --liens-externes : interroge aussi chaque lien externe (rapport hebdomadaire, réseau requis).
// Variable VEILLE_DERNIER_PASSAGE : dernier passage planifié de la tâche « veille » (rapport hebdomadaire).
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runCheck } from '../src/lib/check/index.ts';
import { renderMarkdown, summaryLine } from '../src/lib/check/report.ts';
import { formatProblems } from '../src/lib/errors.ts';
import { t } from '../src/lib/i18n.ts';
import { previewBuild } from '../src/lib/site-mode.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const mode = previewBuild() ? 'apercu' : 'production';
const result = await runCheck({ root, mode, externalLinks: process.argv.includes('--liens-externes'), veilleLastRun: process.env.VEILLE_DERNIER_PASSAGE || undefined });

mkdirSync(`${root}docs`, { recursive: true });
writeFileSync(`${root}docs/A-VERIFIER.md`, renderMarkdown(result));

const blocking = result.problems.filter((p) => p.severity === 'bloquant');
console.log(`Vérification du site en mode ${t(`report.modes.${mode}`)} : ${summaryLine(result.problems)}.`);
if (blocking.length > 0) console.error(`\nErreurs bloquantes à corriger :\n${formatProblems(blocking)}\n`);
console.log('Rapport complet : docs/A-VERIFIER.md');
process.exitCode = blocking.length > 0 ? 1 : 0;
