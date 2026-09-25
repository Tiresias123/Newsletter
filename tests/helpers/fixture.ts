// Jeux d'essai : un dossier temporaire qui reproduit content/, avec des taxonomies et un auteur minimaux.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { dump } from 'js-yaml';
import { getConfig, type SiteConfig } from '../../src/lib/config/index.ts';

export type Fixture = {
  root: string;
  write(path: string, content: string): void;
  json(path: string, data: object): void;
  mdx(path: string, data: object, body?: string): void;
  cleanup(): void;
};

export function createFixture(): Fixture {
  const root = mkdtempSync(join(tmpdir(), 'check-'));
  const write = (path: string, content: string) => {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  };
  const fixture: Fixture = {
    root,
    write,
    json: (path, data) => write(path, JSON.stringify(data, null, 2)),
    mdx: (path, data, body = '') => write(path, `---\n${dump(data)}---\n${body}`),
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
  fixture.json('content/taxonomies/categories/actualites.json', { label: 'Actualités', description: 'Actualités.', badgeStyle: 'plein-500' });
  fixture.json('content/taxonomies/categories/reglementation.json', {
    label: 'Réglementation',
    description: 'Réglementation.',
    badgeStyle: 'plein-700',
    requireVerification: true,
  });
  fixture.json('content/taxonomies/themes/stablecoins.json', { label: 'Stablecoins', group: 'reglementation' });
  fixture.json('content/taxonomies/formats/analyse.json', { label: 'Analyse' });
  fixture.json('content/auteurs/redaction.json', { name: 'Rédaction' });
  return fixture;
}

export const DEK =
  'Chapô de démonstration pour les tests : il doit compter au moins cent soixante caractères, ce qui oblige à écrire une phrase assez longue, sans rien affirmer de précis sur le fond.';

export function articleData(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    title: 'Un titre d’article de test assez long',
    dek: DEK,
    category: 'actualites',
    format: 'analyse',
    themes: ['stablecoins'],
    author: 'redaction',
    status: 'brouillon',
    ...overrides,
  };
}

// Configuration du dépôt sans les références au contenu d'amorçage (sections d'accueil, sources de veille).
export function testConfig(overrides: Partial<SiteConfig> = {}): SiteConfig {
  const base = getConfig();
  return {
    ...base,
    homepage: { ...base.homepage, sections: [] },
    veilleSources: { ...base.veilleSources, sources: [] },
    navigation: { ...base.navigation, header: [], footer: [] },
    ...overrides,
  };
}

// Instant fixe des tests : 25 septembre 2026, 12 h à Toronto.
export const NOW = new Date('2026-09-25T16:00:00Z');
