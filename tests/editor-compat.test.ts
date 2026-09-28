import { describe, expect, it } from 'vitest';
import { editorImageProblems, editorProblems, isEditorLiteral } from '../src/lib/check/editor-compat.ts';
import { parseLiteral } from '../src/lib/check/literal.ts';

const messages = (body: string) => editorProblems(body).map((p) => `${p.line} ${p.message}`);
const NUMBER = "valeur qu'il ne sait pas relire. Écrivez chaque nombre entre guillemets (« \"-2500\" », « \"6\" »), sans calcul ni variable.";

describe("contenus que l'éditeur ne saurait pas rouvrir", () => {
  it("accepte les seules valeurs que relit l'éditeur : textes, null, listes et objets", () => {
    expect(isEditorLiteral('[{ date: "2023-02-22", title: \'x\', }]')).toBe(true);
    expect(isEditorLiteral('{ "label": "a", amount: "-6000", rien: null }')).toBe(true);
    expect(isEditorLiteral('[[""], []]')).toBe(true);
    for (const refused of ['[{ amount: -6000 }]', '{ n: 1.5e3 }', '[true]', 'undefined', '`x`', '"a" + "b"', '[1, , 2]', '{ ...a }']) expect(isEditorLiteral(refused), refused).toBe(false);
  });

  it("lit une valeur littérale sans l'exécuter", () => {
    expect(parseLiteral('{ "a\\u00e9": [1, -2.5, true, null, \'l\\\'x\'], b: {} }')).toEqual({ value: { aé: [1, -2.5, true, null, "l'x"], b: {} } });
    for (const refused of ['a', '[1] + 1', '{ [a]: 1 }', '"x', '() => 1']) expect(parseLiteral(refused), refused).toBeUndefined();
  });

  it('signale un nombre, un attribut sans valeur, un encadré sur une ligne, du HTML, une accolade et une image Markdown', () => {
    const body = [
      '<ExempleChiffre rows={[{ label: "a", amount: -1 }]} total={{ label: "t", amount: "1" }} />',
      '<Callout variant="attention">Texte</Callout>',
      'Un <div>bloc</div>, un {calcul} et ![schéma](a.webp).',
      '<Callout variant="attention" title>\nTexte\n</Callout>',
      '<ListeArticles count={6} />',
    ].join('\n\n');
    expect(messages(body)).toEqual([
      `1 éditeur : bloc ExempleChiffre, « rows » : ${NUMBER}`,
      '3 éditeur : bloc Callout : placez le texte sur ses propres lignes, entre la balise ouvrante et la balise fermante.',
      "5 éditeur : balise HTML : utilisez la mise en forme de l'éditeur ou un bloc.",
      '5 éditeur : accolade : écrivez « \\{ » ou reformulez.',
      "5 éditeur : image Markdown : utilisez le bloc Image, que l'éditeur sait relire.",
      '7 éditeur : bloc Callout, « title » : attribut sans valeur. Écrivez title="…".',
      `11 éditeur : bloc ListeArticles, « count » : ${NUMBER}`,
    ]);
  });

  it('exige un bloc seul sur sa ligne, hors du fil du texte', () => {
    expect(messages('Pour conclure. <MiseEnGarde />')).toEqual(["1 éditeur : bloc MiseEnGarde : placez-le seul sur sa ligne, hors d'un paragraphe."]);
    expect(messages('<MiseEnGarde /> <MiseEnGarde />\n\nVoir <StatutReglementaire dossier="x" /> ici.')).toEqual([]);
  });

  it('lit les balises en tenant compte des guillemets et des accolades imbriquées', () => {
    const body = [
      '<Comparatif caption="Seuil > 30 000 $" columns={["a","b"]} rows={[["x","y"]]} />',
      '<FAQ items={[{"question":"q","answer":"Écrivez {x} ici"}]} />',
      '<Callout variant="attention" title="Plus de 10 > 5">\nTexte\n</Callout>',
    ].join('\n\n');
    expect(messages(body)).toEqual([]);
  });

  it("signale les notes de bas de page Markdown et l'alignement des colonnes", () => {
    expect(messages("Selon l'ARC[^1], la règle.\n\n[^1]: https://exemple.ca")).toHaveLength(2);
    expect(messages('| a | b |\n| :--- | ---: |\n| 1 | 2 |')).toEqual(["2 éditeur : alignement des colonnes d'un tableau : l'éditeur le retirerait."]);
    expect(messages('| a | b |\n| --- | --- |\n| 1 | 2 |\n\n---\n\nTexte \\[^1].')).toEqual([]);
  });

  it('signale les notes collées ou placées dans une définition, et ignore le code', () => {
    expect(messages('Texte.<Note>a</Note><Note>b</Note>')).toEqual(['1 éditeur : deux notes accolées seraient fusionnées : séparez-les par du texte.']);
    expect(messages('Texte.<Note>a</Note> <Note>b</Note> suite.')).toEqual([]);
    expect(messages('Le <Definition term="x">mot<Note>n</Note></Definition>.')).toEqual(['1 éditeur : une note dans une définition serait déplacée : placez la note après la définition.']);
    expect(messages('Écrivez `<Callout variant="x">texte</Callout>` ou `{a}`.')).toEqual([]);
  });

  it("exige que les images restent dans le dossier de l'entrée, sous le nom que leur donne l'éditeur", () => {
    const ok = editorImageProblems('articles', 'mon-article', { cover: { src: '../images/articles/mon-article/cover/src.webp', alt: 'a', credit: 'c' } }, '<Image src="articles/mon-article/schema.webp" alt="a" credit="c" />');
    expect(ok).toEqual([]);
    const problems = editorImageProblems(
      'articles',
      'mon-article',
      { cover: { src: '../images/articles/mon-article/couverture.webp', alt: 'a', credit: 'c' }, seo: { socialImage: '../images/articles/autre/seo/socialImage.png' } },
      '<Image src="articles/autre/schema.webp" alt="a" credit="c" />\n\n<Image src="articles/mon-article/Photo.JPG" alt="a" credit="c" />',
    );
    expect(problems.map((p) => p.field.join('.'))).toEqual(['cover.src', 'seo.socialImage', 'body', 'body']);
    expect(editorImageProblems('articles', 'mon-article', { cover: { alt: 'a', credit: 'c' } }, '').map((p) => p.field.join('.'))).toEqual(['cover']);
  });
});
