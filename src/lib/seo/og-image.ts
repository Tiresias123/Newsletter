// Images Open Graph 1200 × 630 générées au build (DA, section 7 ; ARCHITECTURE, section 13) : dégradé bleu roi
// et grille, puce en style inversé, sigle en grand pour une fiche d'organisme, titre en Manrope 800 statique
// (satori ne lit pas le woff2), nom du site en bas. Couleurs tirées de config/theme.json.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { getConfig } from '../config/index.ts';
import { frenchTypography } from '../typo.ts';

export type OgCard = { title: string; badge?: string; mark?: string };

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

type Style = Record<string, string | number>;
type Node = { type: string; props: { style: Style; children?: Array<Node | string> | Node | string } };
const el = (style: Style, children?: Node['props']['children']): Node => ({ type: 'div', props: { style, children } });

// Polices lues dans le paquet installé, depuis la racine du projet (le module est regroupé au build).
const resolve = createRequire(join(process.cwd(), 'package.json')).resolve;
let fonts: Array<{ name: string; data: Buffer; weight: 600 | 800; style: 'normal' }> | undefined;
const loadFonts = () =>
  (fonts ??= ([600, 800] as const).map((weight) => ({
    name: 'Manrope',
    data: readFileSync(resolve(`@fontsource/manrope/files/manrope-latin-${weight}-normal.woff`)),
    weight,
    style: 'normal' as const,
  })));

function rgba(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// Taille du titre selon sa longueur, pour tenir en quatre lignes au plus ; titre très long abrégé.
function titleStyle(title: string): { text: string; size: number } {
  const text = title.length > 150 ? `${title.slice(0, 147).trimEnd()}…` : title;
  return { text, size: text.length > 110 ? 46 : text.length > 70 ? 54 : 64 };
}

export function ogTree(card: OgCard): Node {
  const { theme, site } = getConfig();
  const brand = theme.colors.brand;
  const white = theme.colors.neutral.surface;
  const line = rgba(brand['600'], 0.4);
  const { text, size } = titleStyle(frenchTypography(card.title));
  const layer = (backgroundImage: string): Node => el({ position: 'absolute', top: 0, left: 0, width: OG_WIDTH, height: OG_HEIGHT, backgroundImage });
  return el(
    { position: 'relative', width: OG_WIDTH, height: OG_HEIGHT, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', backgroundColor: brand['800'], color: white, fontFamily: 'Manrope' },
    [
      layer(`linear-gradient(135deg, ${brand['700']}, ${brand['900']})`),
      layer(`repeating-linear-gradient(90deg, ${line} 0px, ${line} 1px, transparent 1px, transparent 40px)`),
      layer(`repeating-linear-gradient(180deg, ${line} 0px, ${line} 1px, transparent 1px, transparent 40px)`),
      el({ display: 'flex', minHeight: 44 }, card.badge ? [el({ backgroundColor: white, color: brand['900'], fontSize: 24, fontWeight: 600, padding: '6px 16px', borderRadius: 8 }, frenchTypography(card.badge))] : []),
      el({ display: 'flex', flexDirection: 'column', gap: 16 }, [
        ...(card.mark ? [el({ fontSize: 112, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }, card.mark)] : []),
        el({ fontSize: size, fontWeight: 800, lineHeight: 1.12, letterSpacing: -1 }, text),
      ]),
      el({ display: 'flex', fontSize: 28, fontWeight: 800, color: brand['200'], letterSpacing: -0.5 }, site.name),
    ],
  );
}

// Version du gabarit : à changer quand le dessin change, pour régénérer les images en cache.
const TEMPLATE_VERSION = 1;
const CACHE_DIR = join(process.cwd(), 'node_modules', '.cache', 'og-images');

// PNG en palette de 256 couleurs (deux fois plus léger, sans différence visible sur ce dessin), mis en cache
// entre deux builds : une image n'est recalculée que si sa carte, le nom du site ou les couleurs changent.
export async function renderOgImage(card: OgCard): Promise<Buffer> {
  const tree = ogTree(card);
  const key = createHash('sha256').update(JSON.stringify([TEMPLATE_VERSION, tree])).digest('hex').slice(0, 32);
  const cached = join(CACHE_DIR, `${key}.png`);
  if (existsSync(cached)) return readFileSync(cached);
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], { width: OG_WIDTH, height: OG_HEIGHT, fonts: loadFonts() });
  const png = await sharp(Buffer.from(svg)).png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 }).toBuffer();
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cached, png);
  return png;
}
