// Zod configuré en français, partagé par le site (Astro) et les scripts (Node).
// Toute validation du projet importe `z` depuis ce module, jamais directement.
import { z } from 'astro/zod';

const TYPE_NAMES: Record<string, string> = {
  string: 'un texte',
  number: 'un nombre',
  int: 'un nombre entier',
  boolean: 'une case (vrai ou faux)',
  array: 'une liste',
  object: 'un groupe de champs',
  date: 'une date',
};

function plural(n: number, singular: string, pluralForm: string): string {
  return n <= 1 ? singular : pluralForm;
}

// Messages d'erreur rédigés pour un juriste : ce qui ne va pas et comment corriger.
function customError(issue: z.core.$ZodRawIssue): string | undefined {
  switch (issue.code) {
    case 'invalid_type':
      if (issue.input === undefined || issue.input === null) return 'Champ obligatoire manquant.';
      return `Valeur invalide : ${TYPE_NAMES[issue.expected] ?? issue.expected} est attendu.`;
    case 'too_small': {
      const min = Number(issue.minimum);
      if (issue.origin === 'string') {
        const len = typeof issue.input === 'string' ? issue.input.length : 0;
        if (min === 1) return 'Champ obligatoire vide.';
        return `Trop court : ${len} ${plural(len, 'caractère', 'caractères')}, minimum ${min}.`;
      }
      if (issue.origin === 'array') {
        const len = Array.isArray(issue.input) ? issue.input.length : 0;
        return `Trop peu d'éléments : ${len}, minimum ${min}.`;
      }
      return `Valeur trop petite : minimum ${min}.`;
    }
    case 'too_big': {
      const max = Number(issue.maximum);
      if (issue.origin === 'string') {
        const len = typeof issue.input === 'string' ? issue.input.length : 0;
        return `Trop long : ${len} ${plural(len, 'caractère', 'caractères')}, maximum ${max}.`;
      }
      if (issue.origin === 'array') {
        const len = Array.isArray(issue.input) ? issue.input.length : 0;
        return `Trop d'éléments : ${len}, maximum ${max}.`;
      }
      return `Valeur trop grande : maximum ${max}.`;
    }
    case 'invalid_value':
      if (issue.input === undefined || issue.input === null) return 'Champ obligatoire manquant.';
      return `Valeur « ${String(issue.input)} » non autorisée. Valeurs possibles : ${issue.values.join(', ')}.`;
    case 'invalid_format':
      if (issue.format === 'url') return 'Adresse web invalide : elle doit commencer par https://.';
      if (issue.format === 'email') return 'Adresse courriel invalide.';
      return undefined;
    case 'unrecognized_keys':
      return `Champ inconnu : ${issue.keys.map((k) => `« ${k} »`).join(', ')} (faute de frappe?).`;
    default:
      return undefined;
  }
}

z.config(z.locales.frCA());
z.config({ customError });

export { z };
