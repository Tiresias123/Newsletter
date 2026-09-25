import { describe, expect, it } from 'vitest';
import { getConfig } from '../src/lib/config/index.ts';
import { contrastChecks, contrastRatio, resolveColor, themeCss } from '../src/lib/theme/tokens.ts';

const theme = getConfig().theme;

describe('jetons de thème', () => {
  it('résout les références de couleur', () => {
    expect(resolveColor(theme, 'brand.600')).toBe('#2743D3');
    expect(resolveColor(theme, 'white')).toBe('#FFFFFF');
    expect(resolveColor(theme, 'neutral.slate700')).toBe('#3C4262');
  });

  it('ne référence que des variables définies', () => {
    const css = themeCss(theme);
    const defined = new Set([...css.matchAll(/--([a-z0-9-]+):/g)].map((m) => m[1]));
    // Variables fournies par l'API Fonts d'Astro.
    for (const font of ['font-manrope', 'font-inter', 'font-source-serif-4']) defined.add(font);
    const used = [...css.matchAll(/var\(--([a-z0-9-]+)\)/g)].map((m) => m[1]);
    const missing = used.filter((name) => !defined.has(name));
    expect(missing).toEqual([]);
  });

  it('calcule les ratios de contraste de la DA', () => {
    expect(contrastRatio('#FFFFFF', '#2743D3')).toBeCloseTo(7.42, 2);
    expect(contrastRatio('#62688A', '#F1F3F9')).toBeCloseTo(4.9, 2);
  });

  it('respecte tous les seuils de contraste avec le thème par défaut', () => {
    const failures = contrastChecks(theme).filter((c) => c.ratio < c.minimum);
    expect(failures).toEqual([]);
  });
});
