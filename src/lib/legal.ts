// Avertissements de config/legal.json : la variante choisie par le contenu, sinon celle de sa catégorie,
// sinon l'avertissement général. « aucun » n'en affiche pas (sauf là où il est imposé, comme en fiscalité).
import { getConfig } from './config/index.ts';

export type Disclaimer = { id: string; title: string; text: string };

export function disclaimer(id: string | undefined): Disclaimer | undefined {
  if (!id || id === 'aucun') return undefined;
  return getConfig().legal.disclaimers.find((d) => d.id === id);
}

export function disclaimerFor(variant: string | undefined, categoryDefault?: string): Disclaimer | undefined {
  if (variant === 'aucun') return undefined;
  return disclaimer(variant || categoryDefault || 'general');
}
