// Configuration Astro : site entièrement statique (ARCHITECTURE, sections 5 et 15).
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import tailwindcss from '@tailwindcss/vite';
import { devPages } from './src/lib/dev-pages.ts';
import { notesPlugin } from './src/lib/mdx/notes.ts';
import { typographyPlugin } from './src/lib/mdx/typography.ts';
import { themePlugin } from './src/lib/theme/vite-plugin.ts';
import site from './config/site.json' with { type: 'json' };

// Polices auto-hébergées, lues dans les paquets installés : aucun appel réseau au build.
// Liste fermée : Manrope, Inter, Source Serif 4 (le choix se fait dans config/theme.json).
const fontFile = (pkg, file) => `./node_modules/@fontsource-variable/${pkg}/files/${file}`;
const fonts = [
  {
    provider: fontProviders.local(),
    name: 'Manrope',
    cssVariable: '--font-manrope',
    fallbacks: ['sans-serif'],
    options: { variants: [{ src: [fontFile('manrope', 'manrope-latin-wght-normal.woff2')], weight: '200 800', style: 'normal' }] },
  },
  {
    provider: fontProviders.local(),
    name: 'Inter',
    cssVariable: '--font-inter',
    fallbacks: ['sans-serif'],
    options: { variants: [{ src: [fontFile('inter', 'inter-latin-wght-normal.woff2')], weight: '100 900', style: 'normal' }] },
  },
  {
    provider: fontProviders.local(),
    name: 'Source Serif 4',
    cssVariable: '--font-source-serif-4',
    fallbacks: ['serif'],
    options: {
      variants: [
        { src: [fontFile('source-serif-4', 'source-serif-4-latin-wght-normal.woff2')], weight: '200 900', style: 'normal' },
        { src: [fontFile('source-serif-4', 'source-serif-4-latin-wght-italic.woff2')], weight: '200 900', style: 'italic' },
      ],
    },
  },
];

export default defineConfig({
  site: site.url,
  trailingSlash: 'always',
  // Espaces entre éléments en ligne conservées (« Par X · le 24 septembre »).
  compressHTML: true,
  devToolbar: { enabled: false },
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    routing: { prefixDefaultLocale: false },
  },
  // Ponctuation « intelligente » désactivée : elle produirait des guillemets à l'anglaise.
  // Notes numérotées d'abord, pour que leur texte, reparsé, reçoive ensuite la typographie.
  markdown: { processor: satteri({ features: { smartPunctuation: false }, mdastPlugins: [notesPlugin, typographyPlugin] }) },
  integrations: [mdx(), devPages()],
  fonts,
  vite: {
    plugins: [tailwindcss(), themePlugin()],
    build: {
      rolldownOptions: {
        // Marqueur interne d'Astro 7 signalé à tort par Rolldown : sans effet sur le rendu.
        onLog(level, log, handler) {
          if (log.code === 'MODULE_LEVEL_DIRECTIVE' && log.message.includes('astro:head-inject')) return;
          handler(level, log);
        },
      },
    },
  },
});
