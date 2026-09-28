// Intertitre de groupe dans un formulaire (Contenu, Classement, Publication…, ARCHITECTURE section 7.0) :
// Keystatic n'a pas de groupes de champs sans imbrication. Ce pseudo-champ affiche un titre et n'écrit rien
// dans le fichier (même comportement que fields.empty()).
import { fields } from '@keystatic/core';
import { createElement } from 'react';
import { editorText } from './labels.ts';

const style = {
  margin: '24px 0 0',
  paddingTop: '16px',
  borderTop: '1px solid currentColor',
  fontSize: '1.125rem',
  fontFamily: 'inherit',
  fontWeight: 700,
  opacity: 0.85,
} as const;

export function heading(group: string) {
  const text = editorText('groupes', group);
  return { ...fields.empty(), label: text, Input: () => createElement('h2', { style }, text) };
}
