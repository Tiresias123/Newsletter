// Validation des champs de formulaire, sans dépendance : le Worker reste léger (Zod et ses traductions
// pèseraient plusieurs centaines de Kio). Chaque règle rend la valeur retenue, ou undefined si elle est refusée.

export type Rule<T> = (value: string | undefined) => T | undefined;

// Motif « pratique » des adresses courriel de Zod, repris tel quel : ASCII, sans point au début, à la fin ou
// doublé, domaine avec une extension d'au moins deux lettres.
const EMAIL = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;

// Ramène chaque saut de ligne à « \n » (le navigateur en compte un caractère, l'envoi le transmet en CRLF) et
// retire les caractères de contrôle, sauf la tabulation et les sauts de ligne.
export const clean = (text: string) => text.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

export const email: Rule<string> = (value) => (value !== undefined && value.length <= 254 && EMAIL.test(value) ? value : undefined);

// Texte de `min` à `max` caractères, comptés comme le navigateur (minlength, maxlength), conforme au motif s'il y en
// a un; rendu sans les espaces des extrémités, et jamais vide.
export function text(min: number, max: number, pattern?: RegExp): Rule<string> {
  return (value) => {
    if (value === undefined) return undefined;
    const cleaned = clean(value);
    const trimmed = cleaned.trim();
    return trimmed && cleaned.length >= min && cleaned.length <= max && (!pattern || pattern.test(trimmed)) ? trimmed : undefined;
  };
}

export function oneOf<T extends string>(values: readonly T[]): Rule<T> {
  return (value) => (value !== undefined && (values as readonly string[]).includes(value) ? (value as T) : undefined);
}

// Champ facultatif : absent ou vide, il prend la valeur par défaut.
export function optional<T>(rule: Rule<T>, fallback: T): Rule<T> {
  return (value) => (value === undefined || value === '' ? fallback : rule(value));
}

type Parsed<R> = { [K in keyof R]: R[K] extends Rule<infer T> ? T : never };

// Valeurs des champs attendus, ou undefined si l'un d'eux est refusé; les autres champs sont ignorés.
export function validate<R extends Record<string, Rule<unknown>>>(form: Record<string, string>, rules: R): Parsed<R> | undefined {
  const result: Record<string, unknown> = {};
  for (const [name, rule] of Object.entries(rules)) {
    const value = rule(form[name]);
    if (value === undefined) return undefined;
    result[name] = value;
  }
  return result as Parsed<R>;
}
