import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkBuildOutput } from '../src/lib/check/build-output.ts';

let dist: string | undefined;
afterEach(() => dist && rmSync(dist, { recursive: true, force: true }));

function site(files: Record<string, string>) {
  dist = mkdtempSync(join(tmpdir(), 'dist-'));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(dist, path, '..'), { recursive: true });
    writeFileSync(join(dist, path), content);
  }
  return dist;
}

describe('contrôles du site construit', () => {
  it('exige un index de recherche', () => {
    expect(checkBuildOutput(site({ 'index.html': '<html></html>' })).errors).toEqual([
      "Index de recherche absent (dist/pagefind/) : la commande « pagefind » n'a pas été lancée après le build.",
    ]);
  });

  it('refuse un index vide et compte les pages indexées', () => {
    const entry = (count: number) => JSON.stringify({ version: '1.5.2', languages: { 'fr-ca': { page_count: count } } });
    expect(checkBuildOutput(site({ 'index.html': '', 'pagefind/pagefind-entry.json': entry(0) })).errors).toHaveLength(1);
    rmSync(dist!, { recursive: true, force: true });
    const report = checkBuildOutput(site({ 'index.html': '', 'a/index.html': '', 'pagefind/pagefind-entry.json': entry(2) }));
    expect(report).toEqual({ errors: [], warnings: [], files: 3, indexedPages: 2 });
  });
});
