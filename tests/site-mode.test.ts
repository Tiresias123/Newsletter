// Mode du build (src/lib/site-mode.ts) : SITE_MODE l'emporte; sinon, la branche construite par Workers Builds.
import { describe, expect, it } from 'vitest';
import { previewBuild } from '../src/lib/site-mode.ts';

describe('mode du build', () => {
  it('construit la production par défaut, et un aperçu sur demande ou pour une autre branche que main', () => {
    expect(previewBuild({})).toBe(false);
    expect(previewBuild({ SITE_MODE: 'preview' })).toBe(true);
    expect(previewBuild({ WORKERS_CI_BRANCH: 'main' })).toBe(false);
    expect(previewBuild({ WORKERS_CI_BRANCH: 'claude/essai' })).toBe(true);
    // SITE_MODE l'emporte sur la branche.
    expect(previewBuild({ WORKERS_CI_BRANCH: 'claude/essai', SITE_MODE: 'production' })).toBe(false);
    expect(previewBuild({ WORKERS_CI_BRANCH: 'main', SITE_MODE: 'preview' })).toBe(true);
  });
});
