// Libellés et aides de l'éditeur, lus dans config/i18n/fr.json : les mêmes que ceux du rapport « À vérifier »
// (section « champs »), des listes de valeurs (« enums ») et des collections. Aucun texte écrit ici.
import messages from '../../../config/i18n/fr.json' with { type: 'json' };
import { frenchTypography } from '../typo.ts';

type Dictionary = Record<string, string>;
type Messages = typeof messages;

const fieldLabels: Dictionary = messages.champs;
const help: Dictionary = messages.editeur.aide;

// Libellé d'un champ ; une clé absente est une erreur de configuration, signalée tout de suite.
export function label(field: string): string {
  const value = fieldLabels[field];
  if (value === undefined) throw new Error(`Libellé manquant pour le champ « ${field} » (config/i18n/fr.json, section « champs »).`);
  return frenchTypography(value);
}

// Aide contextuelle d'un champ : d'abord celle propre à la collection (« articles.title »), puis la générale.
export function describe(field: string, scope?: string): string | undefined {
  const value = (scope && help[`${scope}.${field}`]) ?? help[field];
  return value === undefined ? undefined : frenchTypography(value);
}

// Libellé et aide réunis, prêts à passer à un champ Keystatic.
export function labelled(field: string, scope?: string): { label: string; description?: string } {
  const description = describe(field, scope);
  return description === undefined ? { label: label(field) } : { label: label(field), description };
}

// Options d'une liste fermée : valeurs du code, libellés de la section « enums ».
export function options<V extends string>(group: keyof Messages['enums'], values: readonly V[]): Array<{ label: string; value: V }> {
  const labels = messages.enums[group] as Dictionary;
  return values.map((value) => ({ label: frenchTypography(labels[value] ?? value), value }));
}

export function collectionLabel(collection: keyof Messages['collections']): string {
  return frenchTypography(messages.collections[collection]);
}

// Texte de la section « editeur » (groupes, navigation, blocs, valeurs, messages) ; « a.b » lit un sous-groupe.
export function editorText(group: 'groupes' | 'navigation' | 'blocs' | 'valeurs' | 'messages', key: string): string {
  const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages.editeur[group]);
  if (typeof value !== 'string') throw new Error(`Texte manquant : editeur.${group}.${key} (config/i18n/fr.json).`);
  return frenchTypography(value);
}
