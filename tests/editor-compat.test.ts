import { describe, expect, it } from 'vitest';
import { editorImageProblems, editorProblems, isEditorLiteral } from '../src/lib/check/editor-compat.ts';

const messages = (body: string) => editorProblems(body).map((p) => `${p.line} ${p.message}`);

describe("contenus que l'éditeur ne saurait pas rouvrir", () => {
  it('accepte les seules valeurs littérales : textes, nombres positifs, listes et objets', () => {
    expect(isEditorLiteral('[{ date: "2023-02-22", title: \'x\', }]')).toBe(true);
    expect(isEditorLiteral('{ "label": "a", amount: "-6000", n: 1.5e3, ok: true, rien: null }')).toBe(true);
    expect(isEditorLiteral('[[""], []]')).toBe(true);
    for (const refused of ['[{ amount: -6000 }]', 'undefined', '`x`', '"a" + "b"', '[1, , 2]', '{ ...a }']) expect(isEditorLiteral(refused), refused).toBe(false);
  });

  it('signale un montant négatif, un encadré sur une ligne, du HTML, une accolade et une image Markdown', () => {
    const body = [
      '<ExempleChiffre rows={[{ label: "a", amount: -1 }]} total={{ label: "t", amount: "1" }} />',
      '<Callout variant="attention">Texte</Callout>',
      'Un <div>bloc</div>, un {calcul} et ![schéma](a.webp).',
      '<Callout variant="attention">\nTexte\n</Callout>',
    ].join('\n\n');
    expect(messages(body)).toEqual([
      "1 éditeur : bloc ExempleChiffre, « rows » : valeur qu'il ne sait pas relire. Écrivez un nombre négatif entre guillemets (« \"-2500\" »), sans calcul ni variable.",
      '3 éditeur : bloc Callout : placez le texte sur ses propres lignes, entre la balise ouvrante et la balise fermante.',
      "5 éditeur : balise HTML : utilisez la mise en forme de l'éditeur ou un bloc.",
      '5 éditeur : accolade : écrivez « \\{ » ou reformulez.',
      "5 éditeur : image Markdown : utilisez le bloc Image, que l'éditeur sait relire.",
    ]);
  });

  it('signale les notes accolées ou placées dans une définition, et ignore le code', () => {
    expect(messages('Texte.<Note>a</Note><Note>b</Note>')).toEqual(['1 éditeur : deux notes accolées seraient fusionnées : séparez-les par du texte.']);
    expect(messages('Le <Definition term="x">mot<Note>n</Note></Definition>.')).toEqual(['1 éditeur : une note dans une définition serait déplacée : placez la note après la définition.']);
    expect(messages('Écrivez `<Callout variant="x">texte</Callout>` ou `{a}`.')).toEqual([]);
  });

  it("exige que les images restent dans le dossier de l'entrée, en minuscules", () => {
    const ok = editorImageProblems('articles', 'mon-article', { cover: { src: '../images/articles/mon-article/cover/src.webp', alt: 'a', credit: 'c' } }, '<Image src="articles/mon-article/schema.webp" alt="a" credit="c" />');
    expect(ok).toEqual([]);
    const problems = editorImageProblems(
      'articles',
      'mon-article',
      { cover: { alt: 'a', credit: 'c' }, seo: { socialImage: '../images/articles/autre/seo/socialImage.png' } },
      '<Image src="articles/autre/schema.webp" alt="a" credit="c" />\n\n<Image src="articles/mon-article/Photo.JPG" alt="a" credit="c" />',
    );
    expect(problems.map((p) => p.field.join('.'))).toEqual(['seo.socialImage', 'cover', 'body', 'body']);
  });
});
