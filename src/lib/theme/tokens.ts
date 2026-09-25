// Jetons de config/theme.json → variables CSS (clair et sombre), et calcul des contrastes (WCAG 2.2).
import type { Theme } from '../config/schemas.ts';

type Mode = 'light' | 'dark';
type Variant = { bg?: string; fg: string; border?: string; dot?: string };

const kebab = (key: string) => key.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase();

// « brand.600 », « neutral.slate700 », « white », « #2743D3 » → couleur hexadécimale.
export function resolveColor(theme: Theme, ref: string): string {
  if (ref.startsWith('#')) return ref.toUpperCase();
  if (ref === 'white') return '#FFFFFF';
  if (ref === 'black') return '#000000';
  const [group, key] = ref.split('.') as [keyof Theme['colors'], string];
  const palette = theme.colors[group] as Record<string, string> | undefined;
  const value = palette?.[key];
  if (!value) throw new Error(`Couleur inconnue dans config/theme.json : « ${ref} ».`);
  return value.toUpperCase();
}

// Variables brutes : une par jeton de la palette.
function rawTokens(theme: Theme): string[] {
  const lines: string[] = [];
  for (const [group, palette] of Object.entries(theme.colors)) {
    for (const [key, value] of Object.entries(palette as Record<string, string>)) {
      const name = group === 'neutral' || group === 'semantic' ? kebab(key) : `${group}-${kebab(key)}`;
      lines.push(`--${name}: ${value};`);
    }
  }
  return lines;
}

// Alias sémantiques utilisés par les composants (DA, section 3.6).
function aliases(theme: Theme, mode: Mode): Record<string, string> {
  const gold = theme.accentGold;
  if (mode === 'light') {
    return {
      'c-bg': 'var(--canvas)', 'c-surface': 'var(--surface)', 'c-surface-raised': 'var(--surface)',
      'c-section-muted': 'var(--slate-100)', 'c-card-in-muted': 'var(--surface)', 'c-section-brand': 'var(--brand-900)',
      'c-text': 'var(--ink)', 'c-text-secondary': 'var(--slate-700)', 'c-text-meta': 'var(--slate-500)',
      'c-text-inverse': '#FFFFFF', 'c-text-meta-inverse': 'var(--brand-200)',
      'c-border': 'var(--slate-300)', 'c-border-subtle': 'var(--slate-200)', 'c-border-control': 'var(--slate-400)',
      'c-primary': 'var(--brand-600)', 'c-primary-hover': 'var(--brand-500)', 'c-primary-pressed': 'var(--brand-700)',
      'c-on-primary': '#FFFFFF', 'c-link': 'var(--brand-600)', 'c-focus': 'var(--brand-600)', 'c-focus-inverse': '#FFFFFF',
      'c-heading-accent': 'var(--brand-700)', 'c-secondary-bg': 'var(--brand-100)', 'c-secondary-fg': 'var(--brand-700)', 'c-rule-law': 'var(--brand-900)',
      'c-success-text': 'var(--success-strong)', 'c-danger-text': 'var(--danger)', 'c-warning-text': 'var(--warning-strong)',
      'c-rise': 'var(--success-strong)', 'c-fall': 'var(--danger-strong)',
      'c-gold-bg': gold ? 'var(--gold-100)' : 'var(--brand-100)', 'c-gold-fg': gold ? 'var(--gold-700)' : 'var(--brand-800)',
      'c-gold-border': gold ? 'var(--gold-600)' : 'var(--brand-700)', 'c-gold-dot': gold ? 'var(--gold-500)' : 'var(--brand-600)',
      'c-shadow-hover': '0 6px 20px -8px rgb(14 18 48 / 0.18)', 'c-shadow-menu': '0 16px 48px -12px rgb(14 18 48 / 0.28)',
    };
  }
  return {
    'c-bg': 'var(--dark-bg)', 'c-surface': 'var(--dark-surface-1)', 'c-surface-raised': 'var(--dark-surface-2)',
    'c-section-muted': 'var(--dark-surface-1)', 'c-card-in-muted': 'var(--dark-surface-2)', 'c-section-brand': 'var(--brand-900)',
    'c-text': 'var(--dark-text)', 'c-text-secondary': 'var(--dark-text-secondary)', 'c-text-meta': 'var(--dark-text-secondary)',
    'c-text-inverse': '#FFFFFF', 'c-text-meta-inverse': 'var(--brand-200)',
    'c-border': 'var(--dark-border)', 'c-border-subtle': 'var(--dark-border)', 'c-border-control': 'var(--dark-border-strong)',
    'c-primary': 'var(--brand-400)', 'c-primary-hover': 'var(--brand-300)', 'c-primary-pressed': 'var(--brand-200)',
    'c-on-primary': 'var(--dark-bg)', 'c-link': 'var(--dark-link)', 'c-focus': 'var(--dark-link)', 'c-focus-inverse': '#FFFFFF',
    'c-heading-accent': 'var(--brand-200)', 'c-secondary-bg': 'var(--dark-info-bg)', 'c-secondary-fg': 'var(--brand-200)', 'c-rule-law': 'var(--brand-300)',
    'c-success-text': 'var(--dark-success)', 'c-danger-text': 'var(--dark-danger)', 'c-warning-text': 'var(--dark-warning)',
    'c-rise': 'var(--dark-success)', 'c-fall': 'var(--dark-danger)',
    'c-gold-bg': gold ? 'var(--dark-warning-bg)' : 'var(--dark-info-bg)', 'c-gold-fg': gold ? 'var(--gold-dark)' : 'var(--brand-200)',
    'c-gold-border': gold ? 'var(--gold-dark)' : 'var(--brand-400)', 'c-gold-dot': gold ? 'var(--gold-dark)' : 'var(--brand-400)',
    'c-shadow-hover': '0 0 #0000', 'c-shadow-menu': '0 16px 48px -12px rgb(0 0 0 / 0.6)',
  };
}

// Styles de puces (catégories, juridictions) et de statuts : variables par mode.
function styleVariables(theme: Theme, mode: Mode): string[] {
  const lines: string[] = [];
  const emit = (prefix: string, v: Variant) => {
    lines.push(`--${prefix}-bg: ${v.bg ? resolveColor(theme, v.bg) : 'transparent'};`);
    lines.push(`--${prefix}-fg: ${resolveColor(theme, v.fg)};`);
    lines.push(`--${prefix}-border: ${v.border ? resolveColor(theme, v.border) : v.bg ? resolveColor(theme, v.bg) : 'transparent'};`);
    if (v.dot) lines.push(`--${prefix}-dot: ${resolveColor(theme, v.dot)};`);
  };
  for (const [name, style] of Object.entries(theme.badgeStyles)) {
    emit(`badge-${name}`, style[mode]);
    if (style.rule) lines.push(`--rule-${name}: ${mode === 'light' ? resolveColor(theme, style.rule) : name === 'ardoise' ? resolveColor(theme, 'dark.textSecondary') : resolveColor(theme, 'brand.400')};`);
  }
  for (const [name, style] of Object.entries(theme.statusStyles)) emit(`status-${name}`, style[mode]);
  return lines;
}

// Encadrés (Callout et blocs apparentés) : cinq familles de couleur tirées de la palette (DA, section 9).
export const CALLOUT_FAMILIES = {
  strong: { light: { bg: 'brand.100', rule: 'brand.800', title: 'brand.800' }, dark: { bg: 'dark.infoBg', rule: 'brand.300', title: 'brand.200' } },
  info: { light: { bg: 'brand.50', rule: 'brand.500', title: 'brand.700' }, dark: { bg: 'dark.infoBg', rule: 'brand.400', title: 'dark.link' } },
  warning: {
    light: { bg: 'semantic.warning50', rule: 'semantic.warning', title: 'semantic.warningStrong' },
    dark: { bg: 'dark.warningBg', rule: 'dark.warning', title: 'dark.warning' },
  },
  success: {
    light: { bg: 'semantic.success50', rule: 'semantic.success', title: 'semantic.successStrong' },
    dark: { bg: 'dark.successBg', rule: 'dark.success', title: 'dark.success' },
  },
  neutral: {
    light: { bg: 'neutral.slate100', rule: 'neutral.slate500', title: 'neutral.slate700' },
    dark: { bg: 'dark.surface2', rule: 'dark.textSecondary', title: 'dark.text' },
  },
} as const;
export type CalloutFamily = keyof typeof CALLOUT_FAMILIES;

function calloutVariables(theme: Theme, mode: Mode): string[] {
  return Object.entries(CALLOUT_FAMILIES).flatMap(([family, modes]) =>
    Object.entries(modes[mode]).map(([part, ref]) => `--callout-${family}-${part}: ${resolveColor(theme, ref)};`),
  );
}

const FONT_VARIABLES: Record<Theme['fonts']['heading'], string> = {
  Manrope: 'var(--font-manrope)',
  Inter: 'var(--font-inter)',
  'Source Serif 4': 'var(--font-source-serif-4)',
};
const TEXT_STEPS = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];

function staticTokens(theme: Theme): string[] {
  const rem = (px: number) => `${px / 16}rem`;
  return [
    `--ff-heading: ${FONT_VARIABLES[theme.fonts.heading]};`,
    `--ff-body: ${FONT_VARIABLES[theme.fonts.body]};`,
    `--ff-legal: ${theme.fonts.legalSerif ? FONT_VARIABLES['Source Serif 4'] : FONT_VARIABLES[theme.fonts.body]};`,
    `--legal-style: ${theme.fonts.legalSerif ? 'normal' : 'italic'};`,
    ...theme.type.scale.map((px, i) => `--fs-${TEXT_STEPS[i]}: ${rem(px)};`),
    `--fs-article-mobile: ${rem(theme.type.articleBodyMobile)};`,
    `--lh-heading: ${theme.type.leading.heading};`,
    `--lh-body: ${theme.type.leading.body};`,
    `--lh-label: ${theme.type.leading.label};`,
    ...Object.entries(theme.radius).map(([k, v]) => `--r-${k}: ${v}px;`),
    `--container-w: ${theme.layout.container}px;`,
    `--sidebar-w: ${theme.layout.sidebar}px;`,
    `--reading-w: ${theme.layout.readingWidth}px;`,
    `--header-h: ${theme.layout.header}px;`,
    `--header-h-mobile: ${theme.layout.headerMobile}px;`,
  ];
}

const block = (selector: string, lines: string[]) => `${selector} {\n  ${lines.join('\n  ')}\n}`;
const aliasLines = (theme: Theme, mode: Mode) => [
  ...Object.entries(aliases(theme, mode)).map(([k, v]) => `--${k}: ${v};`),
  ...styleVariables(theme, mode),
  ...calloutVariables(theme, mode),
  `color-scheme: ${mode};`,
];

// Classes de style par puce et par statut : elles pointent vers les variables, qui changent selon le mode.
function styleClasses(theme: Theme): string[] {
  const rule = (prefix: string, name: string, extra = '') =>
    `.${prefix}--${name} { --b-bg: var(--${prefix === 'badge' ? 'badge' : 'status'}-${name}-bg); --b-fg: var(--${prefix === 'badge' ? 'badge' : 'status'}-${name}-fg); --b-border: var(--${prefix === 'badge' ? 'badge' : 'status'}-${name}-border);${extra} }`;
  return [
    ...Object.entries(theme.badgeStyles).map(([name, style]) =>
      rule('badge', name, `${style.light.dot ? ` --b-dot: var(--badge-${name}-dot);` : ''}${style.rule ? ` --b-rule: var(--rule-${name});` : ''}`),
    ),
    ...Object.keys(theme.statusStyles).map((name) => rule('status', name)),
    ...Object.keys(CALLOUT_FAMILIES).map(
      (family) => `.callout--${family} { --co-bg: var(--callout-${family}-bg); --co-rule: var(--callout-${family}-rule); --co-title: var(--callout-${family}-title); }`,
    ),
  ];
}

// Feuille de variables complète. Le sombre s'applique si l'utilisateur l'a choisi,
// ou, sans choix enregistré, si son système le demande (y compris sans JavaScript).
export function themeCss(theme: Theme): string {
  const dark = aliasLines(theme, 'dark');
  return [
    '/* Généré depuis config/theme.json : ne pas modifier à la main. */',
    block(':root', [...rawTokens(theme), ...staticTokens(theme), ...aliasLines(theme, 'light')]),
    `@media (prefers-color-scheme: dark) {\n${block(':root:not([data-theme="light"])', dark)}\n}`,
    block(':root[data-theme="dark"]', dark),
    ...styleClasses(theme),
  ].join('\n');
}

// ─── Contrastes ─────────────────────────────────────────────────────────────
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

export type ContrastCheck = { label: string; fg: string; bg: string; ratio: number; minimum: number };

// Paires texte/fond à garantir (DA, section 4) : le script check refuse toute paire sous le seuil.
export function contrastChecks(theme: Theme): ContrastCheck[] {
  const c = (ref: string) => resolveColor(theme, ref);
  const pairs: Array<[string, string, string, number]> = [
    ['Texte courant (clair)', 'neutral.ink', 'neutral.canvas', 4.5],
    ['Texte secondaire (clair)', 'neutral.slate700', 'neutral.surface', 4.5],
    ['Métadonnées sur carte (clair)', 'neutral.slate500', 'neutral.surface', 4.5],
    ['Métadonnées sur fond de section (clair)', 'neutral.slate500', 'neutral.slate100', 4.5],
    ['Liens (clair)', 'brand.600', 'neutral.surface', 4.5],
    ['Bouton primaire (clair)', 'white', 'brand.600', 4.5],
    ['Bouton primaire au survol (clair)', 'white', 'brand.500', 4.5],
    ['Bouton secondaire (clair)', 'brand.700', 'brand.100', 4.5],
    ['Bordure de champ (clair)', 'neutral.slate400', 'neutral.surface', 3],
    ['Texte sur bandeau brand-800', 'white', 'brand.800', 4.5],
    ['Métadonnées sur bandeau brand-800', 'brand.200', 'brand.800', 4.5],
    ['Texte du pied de page', 'white', 'brand.900', 4.5],
    ['Métadonnées du pied de page', 'brand.200', 'brand.900', 4.5],
    ['Texte sombre', 'dark.text', 'dark.bg', 4.5],
    ['Texte secondaire sombre', 'dark.textSecondary', 'dark.surface2', 4.5],
    ['Liens sombres', 'dark.link', 'dark.surface2', 4.5],
    ['Bouton primaire sombre', 'dark.bg', 'brand.400', 4.5],
    ['Bordure de champ sombre', 'dark.borderStrong', 'dark.surface2', 3],
    ['Hausse du ticker (clair)', 'semantic.successStrong', 'neutral.canvas', 4.5],
    ['Baisse du ticker (clair)', 'semantic.dangerStrong', 'neutral.canvas', 4.5],
  ];
  if (theme.accentGold) pairs.push(['Puce d’échéance (clair)', 'gold.700', 'gold.100', 4.5], ['Puce d’échéance (sombre)', 'gold.dark', 'dark.warningBg', 4.5]);
  const checks = pairs.map(([label, fg, bg, minimum]) => ({ label, fg: c(fg), bg: c(bg), minimum, ratio: contrastRatio(c(fg), c(bg)) }));
  // Chaque style de puce et de statut, dans les deux modes. Une puce à contour se lit sur la surface.
  const styles = [
    ...Object.entries(theme.badgeStyles).map(([n, s]) => [`Puce « ${n} »`, s] as const),
    ...Object.entries(theme.statusStyles).map(([n, s]) => [`Statut « ${n} »`, s] as const),
  ];
  // Encadrés : titre et texte courant sur le fond de chaque famille, dans les deux modes.
  for (const [family, modes] of Object.entries(CALLOUT_FAMILIES)) {
    for (const mode of ['light', 'dark'] as const) {
      const bg = c(modes[mode].bg);
      const suffix = mode === 'light' ? 'clair' : 'sombre';
      checks.push({ label: `Titre d'encadré « ${family} » (${suffix})`, fg: c(modes[mode].title), bg, minimum: 4.5, ratio: contrastRatio(c(modes[mode].title), bg) });
      const text = c(mode === 'light' ? 'neutral.ink' : 'dark.text');
      checks.push({ label: `Texte d'encadré « ${family} » (${suffix})`, fg: text, bg, minimum: 4.5, ratio: contrastRatio(text, bg) });
    }
  }
  for (const [label, style] of styles) {
    for (const mode of ['light', 'dark'] as const) {
      const v = style[mode];
      const fg = c(v.fg);
      const bg = v.bg ? c(v.bg) : mode === 'light' ? c('neutral.surface') : c('dark.surface1');
      checks.push({ label: `${label} (${mode === 'light' ? 'clair' : 'sombre'})`, fg, bg, minimum: 4.5, ratio: contrastRatio(fg, bg) });
    }
  }
  return checks;
}
