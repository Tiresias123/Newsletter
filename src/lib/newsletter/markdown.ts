// Mot d'introduction d'un numéro (corps MDX) converti pour le courriel : paragraphes, intertitres, listes à
// puces et numérotées, gras, italique et liens (une citation devient un paragraphe). Les blocs (composants MDX) ne passent pas dans un courriel : ils sont retirés et
// signalés. Les adresses internes deviennent absolues.
import { frenchTypography } from '../typo.ts';

export type EmailStyles = { paragraph: string; heading: string; list: string; link: string };
export type ConvertedText = { html: string; text: string; warnings: string[] };

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Pendant la mise en forme, chaque lien, caractère échappé (« \\* », « \\& ») ou saut de ligne forcé (« \\ » en fin
// de ligne) est remplacé par un caractère de la zone privée d'Unicode, que ni la typographie ni l'emphase ne touchent.
const LINK = 0xe000;
const ESCAPED = 0xe800;
const BREAK = String.fromCharCode(0xf000);
const TOKENS = /[\ue000-\uf000]/g;
const ESCAPABLE = /\\([!-/:-@[-`{-~])/g;

// Échappements Markdown rendus à leur caractère (adresses et textes des liens).
const unescapeMarkdown = (value: string) => value.replace(ESCAPABLE, '$1');

const absoluteUrl = (href: string, siteUrl: string) => (href.startsWith('/') ? `${siteUrl.replace(/\/$/, '')}${href}` : href);
const emphasis = (text: string, open: [string, string], close: [string, string]) =>
  text.replace(/\*\*([^*]+)\*\*/g, `${open[0]}$1${close[0]}`).replace(/(^|[^*\w])[*_]([^*_]+)[*_](?=[^*\w]|$)/g, `$1${open[1]}$2${close[1]}`);

// upper : intertitre de la version texte, en capitales (sauf les adresses).
function inline(source: string, siteUrl: string, styles: EmailStyles, upper = false): { html: string; text: string } {
  const links: Array<{ label: string; href: string }> = [];
  const escaped: string[] = [];
  const withTokens = source
    .replace(/\[((?:\\.|[^\]\\])+)\]\(((?:\\.|[^)\s\\])+)(?:\s+"[^"]*")?\)/g, (_m, label: string, href: string) => {
      links.push({ label: frenchTypography(unescapeMarkdown(label)), href: absoluteUrl(unescapeMarkdown(href), siteUrl) });
      return String.fromCharCode(LINK + links.length - 1);
    })
    .replace(ESCAPABLE, (_m, char: string) => {
      escaped.push(char);
      return String.fromCharCode(ESCAPED + escaped.length - 1);
    });
  const typed = frenchTypography(withTokens);
  const restore = (text: string, link: (l: { label: string; href: string }) => string, char: (c: string) => string, br: string) =>
    text.replace(TOKENS, (token) => {
      const code = token.charCodeAt(0);
      if (token === BREAK) return br;
      if (code >= ESCAPED) return char(escaped[code - ESCAPED] ?? '');
      return link(links[code - LINK] as { label: string; href: string });
    });
  const html = restore(
    emphasis(escapeHtml(typed), ['<strong>', '<em>'], ['</strong>', '</em>']),
    (l) => `<a href="${escapeHtml(l.href)}" style="${styles.link}">${escapeHtml(l.label)}</a>`,
    escapeHtml,
    '<br>',
  );
  const plain = emphasis(upper ? typed.toUpperCase() : typed, ['', ''], ['', '']);
  const text = restore(plain, (l) => `${upper ? l.label.toUpperCase() : l.label} (${l.href})`, (c) => c, '\n');
  return { html, text };
}

export function markdownToEmail(body: string, siteUrl: string, styles: EmailStyles): ConvertedText {
  const warnings: string[] = [];
  const cleaned = body
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/<([A-Z][A-Za-z0-9]*)\b[^>]*\/>/g, (_m, name: string) => {
      warnings.push(`bloc ${name} retiré : les blocs ne passent pas dans un courriel.`);
      return '';
    })
    .replace(/<([A-Z][A-Za-z0-9]*)\b[^>]*>[\s\S]*?<\/\1>/g, (_m, name: string) => {
      warnings.push(`bloc ${name} retiré : les blocs ne passent pas dans un courriel.`);
      return '';
    });
  const html: string[] = [];
  const text: string[] = [];
  for (const block of cleaned.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)) {
    const lines = block.split('\n').map((l) => l.trim());
    const heading = /^#{1,6}\s+(.*)$/.exec(block);
    if (heading && lines.length === 1) {
      const part = inline(heading[1] ?? '', siteUrl, styles, true);
      html.push(`<h2 style="${styles.heading}">${part.html}</h2>`);
      text.push(part.text);
    } else if (lines.every((l) => /^[-*+]\s+/.test(l))) {
      const items = lines.map((l) => inline(l.replace(/^[-*+]\s+/, ''), siteUrl, styles));
      html.push(`<ul style="${styles.list}">${items.map((i) => `<li>${i.html}</li>`).join('')}</ul>`);
      text.push(items.map((i) => `- ${i.text}`).join('\n'));
    } else if (lines.every((l) => /^\d+[.)]\s+/.test(l))) {
      const items = lines.map((l) => ({ n: parseInt(l, 10), ...inline(l.replace(/^\d+[.)]\s+/, ''), siteUrl, styles) }));
      html.push(`<ol start="${items[0]?.n ?? 1}" style="${styles.list}">${items.map((i) => `<li>${i.html}</li>`).join('')}</ol>`);
      text.push(items.map((i) => `${i.n}. ${i.text}`).join('\n'));
    } else {
      // Citation : un paragraphe ordinaire. Ligne finie par « \ » : saut de ligne forcé.
      const joined = lines.map((l) => l.replace(/^>\s?/, '')).map((l, i, all) => (i < all.length - 1 && /(?<!\\)\\$/.test(l) ? `${l.slice(0, -1)}${BREAK}` : `${l} `)).join('').trim();
      const part = inline(joined, siteUrl, styles);
      html.push(`<p style="${styles.paragraph}">${part.html}</p>`);
      text.push(part.text);
    }
  }
  return { html: html.join('\n'), text: text.join('\n\n'), warnings };
}
