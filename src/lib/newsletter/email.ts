// Courriel d'un numéro de l'infolettre (ARCHITECTURE, section 11.4) : HTML en tableaux et styles en ligne, seuls
// compris par tous les logiciels de courriel, aux couleurs de config/theme.json ; version texte brut à côté.
// Chaque envoi porte l'identification de l'expéditeur et un lien de désabonnement (Loi canadienne anti-pourriel).
import type { Theme } from '../config/schemas.ts';
import { t } from '../i18n.ts';
import { frenchTypography } from '../typo.ts';
import { escapeHtml, type ConvertedText, type EmailStyles } from './markdown.ts';

export type EmailArticle = { category?: string; title: string; dek: string; url: string };

export type EmailData = {
  subject: string;
  preheader: string;
  siteName: string;
  siteUrl: string;
  issueLabel: string;
  archiveUrl: string;
  intro: ConvertedText;
  articles: EmailArticle[];
  sponsor?: { name: string; url: string; campaign: string; disclosure: string };
  sender: { identification: string; postalAddress: string };
  unsubscribeUrl: string;
  privacy: { label: string; url: string };
};

const FONT = 'font-family:Helvetica,Arial,sans-serif;';

export function emailStyles(theme: Theme): EmailStyles {
  const c = theme.colors;
  return {
    paragraph: `${FONT}margin:0 0 16px;font-size:16px;line-height:1.6;color:${c.neutral.ink};`,
    heading: `${FONT}margin:24px 0 12px;font-size:20px;line-height:1.3;color:${c.brand['950']};`,
    list: `${FONT}margin:0 0 16px;padding-left:24px;font-size:16px;line-height:1.6;color:${c.neutral.ink};`,
    link: `color:${c.brand['700']};text-decoration:underline;`,
  };
}

const a = (href: string, label: string, style: string) => `<a href="${escapeHtml(href)}" style="${style}">${escapeHtml(label)}</a>`;

export function renderEmail(data: EmailData, theme: Theme): { html: string; text: string } {
  const c = theme.colors;
  const s = emailStyles(theme);
  const small = `${FONT}margin:0 0 8px;font-size:13px;line-height:1.5;color:${c.neutral.slate500};`;
  const muted = `color:${c.neutral.slate500};text-decoration:underline;`;
  const typo = (value: string) => escapeHtml(frenchTypography(value));
  const r = `${theme.radius.card}px`;

  const articles = data.articles
    .map(
      (item) => `<tr><td style="padding:0 0 24px;">
${item.category ? `<p style="${FONT}margin:0 0 4px;font-size:12px;font-weight:bold;letter-spacing:0.04em;text-transform:uppercase;color:${c.brand['600']};">${typo(item.category)}</p>` : ''}
<p style="${FONT}margin:0 0 6px;font-size:18px;line-height:1.35;font-weight:bold;">${a(item.url, frenchTypography(item.title), `color:${c.neutral.ink};text-decoration:none;`)}</p>
<p style="${FONT}margin:0 0 6px;font-size:15px;line-height:1.55;color:${c.neutral.slate700};">${typo(item.dek)}</p>
<p style="${FONT}margin:0;font-size:14px;">${a(item.url, t('newsletterEmail.readMore'), s.link)}</p>
</td></tr>`,
    )
    .join('\n');

  const sponsor = data.sponsor
    ? `<tr><td style="padding:16px;border:1px solid ${c.neutral.slate200};border-radius:${r};">
<p style="${small}font-weight:bold;text-transform:uppercase;">${typo(data.sponsor.disclosure)}</p>
<p style="${FONT}margin:0;font-size:15px;line-height:1.5;color:${c.neutral.ink};">${a(data.sponsor.url, data.sponsor.name, s.link)}${data.sponsor.campaign ? ` : ${typo(data.sponsor.campaign)}` : ''}</p>
</td></tr>`
    : '';

  const html = `<!doctype html>
<html lang="fr-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${typo(data.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${c.neutral.canvas};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${typo(data.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.neutral.canvas};">
<tr><td align="center" style="padding:16px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
<tr><td style="padding:0 0 12px;text-align:right;"><p style="${small}margin:0;">${a(data.archiveUrl, t('newsletterEmail.viewOnline'), muted)}</p></td></tr>
<tr><td style="background:${c.brand['600']};padding:28px 32px;border-radius:${r} ${r} 0 0;">
<p style="${FONT}margin:0;font-size:24px;font-weight:bold;color:${c.neutral.surface};">${typo(data.siteName)}</p>
<p style="${FONT}margin:6px 0 0;font-size:14px;color:${c.brand['100']};">${typo(data.issueLabel)}</p>
</td></tr>
<tr><td style="background:${c.neutral.surface};padding:32px;border-radius:0 0 ${r} ${r};">
${data.intro.html}
${data.articles.length > 0 ? `<h2 style="${s.heading}">${typo(t('newsletterEmail.inThisIssue'))}</h2>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${articles}
${sponsor}
</table>
</td></tr>
<tr><td style="padding:24px 32px;">
<p style="${small}">${typo(t('newsletterEmail.reason', { site: data.siteName }))}</p>
<p style="${small}">${typo(t('newsletterEmail.sender', { identification: data.sender.identification }))}<br>${typo(data.sender.postalAddress)}</p>
<p style="${small}">${a(data.unsubscribeUrl, t('newsletterEmail.unsubscribe'), muted)} · ${a(data.privacy.url, data.privacy.label, muted)} · ${a(data.siteUrl, t('newsletterEmail.visitSite', { site: data.siteName }), muted)}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
`;

  const text = [
    frenchTypography(data.siteName),
    frenchTypography(data.issueLabel),
    `${t('newsletterEmail.viewOnline')} : ${data.archiveUrl}`,
    data.intro.text,
    ...(data.articles.length > 0 ? [t('newsletterEmail.inThisIssue').toUpperCase()] : []),
    ...data.articles.map((item) => [item.category?.toUpperCase(), frenchTypography(item.title), frenchTypography(item.dek), item.url].filter(Boolean).join('\n')),
    ...(data.sponsor ? [`${data.sponsor.disclosure.toUpperCase()}\n${data.sponsor.name}${data.sponsor.campaign ? ` : ${data.sponsor.campaign}` : ''}\n${data.sponsor.url}`] : []),
    '---',
    t('newsletterEmail.reason', { site: data.siteName }),
    `${t('newsletterEmail.sender', { identification: data.sender.identification })}\n${data.sender.postalAddress}`,
    `${t('newsletterEmail.unsubscribe')} : ${data.unsubscribeUrl}`,
    `${data.privacy.label} : ${data.privacy.url}`,
  ].join('\n\n');

  return { html, text: `${frenchTypography(text)}\n` };
}
