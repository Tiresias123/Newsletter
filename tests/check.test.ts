import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { runCheck, type CheckMode } from '../src/lib/check/index.ts';
import { renderMarkdown } from '../src/lib/check/report.ts';
import { articleData, createFixture, NOW, testConfig, type Fixture } from './helpers/fixture.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PUBLISHED = { status: 'publie', publishedAt: '2026-09-20' };

let fixture: Fixture | undefined;
afterEach(() => fixture?.cleanup());

async function check(setup: (f: Fixture) => void, mode: CheckMode = 'production') {
  fixture = createFixture();
  setup(fixture);
  const result = await runCheck({ root: fixture.root, mode, now: NOW, config: testConfig() });
  return result.problems.map((p) => ({ ...p, line: `${p.severity} ${p.rule} ${p.file} ${p.field}` }));
}

describe('check sur le dépôt', () => {
  it.each(['production', 'apercu'] as const)('ne trouve aucune erreur bloquante en mode %s', async (mode) => {
    const result = await runCheck({ root: ROOT, mode, now: NOW });
    expect(result.problems.filter((p) => p.severity === 'bloquant')).toEqual([]);
  });

  it('rappelle ce qui manque avant la mise en ligne, sans bloquer', async () => {
    const result = await runCheck({ root: ROOT, now: NOW });
    const rules = new Set(result.problems.map((p) => `${p.severity} ${p.rule}`));
    expect(rules).toContain('avertissement lancement');
    expect(rules).toContain('avertissement marqueur');
    expect(renderMarkdown(result)).toMatch(/^# À vérifier\n[\s\S]*## Erreurs bloquantes \(0\)/);
  });
});

describe('check sur des jeux d’essai', () => {
  it('s’arrête sur un fichier mal nommé ou illisible', async () => {
    const problems = await check((f) => {
      f.mdx('content/articles/Mon article.mdx', articleData());
      f.write('content/articles/sans-entete.mdx', 'Texte sans entête.');
      f.write('content/sources/casse.json', '{ "title": "x", }');
    });
    expect(problems.map((p) => p.line)).toEqual([
      'bloquant fichier content/articles/Mon article.mdx fichier entier',
      'bloquant fichier content/articles/sans-entete.mdx fichier entier',
      'bloquant fichier content/sources/casse.json fichier entier',
      'information arret — —',
    ]);
    expect(problems[2]?.message).toMatch(/^JSON invalide près de la ligne 1/);
  });

  it('bloque les marqueurs d’un contenu publié en production, pas ceux d’un brouillon', async () => {
    const setup = (f: Fixture) => {
      f.mdx('content/articles/publie.mdx', articleData({ ...PUBLISHED, title: '[EXEMPLE] Un titre de test assez long' }), 'Texte [À VÉRIFIER].');
      f.mdx('content/articles/brouillon.mdx', articleData(), 'Texte [À VÉRIFIER].');
    };
    const production = (await check(setup)).filter((p) => p.rule === 'marqueur' && p.file.startsWith('content/'));
    expect(production.map((p) => p.line)).toEqual(['bloquant marqueur content/articles/publie.mdx Titre, Corps du texte']);
    const preview = (await check(setup, 'apercu')).filter((p) => p.rule === 'marqueur' && p.file.startsWith('content/'));
    expect(preview.map((p) => p.severity)).toEqual(['avertissement', 'avertissement']);
  });

  it('tolère les marqueurs de la configuration tant que le site n’a pas son adresse', async () => {
    const problems = await check(() => {});
    const config = problems.filter((p) => p.rule === 'marqueur');
    expect(config.length).toBeGreaterThan(0);
    expect(config.every((p) => p.severity === 'avertissement')).toBe(true);
  });

  it('situe les blocs mal formés à leur ligne dans le fichier', async () => {
    const problems = await check((f) => f.mdx('content/articles/essai.mdx', articleData(PUBLISHED), 'Intro.\n\n<Encadre>x</Encadre>\n'));
    const lines = readFileSync(join(fixture?.root ?? '', 'content/articles/essai.mdx'), 'utf8').split('\n');
    const expected = lines.findIndex((line) => line.startsWith('<Encadre>')) + 1;
    expect(problems.find((p) => p.rule === 'bloc')).toMatchObject({ severity: 'bloquant', field: `ligne ${expected}` });
  });

  it('signale liens cassés et images sans texte alternatif', async () => {
    const problems = await check((f) =>
      f.mdx('content/articles/essai.mdx', articleData(PUBLISHED), 'Voir [ici](/dossiers/absent/), [là](../relatif/) et ![](absente.webp).'),
    );
    const lines = problems.filter((p) => p.file === 'content/articles/essai.mdx').map((p) => `${p.severity} ${p.rule} ${p.message}`);
    expect(lines).toEqual([
      expect.stringMatching(/^avertissement lien-interne Lien « \/dossiers\/absent\/ » : « absent » n'existe pas/),
      expect.stringMatching(/^avertissement lien-interne Adresse relative/),
      expect.stringMatching(/^bloquant image Image introuvable/),
      expect.stringMatching(/^bloquant image Image sans texte alternatif/),
    ]);
  });

  it('signale révisions échues, dates futures et publications programmées', async () => {
    const problems = await check((f) => {
      f.mdx('content/articles/ancien.mdx', articleData({ ...PUBLISHED, asOf: '2025-01-15', reviewEvery: '3' }));
      f.mdx('content/articles/futur.mdx', articleData({ status: 'publie', publishedAt: '2026-12-01' }));
      f.mdx('content/articles/programme.mdx', articleData({ status: 'programme', publishedAt: '2026-10-01', publishedTime: '09:30' }));
    });
    const find = (rule: string) => problems.find((p) => p.rule === rule);
    expect(find('revision')?.message).toContain('Révision échue depuis le 15\u00a0avril 2025');
    expect(find('date')?.message).toContain('choisissez le statut « Programmé »');
    expect(find('programme')?.message).toBe('Publication programmée le 1er\u00a0octobre 2026 à 9\u00a0h\u00a030.');
  });
});

describe('check des redirections', () => {
  it('signale une redirection qui masquerait une page ou qui boucle, sans doubler les règles des contenus', async () => {
    fixture = createFixture();
    fixture.mdx('content/articles/nouveau.mdx', articleData({ ...PUBLISHED, previousSlugs: ['ancien'] }));
    fixture.mdx('content/articles/autre.mdx', articleData({ ...PUBLISHED, previousSlugs: ['nouveau'] }));
    const base = testConfig();
    const redirects = [
      { from: '/articles/nouveau/', to: '/', status: 301 as const },
      { from: '/x/', to: '/y/', status: 301 as const },
      { from: '/y/', to: '/x/', status: 301 as const },
    ];
    const result = await runCheck({ root: fixture.root, now: NOW, config: { ...base, redirects: { redirects } } });
    const lines = result.problems.filter((p) => p.rule === 'redirection' || p.rule === 'adresse').map((p) => `${p.severity} ${p.rule} ${p.file} ${p.message}`);
    expect(lines).toEqual([
      'bloquant adresse content/articles/autre.mdx « nouveau » est l\'adresse actuelle d\'un autre contenu.',
      'bloquant redirection config/redirects.json L\'ancienne adresse /articles/nouveau/ est déjà redirigée (content/articles/autre.mdx).',
      'bloquant redirection config/redirects.json /articles/nouveau/ est l\'adresse d\'une page du site : la redirection la masquerait.',
      'bloquant redirection config/redirects.json Boucle de redirections à partir de /x/.',
      'bloquant redirection config/redirects.json Boucle de redirections à partir de /y/.',
    ]);
  });
});
