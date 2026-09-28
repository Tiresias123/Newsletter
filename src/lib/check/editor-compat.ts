// Constructions MDX que l'éditeur Keystatic ne sait pas relire (étude du 28 septembre 2026, ARCHITECTURE
// section 4.3) : le site les affiche, mais l'éditeur refuserait d'ouvrir le contenu, sans dire pourquoi.
import { BLOCKS, findBlocks, hideCode } from '../content/blocks.ts';
import type { BlockProblem } from './blocks.ts';
import { findMarkers } from './markers.ts';

// Blocs qui entourent des paragraphes : balise ouvrante et balise fermante sur des lignes à part.
const WRAPPERS = Object.entries(BLOCKS)
  .filter(([, spec]) => spec.children !== 'none')
  .map(([name]) => name)
  .filter((name) => !['Definition', 'Note'].includes(name));

// Valeur littérale au sens de l'éditeur : textes entre guillemets, nombres positifs, true, false, null,
// listes et objets de ces valeurs. Tout le reste (nombre négatif, calcul, variable) le bloque.
export function isEditorLiteral(source: string): boolean {
  let i = 0;
  const space = () => {
    while (i < source.length && /\s/.test(source[i] ?? '')) i += 1;
  };
  const text = (): boolean => {
    const quote = source[i];
    for (i += 1; i < source.length; i += 1) {
      if (source[i] === '\\') i += 1;
      else if (source[i] === quote) {
        i += 1;
        return true;
      }
    }
    return false;
  };
  const scalar = (pattern: RegExp): boolean => {
    const match = pattern.exec(source.slice(i));
    if (!match) return false;
    i += match[0].length;
    return true;
  };
  const list = (close: string, item: () => boolean): boolean => {
    i += 1;
    space();
    while (source[i] !== close) {
      if (!item()) return false;
      space();
      if (source[i] === ',') i += 1;
      else if (source[i] !== close) return false;
      space();
    }
    i += 1;
    return true;
  };
  const value = (): boolean => {
    space();
    const c = source[i];
    if (c === '"' || c === "'") return text();
    if (c === '[') return list(']', value);
    if (c === '{') {
      return list('}', () => {
        const key = source[i] === '"' || source[i] === "'" ? text() : scalar(/^[A-Za-z_$][\w$]*|^\d+/);
        space();
        if (!key || source[i] !== ':') return false;
        i += 1;
        return value();
      });
    }
    return scalar(/^(?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)(?![\w$])/);
  };
  const ok = value();
  space();
  return ok && i === source.length;
}

const lineAt = (text: string, index: number) => text.slice(0, index).split('\n').length;

export function editorProblems(body: string): BlockProblem[] {
  const problems: BlockProblem[] = [];
  const text = hideCode(body);
  const add = (index: number, message: string) => problems.push({ line: lineAt(text, index), message: `éditeur : ${message}` });

  for (const use of findBlocks(body)) {
    for (const [prop, value] of Object.entries(use.props)) {
      if (typeof value !== 'string' && !isEditorLiteral(value.expression)) {
        problems.push({ line: use.line, message: `éditeur : bloc ${use.name}, « ${prop} » : valeur qu'il ne sait pas relire. Écrivez un nombre négatif entre guillemets (« "-2500" »), sans calcul ni variable.` });
      }
    }
  }
  for (const name of WRAPPERS) {
    const lines = new Set<number>();
    for (const m of text.matchAll(new RegExp(`<${name}(?=[\\s>])(?:[^>{]|\\{[^}]*\\})*>([^\\n]*)`, 'g'))) {
      if (!m[1]?.trim()) continue;
      lines.add(lineAt(text, m.index));
      add(m.index, `bloc ${name} : placez le texte sur ses propres lignes, entre la balise ouvrante et la balise fermante.`);
    }
    for (const m of text.matchAll(new RegExp(`\\S[^\\S\\n]*</${name}>`, 'g'))) {
      if (!lines.has(lineAt(text, m.index))) add(m.index, `bloc ${name} : placez la balise fermante </${name}> seule sur sa ligne.`);
    }
  }
  // Hors des balises de blocs : balises HTML, commentaires, expressions, import et export.
  const outside = text.replace(/<\/?[A-Z][A-Za-z0-9]*(?:[^>{]|\{(?:[^{}]|\{[^{}]*\})*\})*>/g, (tag) => tag.replace(/[^\n]/g, ' '));
  const rules: Array<[RegExp, string]> = [
    [/<!--/g, 'commentaire HTML : supprimez-le.'],
    [/(?<!\\)<(?:[a-z][\w-]*|\/?>)/g, 'balise HTML : utilisez la mise en forme de l\'éditeur ou un bloc.'],
    [/(?<!\\)\{/g, 'accolade : écrivez « \\{ » ou reformulez.'],
    [/^(?:import|export)\s/gm, 'ligne import ou export : supprimez-la.'],
    [/(?<!\\)!\[/g, 'image Markdown : utilisez le bloc Image, que l\'éditeur sait relire.'],
  ];
  for (const [pattern, message] of rules) for (const m of outside.matchAll(pattern)) add(m.index, message);
  for (const m of text.matchAll(/<\/Note>\s*<Note>/g)) add(m.index, 'deux notes accolées seraient fusionnées : séparez-les par du texte.');
  for (const m of text.matchAll(/<Definition\b[^>]*>(?:(?!<\/Definition>)[\s\S])*<Note>/g)) add(m.index, 'une note dans une définition serait déplacée : placez la note après la définition.');
  return problems;
}

// Images : l'éditeur ne retrouve une image que dans le dossier de l'entrée, content/images/<dossier>/<id>/ ;
// ailleurs, il l'effacerait sans prévenir au prochain enregistrement.
const IMAGE_FIELDS: Array<readonly string[]> = [['cover', 'src'], ['seo', 'socialImage'], ['logo'], ['avatar']];
const IMAGE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpe?g|png|webp|avif|gif)$/;

export function editorImageProblems(folder: string, id: string, data: unknown, body: string): Array<{ field: string[]; message: string }> {
  const problems: Array<{ field: string[]; message: string }> = [];
  const at = (path: readonly string[]) => path.reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], data);
  const prefix = `../images/${folder}/${id}/`;
  for (const path of IMAGE_FIELDS) {
    const value = at(path);
    if (typeof value === 'string' && value && !value.startsWith(prefix)) {
      problems.push({ field: [...path], message: `éditeur : image hors du dossier de ce contenu (${prefix.slice(3)}) ; l'éditeur l'effacerait à l'enregistrement.` });
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
