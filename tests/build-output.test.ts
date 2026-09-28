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
  it('exige un index de recherche, le plan du site, robots.txt, le calendrier des publications et les en-têtes', () => {
    expect(checkBuildOutput(site({ 'index.html': '<html></html>' })).errors).toEqual([
      "Index de recherche absent (dist/pagefind/) : la commande « pagefind » n'a pas été lancée après le build.",
      'sitemap-index.xml absent du site construit.',
      'robots.txt absent du site construit.',
      'schedule.json absent du site construit.',
      '_headers absent du site construit.',
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
        _headers: '',
        'pagefind/pagefind-entry.json': JSON.stringify({ languages: { 'fr-ca': { page_count: 1 } } }),
      }),
    );
    expect(report.errors).toEqual(['Images de partage annoncées mais absentes : /og/a.png']);
  });

  it('refuse un index vide et compte les pages indexées', () => {
    const entry = (count: number) => JSON.stringify({ version: '1.5.2', languages: { 'fr-ca': { page_count: count } } });
    expect(checkBuildOutput(site({ 'index.html': '', 'sitemap-index.xml': '', 'robots.txt': '', 'schedule.json': '', _headers: '', 'pagefind/pagefind-entry.json': entry(0) })).errors).toEqual([
      "Index de recherche vide : aucune page publiée n'a été indexée.",
    ]);
    rmSync(dist!, { recursive: true, force: true });
    const report = checkBuildOutput(site({ 'index.html': '', 'a/index.html': '', 'sitemap-index.xml': '', 'robots.txt': '', 'schedule.json': '', _headers: '', 'pagefind/pagefind-entry.json': entry(2) }));
    expect(report).toEqual({ errors: [], warnings: [], files: 7, indexedPages: 2 });
  });
});

describe('en-têtes des fichiers statiques', () => {
  it('autorise les scripts intégrés par leur empreinte, jamais les blocs de données', async () => {
    const { contentSecurityPolicy, headersFile, inlineScriptHashes } = await import('../src/lib/security/headers.ts');
    const html = '<script>var a=1;</script><script type="module">b()</script><script type="application/ld+json">{}</script><script type="module" src="/_astro/x.js"></script><script type="application/json">{}</script>';
    const hashes = inlineScriptHashes(html);
    expect(hashes).toHaveLength(2);
    expect(hashes[0]).toMatch(/^'sha256-[A-Za-z0-9+/]+=*'$/);
    const csp = contentSecurityPolicy({ hashes: [...hashes, ...hashes], analytics: { script: 'https://cloud.umami.is', collect: ['https://gateway.umami.is'] } });
    expect(csp).toContain("script-src 'self' 'sha256-");
    expect(csp).toContain('https://challenges.cloudflare.com https://cloud.umami.is');
    // Umami Cloud envoie ses mesures à un autre hôte que celui de son script.
    expect(csp).toContain("connect-src 'self' https://cloud.umami.is https://gateway.umami.is;");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(csp.match(/sha256-/g)).toHaveLength(2);
    expect(headersFile({ hashes: [] })).toContain("frame-ancestors 'none'");
    expect(headersFile({ hashes: [] })).not.toContain('umami');
  });

  it('respecte les limites du fichier _headers de Cloudflare', async () => {
    const { headersFile, headersFileProblems } = await import('../src/lib/security/headers.ts');
    expect(headersFileProblems(headersFile({ hashes: ["'sha256-abc='"], analytics: { script: 'https://cloud.umami.is', collect: ['https://gateway.umami.is'] } }))).toEqual([]);
    const tooMany = Array.from({ length: 101 }, (_, i) => `/page-${i}/\n  X-Robots-Tag: noindex`).join('\n');
    expect(headersFileProblems(tooMany)).toEqual(['_headers : 101 règles, au-delà des 100 que Cloudflare applique.']);
    expect(headersFileProblems(`/*/a/*\n  Content-Security-Policy: ${'x'.repeat(2000)}\n  sans deux-points`)).toHaveLength(3);
  });
});
