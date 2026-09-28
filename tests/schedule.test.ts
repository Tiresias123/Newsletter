import { afterEach, describe, expect, it } from 'vitest';
import { loadContent } from '../src/lib/check/load.ts';
import { buildGraph } from '../src/lib/content/graph.ts';
import { buildSchedule, isRebuildDue, parseSchedule, RETRY_WINDOW_MS } from '../src/lib/schedule.ts';
import { articleData, createFixture, NOW, testConfig, type Fixture } from './helpers/fixture.ts';

let fixture: Fixture;
afterEach(() => fixture?.cleanup());

function graphOf(setup: (f: Fixture) => void) {
  fixture = createFixture();
  setup(fixture);
  const content = loadContent(fixture.root);
  expect(content.problems).toEqual([]);
  return buildGraph(content.raw, testConfig(), { now: NOW, includeDrafts: false, timezone: 'America/Toronto' });
}

describe('publication programmée', () => {
  it('liste les seuls instants à venir, en heure de Toronto convertie en UTC, sans titre ni adresse', () => {
    const graph = graphOf((f) => {
      f.mdx('content/articles/demain.mdx', articleData({ status: 'programme', publishedAt: '2026-09-26', publishedTime: '08:30' }));
      f.mdx('content/articles/meme-heure.mdx', articleData({ status: 'programme', publishedAt: '2026-09-26', publishedTime: '08:30' }));
      // Après le passage à l'heure normale (1er novembre) : UTC−5 au lieu de UTC−4.
      f.mdx('content/articles/hiver.mdx', articleData({ status: 'programme', publishedAt: '2026-11-02', publishedTime: '08:30' }));
      f.mdx('content/articles/echu.mdx', articleData({ status: 'programme', publishedAt: '2026-09-25', publishedTime: '08:00' }));
      f.mdx('content/articles/publie.mdx', articleData({ status: 'publie', publishedAt: '2026-09-20' }));
      f.mdx('content/articles/brouillon.mdx', articleData({ publishedAt: '2026-10-01' }));
    });
    const schedule = buildSchedule(graph);
    expect(schedule).toEqual({ version: 1, builtAt: '2026-09-25T16:00:00.000Z', publications: ['2026-09-26T12:30:00.000Z', '2026-11-02T13:30:00.000Z'] });
    expect(JSON.stringify(schedule)).not.toContain('demain');
    expect(graph.get('articles', 'echu')?.visibility.visible).toBe(true);
  });

  it('relance le build une fois l’échéance passée, pendant deux heures au plus', () => {
    const schedule = { version: 1 as const, builtAt: '2026-09-25T16:00:00.000Z', publications: ['2026-09-26T12:30:00.000Z'] };
    const at = (iso: string) => isRebuildDue(schedule, new Date(iso));
    expect(at('2026-09-26T12:29:59.000Z')).toBe(false);
    expect(at('2026-09-26T12:37:00.000Z')).toBe(true);
    expect(isRebuildDue(schedule, new Date(Date.parse('2026-09-26T12:30:00.000Z') + RETRY_WINDOW_MS + 1))).toBe(false);
    // Un build postérieur à l'échéance l'a déjà rendue visible.
    expect(isRebuildDue({ ...schedule, builtAt: '2026-09-26T12:31:00.000Z' }, new Date('2026-09-26T12:37:00.000Z'))).toBe(false);
  });

  it('ignore un fichier absent ou mal formé', () => {
    expect(parseSchedule(undefined)).toBeUndefined();
    expect(parseSchedule({ version: 2, builtAt: '2026-09-25T16:00:00.000Z', publications: [] })).toBeUndefined();
    expect(parseSchedule({ version: 1, builtAt: 'hier', publications: [] })).toBeUndefined();
    expect(parseSchedule({ version: 1, builtAt: '2026-09-25T16:00:00.000Z', publications: ['demain'] })).toBeUndefined();
    expect(parseSchedule({ version: 1, builtAt: '2026-09-25T16:00:00.000Z', publications: [] })).toEqual({ version: 1, builtAt: '2026-09-25T16:00:00.000Z', publications: [] });
    // Commit construit : gardé s'il est bien formé, ignoré sinon.
    const sha = 'a'.repeat(40);
    expect(parseSchedule({ version: 1, builtAt: '2026-09-25T16:00:00.000Z', publications: [], commit: sha })?.commit).toBe(sha);
    expect(parseSchedule({ version: 1, builtAt: '2026-09-25T16:00:00.000Z', publications: [], commit: 'main' })).not.toHaveProperty('commit');
  });

  it('nomme le commit construit quand le build le connaît (Workers Builds)', () => {
    const graph = graphOf(() => undefined);
    expect(buildSchedule(graph, 'ABCDEF0123456789ABCDEF0123456789ABCDEF01').commit).toBe('abcdef0123456789abcdef0123456789abcdef01');
    expect(buildSchedule(graph, '')).not.toHaveProperty('commit');
    expect(buildSchedule(graph, 'pas-un-commit')).not.toHaveProperty('commit');
  });
});

describe('surveillance du site en ligne', () => {
  it('signale un site injoignable, une reconstruction nocturne manquée et un envoi resté hors ligne', async () => {
    const { deploymentStatus } = await import('../src/lib/check/deployment.ts');
    const now = new Date('2026-09-28T16:00:00Z');
    const schedule = (builtAt: string) => ({ version: 1 as const, builtAt, publications: [] });
    const at = (iso: string, online?: boolean) => ({ date: new Date(iso), online });
    expect(deploymentStatus(undefined, undefined, now)).toMatchObject({ ok: false });
    expect(deploymentStatus(schedule('2026-09-28T05:10:00Z'), at('2026-09-27T20:00:00Z'), now)).toMatchObject({ ok: true });
    expect(deploymentStatus(schedule('2026-09-27T05:10:00Z'), undefined, now)).toMatchObject({ ok: false, problem: expect.stringContaining('34 heures') });
    // Sans commit connu du build en ligne, comparaison des dates. Envoi de 14 h, toujours pas en ligne à 16 h :
    // build en échec.
    expect(deploymentStatus(schedule('2026-09-28T05:10:00Z'), at('2026-09-28T14:00:00Z'), now)).toMatchObject({ ok: false, problem: expect.stringContaining('pas en ligne') });
    // Envoi de 15 h 30 : le build a encore le temps de finir.
    expect(deploymentStatus(schedule('2026-09-28T05:10:00Z'), at('2026-09-28T15:30:00Z'), now)).toMatchObject({ ok: true });
    // Commit fait avant la reconstruction nocturne, poussé après, et dont le build a échoué : absent du build en
    // ligne, malgré sa date antérieure.
    expect(deploymentStatus(schedule('2026-09-28T05:10:00Z'), at('2026-09-28T04:00:00Z', false), now)).toMatchObject({ ok: false });
    // Présent dans le build en ligne : à jour, quelle que soit sa date.
    expect(deploymentStatus(schedule('2026-09-28T05:10:00Z'), at('2026-09-28T14:00:00Z', true), now)).toMatchObject({ ok: true });
  });

  it('date le dernier envoi de main par sa fusion, pas par les commits de la branche fusionnée', async () => {
    const { execFileSync } = await import('node:child_process');
    const { mkdtempSync, rmSync, writeFileSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const dir = mkdtempSync(join(tmpdir(), 'surveillance-'));
    const git = (args: string[], date?: string) =>
      execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...args], {
        cwd: dir,
        encoding: 'utf8',
        env: { ...process.env, ...(date ? { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } : {}) },
      }).trim();
    try {
      git(['init', '-q', '-b', 'main']);
      writeFileSync(join(dir, 'a.txt'), '1');
      git(['add', '.']);
      git(['commit', '-q', '-m', 'un'], '2026-09-20T10:00:00Z');
      git(['checkout', '-q', '-b', 'branche']);
      writeFileSync(join(dir, 'b.txt'), '2');
      git(['add', '.']);
      git(['commit', '-q', '-m', 'deux'], '2026-09-25T22:00:00Z');
      git(['checkout', '-q', 'main']);
      git(['merge', '-q', '--no-ff', '-m', 'fusion', 'branche'], '2026-09-28T10:00:00Z');
      const log = (...extra: string[]) => git(['log', '-1', ...extra, '--format=%cI', '--', '.', ':(exclude)docs', ':(exclude).github']);
      // Sans --first-parent, la fusion disparaît derrière le commit de la branche. Instants comparés : selon sa
      // version, git écrit « Z » ou « +00:00 ».
      expect(new Date(log()).toISOString()).toBe('2026-09-25T22:00:00.000Z');
      expect(new Date(log('--first-parent')).toISOString()).toBe('2026-09-28T10:00:00.000Z');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
