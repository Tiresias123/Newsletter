// Constructions MDX que l'éditeur Keystatic ne sait pas relire (étude du 28 septembre 2026, ARCHITECTURE
// section 4.3) : le site les affiche, mais l'éditeur refuserait d'ouvrir le contenu, sans dire pourquoi.
import { BLOCKS, findBlocks, hideCode } from '../content/blocks.ts';
import type { BlockProblem } from './blocks.ts';
import { isEditorValue, parseLiteral } from './literal.ts';
import { findMarkers } from './markers.ts';

// Blocs qui entourent des paragraphes : balise ouvrante et balise fermante sur des lignes à part.
const WRAPPERS = Object.entries(BLOCKS)
  .filter(([, spec]) => spec.children !== 'none')
  .map(([name]) => name)
  .filter((name) => !['Definition', 'Note'].includes(name));
// Blocs placés dans le fil du texte : tous les autres occupent une ligne à eux (plusieurs blocs peuvent la partager).
const INLINE = ['Definition', 'Note', 'StatutReglementaire'];

// Valeur littérale au sens de l'éditeur : textes entre guillemets, null, listes et objets de ces valeurs.
// Tout le reste le bloque : nombre (même positif), true, false, calcul, variable.
export function isEditorLiteral(source: string): boolean {
  const parsed = parseLiteral(source);
  return parsed !== undefined && isEditorValue(parsed.value);
}

const lineAt = (text: string, index: number) => text.slice(0, index).split('\n').length;
const blank = (part: string) => part.replace(/[^\n]/g, ' ');

export function editorProblems(body: string): BlockProblem[] {
  const problems: BlockProblem[] = [];
  const text = hideCode(body);
  const add = (index: number, message: string) => problems.push({ line: lineAt(text, index), message: `éditeur : ${message}` });
  const uses = findBlocks(body);

  for (const use of uses) {
    for (const [prop, value] of Object.entries(use.props)) {
      if (use.bare.includes(prop)) {
        add(use.start, `bloc ${use.name}, « ${prop} » : attribut sans valeur. Écrivez ${prop}="…".`);
      } else if (typeof value !== 'string' && !isEditorLiteral(value.expression)) {
        add(use.start, `bloc ${use.name}, « ${prop} » : valeur qu'il ne sait pas relire. Écrivez chaque nombre entre guillemets (« "-2500" », « "6" »), sans calcul ni variable.`);
      }
    }
  }
  // Hors des balises de blocs (repérées en tenant compte des guillemets) : texte, HTML, expressions.
  let outside = text;
  for (const use of uses) outside = outside.slice(0, use.start) + blank(outside.slice(use.start, use.end)) + outside.slice(use.end);
  outside = outside.replace(/<\/[A-Z][A-Za-z0-9]*\s*>/g, blank);
  const outsideLines = outside.split('\n');
  const reported = new Set<number>();
  for (const use of uses.filter((u) => WRAPPERS.includes(u.name) && !u.selfClosing)) {
    if (!text.slice(use.end).split('\n')[0]?.trim()) continue;
    reported.add(use.line);
    add(use.start, `bloc ${use.name} : placez le texte sur ses propres lignes, entre la balise ouvrante et la balise fermante.`);
  }
  for (const name of WRAPPERS) {
    for (const m of text.matchAll(new RegExp(`\\S[^\\S\\n]*</${name}>`, 'g'))) {
      if (!reported.has(lineAt(text, m.index))) add(m.index, `bloc ${name} : placez la balise fermante </${name}> seule sur sa ligne.`);
    }
  }
  for (const use of uses.filter((u) => BLOCKS[u.name] && !INLINE.includes(u.name))) {
    if (reported.has(use.line) || !outsideLines[use.line - 1]?.trim()) continue;
    reported.add(use.line);
    add(use.start, `bloc ${use.name} : placez-le seul sur sa ligne, hors d'un paragraphe.`);
  }
  const rules: Array<[RegExp, string]> = [
    [/<!--/g, 'commentaire HTML : supprimez-le.'],
    [/(?<!\\)<(?:[a-z][\w-]*|\/?>)/g, 'balise HTML : utilisez la mise en forme de l\'éditeur ou un bloc.'],
    [/(?<!\\)\{/g, 'accolade : écrivez « \\{ » ou reformulez.'],
    [/^(?:import|export)\s/gm, 'ligne import ou export : supprimez-la.'],
    [/(?<!\\)!\[/g, 'image Markdown : utilisez le bloc Image, que l\'éditeur sait relire.'],
    [/(?<!\\)\[\^[^\]\s]+\]/g, 'note de bas de page Markdown « [^1] » : utilisez le bloc Note, l\'éditeur la détruirait.'],
    [/^[^\S\n]*\|?(?=[^\n]*\|)(?=[^\n]*:)[^\S\n]*:?-+:?[^\S\n]*(?:\|[^\S\n]*:?-+:?[^\S\n]*)*\|?[^\S\n]*$/gm, "alignement des colonnes d'un tableau : l'éditeur le retirerait."],
  ];
  for (const [pattern, message] of rules) for (const m of outside.matchAll(pattern)) add(m.index, message);
  // Seules deux notes collées l'une à l'autre fusionnent ; un espace suffit à les garder distinctes.
  for (const m of text.matchAll(/<\/Note><Note>/g)) add(m.index, 'deux notes accolées seraient fusionnées : séparez-les par du texte.');
  for (const m of text.matchAll(/<Definition\b[^>]*>(?:(?!<\/Definition>)[\s\S])*<Note>/g)) add(m.index, 'une note dans une définition serait déplacée : placez la note après la définition.');
  return problems.sort((a, b) => a.line - b.line);
}

// Images : l'éditeur ne retrouve une image que dans le dossier de l'entrée, content/images/<dossier>/<id>/ ;
// ailleurs, il l'effacerait sans prévenir au prochain enregistrement. Il nomme l'image d'un champ d'après
// le champ (cover/src.webp) : sous un autre nom, il la renommerait.
const IMAGE_FIELDS: Array<readonly string[]> = [['cover', 'src'], ['seo', 'socialImage'], ['logo'], ['avatar']];
const IMAGE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpe?g|png|webp|avif|gif)$/;

export function editorImageProblems(folder: string, id: string, data: unknown, body: string): Array<{ field: string[]; message: string }> {
  const problems: Array<{ field: string[]; message: string }> = [];
  const at = (path: readonly string[]) => path.reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], data);
  const prefix = `../images/${folder}/${id}/`;
  for (const path of IMAGE_FIELDS) {
    const value = at(path);
    if (typeof value !== 'string' || !value) continue;
    const expected = `${prefix}${path.join('/')}.`;
    if (!value.startsWith(prefix)) {
      problems.push({ field: [...path], message: `éditeur : image hors du dossier de ce contenu (${prefix.slice(3)}) ; l'éditeur l'effacerait à l'enregistrement.` });
    } else if (!value.startsWith(expected) || !IMAGE_NAME.test(value.slice(expected.length - 1).replace(/^\./, 'x.'))) {
      problems.push({ field: [...path], message: `éditeur : image à nommer ${expected.slice(3)}webp (ou .jpg, .png…) ; l'éditeur la renommerait à l'enregistrement.` });
    }
  }
  const cover = at(['cover']) as { src?: unknown; alt?: unknown; credit?: unknown } | undefined;
  if (cover && !cover.src && (cover.alt || cover.credit)) problems.push({ field: ['cover'], message: 'couverture sans image, mais avec un texte alternatif ou un crédit : image retirée par erreur ?' });
  for (const use of findBlocks(body).filter((u) => u.name === 'Image')) {
    const src = use.props.src;
    if (typeof src !== 'string' || findMarkers(src).length > 0) continue;
    const [dir, owner, name, ...rest] = src.split('/');
    if (dir !== folder || owner !== id || !name || rest.length > 0 || !IMAGE_NAME.test(name)) {
      problems.push({ field: ['body'], message: `éditeur : bloc Image, « src » attendu sous la forme ${folder}/${id}/nom-en-minuscules.webp (JPEG, PNG, WebP, AVIF ou GIF) ; sinon l'éditeur effacerait l'image.` });
    }
  }
  return problems;
}
