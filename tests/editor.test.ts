// L'éditeur Keystatic, miroir des schémas Zod (ARCHITECTURE, section 4.3) : chaque fichier du dépôt s'ouvre
// dans l'éditeur, s'enregistre, et ressort avec les mêmes données et le même rendu ; il est déjà au format
// qu'écrit l'éditeur, pour qu'un premier enregistrement ne change rien.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COLLECTIONS, COLLECTION_NAMES } from '../src/lib/content/collections.ts';
import { entryChanges, singletonChanges } from '../src/lib/editor/compare.ts';
import editorConfig from '../src/lib/editor/index.ts';
import { entryFilesOnDisk, roundTripEntry, roundTripSingleton } from '../src/lib/editor/roundtrip.ts';
import { z } from '../src/lib/zod.ts';

const files = COLLECTION_NAMES.flatMap((name) => {
  const { directory, extension } = COLLECTIONS[name];
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((file) => file.endsWith(`.${extension}`))
    .map((file) => ({ name, extension, slug: file.slice(0, -extension.length - 1), path: `${directory}/${file}` }));
});
const singletonFiles = Object.entries(editorConfig.singletons).map(([name, s]) => ({ name, path: `${(s as { path: string }).path}.json` }));

describe("formulaires de l'éditeur", () => {
  it('couvrent chaque collection du site, au même endroit et au même format', () => {
    expect(Object.keys(editorConfig.collections).sort()).toEqual([...COLLECTION_NAMES].sort());
    for (const name of COLLECTION_NAMES) {
      const col = editorConfig.collections[name] as { path: string; format: { data?: string; contentField?: string } };
      expect(col.path).toBe(`${COLLECTIONS[name].directory}/*`);
      expect(col.format.data === 'json').toBe(COLLECTIONS[name].extension === 'json');
    }
    expect(singletonFiles.every(({ path }) => existsSync(path))).toBe(true);
  });

  it('offrent chaque champ des schémas Zod, sans champ de trop', () => {
    const ctx = { image: () => z.string() };
    for (const name of COLLECTION_NAMES) {
      const zodKeys = Object.keys((COLLECTIONS[name].schema(ctx) as unknown as { shape: object }).shape).sort();
      const formKeys = Object.keys((editorConfig.collections[name] as { schema: object }).schema).filter((key) => !key.startsWith('_') && key !== 'body');
      expect([name, formKeys.sort()]).toEqual([name, zodKeys]);
    }
  });
});

describe.each(files)('$path', ({ name, slug, path }) => {
  it("s'ouvre et s'enregistre dans l'éditeur sans perte ni changement", async () => {
    const text = readFileSync(path, 'utf8');
    const input = entryFilesOnDisk(name, slug);
    const result = await roundTripEntry(name, slug, input);
    expect(result.valid).toBe(true);
    // Mêmes données, même rendu, mêmes images : seule l'écriture du fichier pourrait changer.
    expect(entryChanges(name, path, text, input, result)).toEqual([]);
    const output = result.files.find((f) => f.path === path)?.text ?? '';
    expect(output, 'Fichier hors du format de l’éditeur : lancez « npm run content:format ».').toBe(text);
  });
});

describe.each(singletonFiles)('$path', ({ name, path }) => {
  it("s'ouvre et s'enregistre dans l'éditeur sans perte ni changement", async () => {
    const text = readFileSync(path, 'utf8');
    const result = await roundTripSingleton(name, text);
    expect(result.valid).toBe(true);
    expect(singletonChanges(name, text, result)).toEqual([]);
    expect(result.files[0]?.text, 'Fichier hors du format de l’éditeur : lancez « npm run content:format ».').toBe(text);
  });
});

describe("aller-retour qui changerait plus que l'écriture (refusé par npm run content:format)", () => {
  const path = 'content/articles/exemple-plateformes-ce-qui-change.mdx';
  const slug = 'exemple-plateformes-ce-qui-change';
  const text = readFileSync(path, 'utf8');
  const changes = async (edit: (text: string) => string, files = entryFilesOnDisk('articles', slug)) => {
    const changed = edit(text);
    files.set(path, new TextEncoder().encode(changed));
    return entryChanges('articles', path, changed, files, await roundTripEntry('articles', slug, files));
  };

  it('refuse une image renommée ou hors du dossier du contenu', async () => {
    const cover = `content/images/articles/${slug}/cover/src.webp`;
    const files = entryFilesOnDisk('articles', slug);
    const bytes = files.get(cover) as Uint8Array;
    files.delete(cover);
    files.set(`content/images/articles/${slug}/couverture.webp`, bytes);
    expect(await changes((t) => t.replace('cover/src.webp', 'couverture.webp'), files)).not.toEqual([]);
    expect(await changes((t) => t.replace(`${slug}/cover/src.webp`, 'exemple-avis-21-332-synthese/cover/src.webp'))).not.toEqual([]);
  });

  it('refuse les notes collées et les notes de bas de page Markdown', async () => {
    expect(await changes((t) => `${t}\nTexte.<Note>a</Note><Note>b</Note> suite.\n`)).not.toEqual([]);
    expect(await changes((t) => `${t}\nSelon l'ARC[^1].\n\n[^1]: https://www.canada.ca/\n`)).not.toEqual([]);
  });

  it("accepte ce qui ne change que l'écriture", async () => {
    expect(await changes((t) => `${t}\n- un point\n- un autre point\n`)).toEqual([]);
  });
});
