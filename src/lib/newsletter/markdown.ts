// Mot d'introduction d'un numéro (corps MDX) converti pour le courriel : paragraphes, intertitres, listes,
// gras, italique et liens. Les blocs (composants MDX) ne passent pas dans un courriel : ils sont retirés et
// signalés. Les adresses internes deviennent absolues.
import { frenchTypography } from '../typo.ts';

export type EmailStyles = { paragraph: string; heading: string; list: string; link: string };
export type ConvertedText = { html: string; text: string; warnings: string[] };

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Échappements Markdown (« \* », « \< ») rendus à leur caractère.
const unescapeMarkdown = (value: string) => value.replace(/\\([\\`*_{}[\]()#+\-.!<>|])/g, '$1');

// Chaque lien est remplacé par un caractère de la zone privée d'Unicode le temps de la mise en forme.
const TOKEN = 0xe000;
const TOKENS = /[\ue000-\uf8ff]/g;

const absoluteUrl = (href: string, siteUrl: string) => (href.startsWith('/') ? `${siteUrl.replace(/\/$/, '')}${href}` : href);

function inline(source: string, siteUrl: string, styles: EmailStyles): { html: string; text: string } {
  const links: Array<{ label: string; href: string }> = [];
  // Liens mis de côté avant l'échappement, pour ne pas toucher à leurs adresses.
  const withTokens = source.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_m, label: string, href: string) => {
    links.push({ label: frenchTypography(unescapeMarkdown(label)), href: absoluteUrl(href, siteUrl) });
    return String.fromCharCode(TOKEN + links.length - 1);
  });
  const typed = frenchTypography(unescapeMarkdown(withTokens));
  const format = (text: string) =>
    escapeHtml(text)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])[*_]([^*_]+)[*_](?=[^*\w]|$)/g, '$1<em>$2</em>');
  const html = format(typed).replace(TOKENS, (token) => {
    const link = links[token.charCodeAt(0) - TOKEN] as { label: string; href: string };
    return `<a href="${escapeHtml(link.href)}" style="${styles.link}">${escapeHtml(link.label)}</a>`;
  });
  const text = typed
    .replace(TOKENS, (token) => {
      const link = links[token.charCodeAt(0) - TOKEN] as { label: string; href: string };
      return `${link.label} (${link.href})`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|[^*\w])[*_]([^*_]+)[*_](?=[^*\w]|$)/g, '$1$2');
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
      const part = inline(heading[1] ?? '', siteUrl, styles);
      html.push(`<h2 style="${styles.heading}">${part.html}</h2>`);
      text.push(part.text.toUpperCase());
    } else if (lines.every((l) => /^[-*+]\s+/.test(l))) {
      const items = lines.map((l) => inline(l.replace(/^[-*+]\s+/, ''), siteUrl, styles));
      html.push(`<ul style="${styles.list}">${items.map((i) => `<li>${i.html}</li>`).join('')}</ul>`);
      text.push(items.map((i) => `- ${i.text}`).join('\n'));
    } else {
      const part = inline(lines.join(' '), siteUrl, styles);
      html.push(`<p style="${styles.paragraph}">${part.html}</p>`);
      text.push(part.text);
    }
  }
  return { html: html.join('\n'), text: text.join('\n\n'), warnings };
}
