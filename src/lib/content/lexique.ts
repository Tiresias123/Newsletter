// Index alphabétique du lexique (brief 7.1) : termes regroupés par première lettre, sans accent (« É » → « E »),
// « # » pour les termes qui commencent par un chiffre ou un symbole ; ordre alphabétique français.
import type { Entry } from './graph.ts';

export const ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#'] as const;

export function letterOf(term: string): string {
  const first = term.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').charAt(0).toUpperCase();
  return first >= 'A' && first <= 'Z' ? first : '#';
}

export function lexiqueIndex(entries: readonly Entry<'lexique'>[]): Array<{ letter: string; entries: Entry<'lexique'>[] }> {
  const sorted = [...entries].sort((a, b) => a.data.term.localeCompare(b.data.term, 'fr-CA', { sensitivity: 'base' }));
  return ALPHABET.map((letter) => ({ letter, entries: sorted.filter((e) => letterOf(e.data.term) === letter) })).filter((group) => group.entries.length > 0);
}

// Ancre d'une lettre dans la page d'index.
export const letterAnchor = (letter: string) => (letter === '#' ? 'lettre-autres' : `lettre-${letter.toLowerCase()}`);
