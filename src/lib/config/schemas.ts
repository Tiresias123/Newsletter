// Schémas des fichiers de config/ (un par fichier), avec des messages d'erreur en français.
import { z } from '../zod.ts';
import { icon, link, optionalDate, optionalSlug, optionalText, optionalUrl, slug, slugList } from '../content/fields.ts';
import { CATEGORY_BADGE, LEGAL_STATUS, SOCIAL_NETWORK, SOURCE_TYPE } from '../content/enums.ts';

// ─── site.json ──────────────────────────────────────────────────────────────
export const siteSchema = z
  .strictObject({
    name: z.string().min(1),
    baseline: z.string().min(1).max(160),
    description: z.string().min(1).max(300),
    url: z.url(),
    locale: z.literal('fr-CA'),
    timezone: z.string().refine((tz) => Intl.supportedValuesOf('timeZone').includes(tz), { error: 'Fuseau horaire inconnu (ex. America/Toronto).' }),
    contactEmail: optionalText(),
    logo: z.strictObject({ light: optionalText(), dark: optionalText() }),
    socials: z.array(z.strictObject({ network: z.enum(SOCIAL_NETWORK), url: optionalText(), enabled: z.boolean() })),
    announcement: z.strictObject({ enabled: z.boolean(), message: optionalText(), linkLabel: optionalText(), linkUrl: optionalText() }),
    dataHosting: optionalText(),
    copyrightHolder: optionalText(),
  })
  .superRefine((site, check) => {
    if (site.announcement.enabled && !site.announcement.message) {
      check.addIssue({ code: 'custom', path: ['announcement', 'message'], message: 'Le bandeau est activé mais son message est vide.' });
    }
    site.socials.forEach((s, i) => {
      if (s.enabled && !s.url) check.addIssue({ code: 'custom', path: ['socials', i, 'url'], message: 'Réseau activé sans adresse.' });
    });
  });

// ─── navigation.json ────────────────────────────────────────────────────────
const navLink = z.strictObject({
  label: z.string().min(1),
  url: link(),
  icon: icon(),
  description: optionalText(),
  enabled: z.boolean().default(true),
  openInNewTab: z.boolean().default(false),
  highlight: z.boolean().default(false),
  badge: optionalText(),
});

export const navigationSchema = z.strictObject({
  header: z.array(navLink.extend({ children: z.array(navLink).default([]) })),
  subscribeButton: z.strictObject({ enabled: z.boolean(), label: z.string().min(1), url: link() }),
  footer: z.array(
    z.strictObject({
      title: z.string().min(1),
      links: z.array(z.strictObject({ label: z.string().min(1), url: link(), enabled: z.boolean().default(true) })),
    }),
  ),
});

// ─── homepage.json ──────────────────────────────────────────────────────────
// Keystatic enregistre chaque section sous la forme { discriminant, value } ; on la normalise en { type, … }.
const BACKGROUNDS = ['default', 'brand', 'muted'] as const;
const LAYOUTS = ['featured', 'grid', 'list', 'compact', 'horizontal'] as const;
const count = (def: number) => z.number().int().min(1).max(40).default(def);
const cta = z.strictObject({ label: optionalText(), url: optionalText() });
const common = {
  enabled: z.boolean().default(true),
  title: optionalText(),
  subtitle: optionalText(),
  background: z.enum(BACKGROUNDS).default('default'),
};
const selection = { source: z.enum(['auto', 'manual']).default('auto'), manualSelection: slugList() };
const filters = z
  .strictObject({
    category: optionalText(),
    format: optionalText(),
    themes: slugList(),
    jurisdictions: slugList(),
    tags: z.array(z.string()).default([]),
  })
  .default({ category: '', format: '', themes: [], jurisdictions: [], tags: [] });

const section = <T extends string, S extends z.core.$ZodShape>(type: T, shape: S) =>
  z.strictObject({ discriminant: z.literal(type), value: z.strictObject({ ...common, ...shape }) }).transform((s) => ({ type: s.discriminant, ...s.value }));

export const homepageSchema = z.strictObject({
  sections: z.array(
    z.union([
      section('hero-selection', { ...selection }),
      section('content-block', { ...selection, filters, count: count(6), layout: z.enum(LAYOUTS).default('grid'), cta }),
      section('dossiers-strip', { ...selection, count: count(4), cta }),
      section('essentials', { ...selection, count: count(4), cta }),
      section('watchlist', { count: count(6), cta }),
      section('veille-latest', { count: count(8), cta }),
      section('lexique-spotlight', { ...selection, count: count(3), cta }),
      section('market-brief', {}),
      section('trending-assets', { count: count(6) }),
      section('most-read', { manualSelection: slugList(), count: count(5) }),
      section('newsletter-cta', { list: z.string().default('generale') }),
      section('partner-block', { partnerId: optionalText() }),
      section('custom-html', { content: optionalText() }),
    ]),
  ),
});

export type HomepageSection = z.output<typeof homepageSchema>['sections'][number];
export type HomepageSectionType = HomepageSection['type'];

// ─── theme.json ─────────────────────────────────────────────────────────────
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, { error: 'Couleur invalide : format #RRGGBB attendu (ex. #2743D3).' });
// Référence à une couleur : hexadécimal, « white », « black » ou jeton (« brand.600 », « dark.link »…).
export const colorRef = z
  .string()
  .regex(/^(#[0-9A-Fa-f]{6}|white|black|(brand|gold|neutral|semantic|dark)\.[A-Za-z0-9]+)$/, {
    error: 'Couleur invalide : #RRGGBB, « white », « black » ou un jeton comme « brand.600 ».',
  });
const shades = <K extends string>(keys: readonly K[]) => z.strictObject(Object.fromEntries(keys.map((k) => [k, hex])) as Record<K, typeof hex>);
const variant = z.strictObject({ bg: colorRef.optional(), fg: colorRef, border: colorRef.optional(), dot: colorRef.optional() });
const badgeStyle = z.strictObject({ light: variant, dark: variant, rule: colorRef.optional() });
const statusStyle = z.strictObject({ light: variant, dark: variant });

export const JURISDICTION_STYLES = ['plein', 'contour-point', 'contour'] as const;
export const FONT_FAMILIES = ['Manrope', 'Inter', 'Source Serif 4'] as const;

export const themeSchema = z.strictObject({
  accentGold: z.boolean(),
  colors: z.strictObject({
    brand: shades(['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']),
    gold: shades(['100', '500', '600', '700', 'dark']),
    neutral: shades(['ink', 'slate700', 'slate500', 'slate400', 'slate300', 'slate200', 'slate100', 'canvas', 'surface']),
    semantic: shades(['success', 'successStrong', 'success50', 'danger', 'dangerStrong', 'danger50', 'warning', 'warningStrong', 'warning50']),
    dark: shades(['bg', 'surface1', 'surface2', 'border', 'borderStrong', 'text', 'textSecondary', 'link', 'infoBg', 'success', 'successBg', 'warning', 'warningBg', 'danger', 'dangerBg']),
  }),
  badgeStyles: z.strictObject(Object.fromEntries([...CATEGORY_BADGE, ...JURISDICTION_STYLES].map((k) => [k, badgeStyle])) as Record<(typeof CATEGORY_BADGE)[number] | (typeof JURISDICTION_STYLES)[number], typeof badgeStyle>),
  statusStyles: z.strictObject(Object.fromEntries(LEGAL_STATUS.map((k) => [k, statusStyle])) as Record<(typeof LEGAL_STATUS)[number], typeof statusStyle>),
  fonts: z.strictObject({
    heading: z.enum(FONT_FAMILIES),
    body: z.enum(['Inter', 'Manrope']),
    legalSerif: z.boolean(),
  }),
  type: z.strictObject({
    scale: z.array(z.number().min(10).max(96)).length(9),
    articleBodyMobile: z.number().min(14).max(22),
    leading: z.strictObject({ heading: z.number().min(1).max(2), body: z.number().min(1).max(2), label: z.number().min(1).max(2) }),
  }),
  radius: z.strictObject({ card: z.number().min(0).max(32), button: z.number().min(0).max(32), badge: z.number().min(0).max(32), image: z.number().min(0).max(32) }),
  layout: z.strictObject({
    container: z.number().int().min(960).max(1600),
    sidebar: z.number().int().min(240).max(480),
    readingWidth: z.number().int().min(560).max(900),
    header: z.number().int().min(48).max(96),
    headerMobile: z.number().int().min(44).max(96),
  }),
});

export type Theme = z.output<typeof themeSchema>;

// ─── ticker.json ────────────────────────────────────────────────────────────
export const tickerSchema = z.strictObject({
  enabled: z.boolean(),
  provider: z.literal('coingecko'),
  currency: z.literal('cad'),
  assets: z.array(z.strictObject({ id: z.string().min(1), symbol: z.string().min(1).max(10), label: z.string().min(1), enabled: z.boolean().default(true) })),
});

// ─── newsletter.json ────────────────────────────────────────────────────────
export const newsletterConfigSchema = z.strictObject({
  provider: z.enum(['brevo', 'cyberimpact', 'test']),
  doubleOptIn: z.literal(true, { error: 'Le double consentement (double opt-in) est obligatoire.' }),
  lists: z.array(z.strictObject({ id: slug(), label: z.string().min(1), enabled: z.boolean() })).min(1),
  texts: z.strictObject({
    title: z.string().min(1),
    subtitle: optionalText(),
    emailLabel: z.string().min(1),
    emailPlaceholder: optionalText(),
    button: z.string().min(1),
    consent: z.string().min(1),
    privacyLinkLabel: z.string().min(1),
    privacyUrl: link(),
    success: z.string().min(1),
    error: z.string().min(1),
    frequency: optionalText(),
  }),
});

// ─── legal.json ─────────────────────────────────────────────────────────────
export const legalSchema = z.strictObject({
  privacyOfficer: z.strictObject({ name: optionalText(), title: optionalText(), email: optionalText() }),
  disclaimers: z.array(z.strictObject({ id: slug(), title: z.string().min(1), text: z.string().min(1) })).min(1),
  officialSourceTypes: z.array(z.enum(SOURCE_TYPE)).min(1),
  officialSourceTypesValidated: z.boolean().default(false),
  communiqueFromOrganismeIsOfficial: z.boolean(),
  newsletterSender: z.strictObject({ identification: optionalText(), postalAddress: optionalText() }),
});

// ─── sources-veille.json ────────────────────────────────────────────────────
export const veilleSourcesSchema = z.strictObject({
  retentionMonths: z.number().int().min(1).max(60).default(12),
  sources: z.array(
    z.strictObject({
      id: slug(),
      label: z.string().min(1),
      organisme: optionalSlug(),
      jurisdiction: slug(),
      url: optionalUrl(),
      format: z.enum(['rss', 'atom', 'json']).default('rss'),
      language: z.enum(['fr', 'en']).default('fr'),
      keywords: z.array(z.string()).default([]),
      enabled: z.boolean(),
      note: optionalText(),
    }),
  ),
});

// ─── ads.json ───────────────────────────────────────────────────────────────
export const adsSchema = z.strictObject({
  enabled: z.boolean(),
  partners: z.array(
    z.strictObject({
      id: slug(),
      name: z.string().min(1),
      logo: optionalText(),
      url: z.url(),
      campaign: optionalText(),
      startDate: optionalDate(),
      endDate: optionalDate(),
      placement: z.array(z.enum(['article', 'sidebar', 'home', 'newsletter'])).default([]),
      disclosure: z.string().min(1),
      enabled: z.boolean(),
    }),
  ),
});

// ─── redirects.json ─────────────────────────────────────────────────────────
export const redirectsSchema = z.strictObject({
  redirects: z.array(
    z.strictObject({
      from: z.string().regex(/^\/\S*$/, { error: 'Ancienne adresse invalide : elle commence par « / ».' }),
      to: link(),
      status: z.union([z.literal(301), z.literal(302)]).default(301),
    }),
  ),
});

// ─── i18n/fr.json ───────────────────────────────────────────────────────────
// Toute valeur est un texte ou un groupe de textes ; les pluriels s'écrivent { "one": …, "other": … }.
type Messages = { [key: string]: string | Messages };
export const messagesSchema: z.ZodType<Messages> = z.lazy(() => z.record(z.string(), z.union([z.string(), messagesSchema])));
