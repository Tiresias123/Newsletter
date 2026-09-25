// Mise en forme des erreurs de validation pour l'auteur : fichier, champ en clair, message.
import type { z } from './zod.ts';
import messages from '../../config/i18n/fr.json' with { type: 'json' };

const FIELD_LABELS: Record<string, string> = messages.champs;

export type ValidationProblem = { file: string; field: string; message: string };

// « sources › 2 › value › url » devient « Sources › élément 3 › Adresse web ».
export function describePath(path: readonly PropertyKey[]): string {
  if (path.length === 0) return 'fichier entier';
  return path
    .filter((key) => key !== 'value')
    .map((key) => (typeof key === 'number' ? `élément ${key + 1}` : (FIELD_LABELS[String(key)] ?? String(key))))
    .join(' › ');
}

export function problemsFromZod(file: string, error: z.ZodError): ValidationProblem[] {
  return error.issues.map((issue) => ({ file, field: describePath(issue.path), message: issue.message }));
}

export function formatProblems(problems: readonly ValidationProblem[]): string {
  return problems.map((p) => `  • ${p.file} — ${p.field} : ${p.message}`).join('\n');
}

export class ContentValidationError extends Error {
  readonly problems: ValidationProblem[];

  constructor(title: string, problems: ValidationProblem[]) {
    super(`${title}\n${formatProblems(problems)}`);
    this.name = 'ContentValidationError';
    this.problems = problems;
  }
}
