import { describe, expect, it } from 'vitest';
import { mdxToJs } from 'satteri';
import { notesPlugin } from '../src/lib/mdx/notes.ts';
import { typographyPlugin } from '../src/lib/mdx/typography.ts';

// mdxToJs devient asynchrone si une extension l'est : on attend toujours le résultat.
const compile = async (source: string) => (await mdxToJs(source, { mdastPlugins: [notesPlugin, typographyPlugin] })).code;

describe('extensions MDX', () => {
  it('pose les espaces insécables dans le texte courant, pas dans une citation littérale', async () => {
    const code = await compile('Texte « cité » : 5 % ; fin ?\n\n<TexteDeLoi reference="r" version="v" url="https://example.org">\nArticle : texte « exact » ?\n</TexteDeLoi>\n');
    expect(code).toContain('Texte «\\xA0cité\\xA0»\\xA0: 5\\xA0%; fin?');
    expect(code).toContain('Article : texte « exact » ?');
  });

  it('numérote les notes dans l’ordre et les regroupe en fin de document', async () => {
    const code = await compile('Premier<Note>une *note* avec [lien](/a/)</Note>.\n\n<Callout variant="a-retenir">\nDans un encadré<Note>deuxième : note</Note>.\n</Callout>\n');
    expect(code.match(/n: "\d"/g)).toEqual(['n: "1"', 'n: "2"', 'n: "1"', 'n: "2"']);
    expect(code).toContain('NotesList');
    expect(code.indexOf('NotesList')).toBeLessThan(code.lastIndexOf('NoteItem'));
    expect(code).toContain('deuxième\\xA0: note');
  });

  it('ne touche pas un document sans note', async () => {
    expect(await compile('Rien à signaler.')).not.toContain('NotesList');
  });
});
