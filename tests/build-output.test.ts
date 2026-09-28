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
  it('exige un index de recherche, le plan du site, robots.txt et le calendrier des publications', () => {
    expect(checkBuildOutput(site({ 'index.html': '<html></html>' })).errors).toEqual([
      "Index de recherche absent (dist/pagefind/) : la commande « pagefind » n'a pas été lancée après le build.",
      'sitemap-index.xml absent du site construit.',
      'robots.txt absent du site construit.',
      'schedule.json absent du site construit.',
    ]);
  });

  it('signale une image de partage annoncée mais absente', () => {
    const page = (image: string) => `<html><head><meta property="og:image" content="https://example.com${image}" /></head></html>`;
    const report = checkBuildOutput(
      site({
        'index.html': page('/og/accueil.png'),
        'a/index.html': page('/og/a.png'),
        'og/accueil.png': '',
        'sitemap-index.xml': '',
        'robots.txt': '',
        'schedule.json': '',
        'pagefind/pagefind-entry.json': JSON.stringify({ languages: { 'fr-ca': { page_count: 1 } } }),
      }),
    );
    expect(report.errors).toEqual(['Images de partage annoncées mais absentes : /og/a.png']);
  });

  it('refuse un index vide et compte les pages indexées', () => {
    const entry = (count: number) => JSON.stringify({ version: '1.5.2', languages: { 'fr-ca': { page_count: count } } });
    expect(checkBuildOutput(site({ 'index.html': '', 'sitemap-index.xml': '', 'robots.txt': '', 'schedule.json': '', 'pagefind/pagefind-entry.json': entry(0) })).errors).toEqual([
      "Index de recherche vide : aucune page publiée n'a été indexée.",
    ]);
    rmSync(dist!, { recursive: true, force: true });
    const report = checkBuildOutput(site({ 'index.html': '', 'a/index.html': '', 'sitemap-index.xml': '', 'robots.txt': '', 'schedule.json': '', 'pagefind/pagefind-entry.json': entry(2) }));
    expect(report).toEqual({ errors: [], warnings: [], files: 6, indexedPages: 2 });
  });
});
