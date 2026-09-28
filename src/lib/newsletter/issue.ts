// Numéros de l'infolettre (ARCHITECTURE, section 11.4) : choix des articles du prochain numéro, puis données
// du courriel d'un numéro rédigé. Sans accès aux fichiers : les scripts lisent et écrivent, ce module décide.
import { addDays, calendarDateInZone } from '../dates.ts';
import type { Entry, Graph } from '../content/graph.ts';
import { formatDate } from '../format.ts';
import { t } from '../i18n.ts';
import { absolute } from '../seo/json-ld.ts';
import type { EmailData } from './email.ts';
import type { ConvertedText } from './markdown.ts';

// Sans numéro envoyé, le premier numéro reprend les articles de la dernière semaine.
export const FIRST_ISSUE_DAYS = 7;

export type NextIssue = { id: string; issueNumber: number; articles: string[]; since: string; unsentDrafts: string[] };

const sentIssues = (graph: Graph) => graph.all('newsletters').filter((n) => n.data.status === 'envoye');

// Prochain numéro : articles publiés et proposés à l'infolettre depuis la date d'envoi du dernier numéro
// (celle-ci comprise), moins ceux qu'un numéro envoyé contient déjà ; du plus récent au plus ancien.
export function nextIssue(graph: Graph): NextIssue {
  const today = calendarDateInZone(graph.ctx.now, graph.ctx.timezone);
  const all = graph.all('newsletters');
  const issueNumber = Math.max(0, ...all.map((n) => n.data.issueNumber)) + 1;
  const sent = sentIssues(graph);
  const lastSent = sent.map((n) => n.data.sentAt).filter((d): d is string => Boolean(d)).sort().at(-1);
  const fallback = addDays(today, -FIRST_ISSUE_DAYS);
  const since = lastSent ?? fallback;
  const already = new Set(sent.flatMap((n) => n.data.articles));
  const articles = graph
    .listed('articles')
    .filter((a) => a.data.newsletterEligible && !already.has(a.id))
    .filter((a) => {
      const date = a.visibility.instant ? calendarDateInZone(a.visibility.instant, graph.ctx.timezone) : a.data.publishedAt;
      return date !== undefined && date >= since && date <= today;
    })
    .map((a) => a.id);
  const unsentDrafts = all.filter((n) => n.data.status !== 'envoye').map((n) => n.id);
  return { id: `${today.slice(0, 4)}-${String(issueNumber).padStart(3, '0')}`, issueNumber, articles, since, unsentDrafts };
}

// Données du courriel d'un numéro ; `problems` liste ce qui empêche de l'envoyer tel quel.
export function issueEmail(graph: Graph, issue: Entry<'newsletters'>, intro: ConvertedText): { data: EmailData; problems: string[] } {
  const { site, newsletter, legal, ads } = graph.config;
  const d = issue.data;
  const problems: string[] = [];
  // Le lien « Lire ce numéro dans votre navigateur » mène à l'archive, construite une fois le numéro envoyé.
  if (!issue.visibility.visible) problems.push("numéro pas encore archivé : passez-le à « Envoyé » avec sa date d'envoi et mettez-le en ligne avant l'envoi, sinon le lien « Lire ce numéro dans votre navigateur » mènera à une page introuvable.");
  const articles = d.articles.flatMap((id) => {
    const article = graph.get('articles', id);
    if (!article?.visibility.listed) {
      problems.push(`l'article « ${id} » n'est pas publié : il est retiré du courriel.`);
      return [];
    }
    const category = graph.get('categories', article.data.category);
    return [{ category: category?.data.label, title: article.data.title, dek: article.data.dek, url: absolute(site.url, article.url ?? '/') }];
  });
  const partner = d.sponsor ? ads.partners.find((p) => p.id === d.sponsor) : undefined;
  if (d.sponsor && (!partner || !partner.enabled || !ads.enabled)) problems.push(`partenaire « ${d.sponsor} » absent ou désactivé dans config/ads.json : il est retiré du courriel.`);
  const sponsor = partner && partner.enabled && ads.enabled ? { name: partner.name, url: partner.url, campaign: partner.campaign, disclosure: partner.disclosure } : undefined;
  const date = d.sentAt ?? calendarDateInZone(graph.ctx.now, graph.ctx.timezone);
  return {
    data: {
      subject: d.subject,
      preheader: d.preheader,
      siteName: site.name,
      siteUrl: absolute(site.url, '/'),
      issueLabel: t('newsletterEmail.issueDate', { n: d.issueNumber, date: formatDate(date) }),
      archiveUrl: absolute(site.url, issue.url ?? '/newsletter/'),
      intro,
      articles,
      sponsor,
      sender: { identification: legal.newsletterSender.identification, postalAddress: legal.newsletterSender.postalAddress },
      unsubscribeUrl: newsletter.unsubscribeUrl,
      privacy: { label: newsletter.texts.privacyLinkLabel, url: absolute(site.url, newsletter.texts.privacyUrl) },
    },
    problems,
  };
}
