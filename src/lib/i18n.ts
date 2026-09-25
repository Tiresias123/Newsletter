// Chaînes d'interface : toutes lues dans config/i18n/fr.json, jamais écrites dans src/.
import messages from '../../config/i18n/fr.json' with { type: 'json' };
import { frenchTypography } from './typo.ts';

type Plural = { one: string; other: string };
type Messages = typeof messages;

// Clés valides, calculées depuis le fichier JSON : une clé inconnue est une erreur de typage.
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : T[K] extends Plural ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaves<Messages>;
export type Params = Record<string, string | number>;

export const LOCALE = 'fr-CA';
const pluralRules = new Intl.PluralRules(LOCALE);

function lookup(key: string): string | Plural {
  let node: unknown = messages;
  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && part in node) node = (node as Record<string, unknown>)[part];
    else throw new Error(`Texte d'interface introuvable : « ${key} » (config/i18n/fr.json).`);
  }
  if (typeof node === 'string') return node;
  if (node && typeof node === 'object' && 'one' in node && 'other' in node) return node as Plural;
  throw new Error(`La clé « ${key} » de config/i18n/fr.json n'est pas un texte.`);
}

// Remplace les {variables} par leurs valeurs.
export function interpolate(template: string, params: Params = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}

export function t(key: MessageKey, params: Params = {}): string {
  const entry = lookup(key);
  const template = typeof entry === 'string' ? entry : pluralRules.select(Number(params.count ?? 0)) === 'one' ? entry.one : entry.other;
  return frenchTypography(interpolate(template, params));
}

// Libellé d'une valeur d'énumération (statut, type d'organisme…) ; la valeur brute sert de repli.
export function enumLabel(group: keyof Messages['enums'], value: string): string {
  const labels = messages.enums[group] as Record<string, string>;
  return labels[value] ?? value;
}

// Section « dates » transmise au navigateur pour les dates relatives.
export const relativeDateMessages = messages.dates;
