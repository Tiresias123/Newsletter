// Schémas des collections de contenu : source de vérité du modèle (ARCHITECTURE, section 7).
// Règles propres à une entrée ici ; règles qui croisent plusieurs contenus dans graph.ts.
import { z } from '../zod.ts';
import { HALF_HOURS } from '../dates.ts';
import {
  AGENDA_TYPE,
  AUDIENCE,
  AUTHORITY_TYPE,
  CATEGORY_BADGE,
  GUIDE_LEVEL,
  JURISDICTION_BADGE,
  JURISDICTION_LEVEL,
  LEGAL_STATUS,
  NEWSLETTER_STATUS,
  SCHEMA_TYPE,
  SOCIAL_NETWORK,
  SOURCE_TYPE,
  TAX_TYPE,
  TEXT_TYPE,
  THEME_GROUP,
  WHO_IS_AFFECTED,
} from './enums.ts';
import {
  calendarDate,
  corrections,
  cover,
  icon,
  lang,
  optionalDate,
  optionalImage,
  optionalSlug,
  optionalText,
  optionalUrl,
  reviewEvery,
  seo,
  slug,
  slugList,
  sources,
  status,
  time,
  type SchemaContext,
} from './fields.ts';

const textList = () => z.array(z.string().min(1)).default([]);
// Questions fréquentes d'une fiche, rendues en accordéon et en données structurées FAQPage.
const faq = () => z.array(z.strictObject({ question: z.string().min(1), answer: z.string().min(1) })).default([]);

type Check = z.RefinementCtx;

// Un contenu qui n'est plus un brouillon doit porter une date de publication.
function requirePublicationDate(value: { status: string; publishedAt?: string }, check: Check) {
  if (value.status !== 'brouillon' && !value.publishedAt) {
    check.addIssue({ code: 'custom', path: ['publishedAt'], message: 'Date de publication obligatoire dès que le contenu n\'est plus un brouillon.' });
  }
}

function requireOrderedDates(value: { publishedAt?: string; updatedAt?: string }, check: Check) {
  if (value.publishedAt && value.updatedAt && value.updatedAt < value.publishedAt) {
    check.addIssue({ code: 'custom', path: ['updatedAt'], message: 'La date de mise à jour précède la date de publication.' });
  }
}

// Champs communs aux articles et aux guides (composition, pas de copie).
const articleFields = (ctx: SchemaContext) => ({
  title: z.string().min(20).max(120),
  dek: z.string().min(160).max(300),
  cover: cover(ctx),
  tldr: textList().pipe(z.array(z.string()).max(5)),
  format: slug(),
  themes: z.array(slug()).min(1).max(5),
  jurisdictions: slugList(),
  tags: z.array(z.string().min(1).transform((t) => t.trim().toLowerCase())).default([]),
  author: slug(),
  status: status(),
  publishedAt: optionalDate(),
  publishedTime: time(),
  updatedAt: optionalDate(),
  featured: z.boolean().default(false),
  editorsPick: z.boolean().default(false),
  breaking: z.boolean().default(false),
  previousSlugs: slugList(),
  asOf: optionalDate(),
  reviewEvery: reviewEvery(),
  reviewedBy: optionalText(),
  corrections: corrections(),
  disclaimerVariant: optionalText(),
  sources: sources(),
  relatedDossiers: slugList(),
  relatedTextes: slugList(),
  relatedOrganismes: slugList(),
  relatedTraitements: slugList(),
  relatedArticles: slugList(),
  newsletterEligible: z.boolean().default(true),
  seo: seo(ctx),
  lang: lang(),
  translationKey: optionalText(),
});

function articleRules(value: { tldr: string[]; status: string; publishedAt?: string; updatedAt?: string }, check: Check) {
  if (value.tldr.length > 0 && value.tldr.length < 3) {
    check.addIssue({ code: 'custom', path: ['tldr'], message: "L'essentiel compte de 3 à 5 points (ou aucun)." });
  }
  requirePublicationDate(value, check);
  requireOrderedDates(value, check);
}

export const articleSchema = (ctx: SchemaContext) =>
  z.strictObject({ ...articleFields(ctx), category: slug() }).superRefine(articleRules);

export const guideSchema = (ctx: SchemaContext) =>
  z
    .strictObject({
      ...articleFields(ctx),
      category: optionalSlug(),
      level: z.enum(GUIDE_LEVEL),
      duration: z.preprocess((v) => (v === '' || v === null ? undefined : v), z.number().int().min(1).max(600).optional()),
      steps: z.array(z.strictObject({ title: z.string().min(1), content: z.string().min(1) })).default([]),
      prerequisites: textList(),
      audience: z.array(z.enum(AUDIENCE)).default([]),
    })
    .superRefine(articleRules);

export const dossierSchema = (ctx: SchemaContext) =>
  z
    .strictObject({
      title: z.string().min(10).max(120),
      shortTitle: optionalText(),
      summary: z.string().min(80).max(400),
      cover: cover(ctx),
      faq: faq(),
      legalStatus: z.enum(LEGAL_STATUS),
      jurisdictions: z.array(slug()).min(1),
      themes: slugList(),
      authorities: slugList(),
      proposalDate: optionalDate(),
      publicationDate: optionalDate(),
      adoptedDate: optionalDate(),
      effectiveDate: optionalDate(),
      implementationDate: optionalDate(),
      repealDate: optionalDate(),
      whoIsAffected: z.array(z.enum(WHO_IS_AFFECTED)).default([]),
      keyChanges: textList(),
      obligations: textList(),
      sanctions: textList(),
      taxImplications: optionalText(),
      timeline: z
        .array(z.strictObject({ date: calendarDate(), title: z.string().min(1), description: optionalText(), url: optionalUrl() }))
        .default([]),
      keyTextes: slugList(),
      sources: sources(),
      asOf: optionalDate(),
      reviewEvery: reviewEvery(),
      corrections: corrections(),
      disclaimerVariant: optionalText(),
      status: status(),
      publishedAt: optionalDate(),
      publishedTime: time(),
      updatedAt: optionalDate(),
      featured: z.boolean().default(false),
      previousSlugs: slugList(),
      seo: seo(ctx),
      lang: lang(),
      translationKey: optionalText(),
    })
    .superRefine((value, check) => {
      requirePublicationDate(value, check);
      requireOrderedDates(value, check);
      if (value.status !== 'brouillon' && !value.asOf) {
        check.addIssue({ code: 'custom', path: ['asOf'], message: '« Vérifié le » est obligatoire pour un dossier publié.' });
      }
    });

export const jurisdictionSchema = (ctx: SchemaContext) =>
  z.strictObject({
    name: z.string().min(2),
    level: z.enum(JURISDICTION_LEVEL),
    country: optionalText(),
    description: z.string().min(1).max(300),
    icon: icon(),
    order: z.number().int().default(100),
    parent: optionalSlug(),
    badgeStyle: z.enum(JURISDICTION_BADGE).default('contour'),
    keyDossiers: slugList(),
    keyTraitements: slugList(),
    faq: faq(),
    status: status(),
    seo: seo(ctx),
    lang: lang(),
    translationKey: optionalText(),
  });

export const organismeSchema = (ctx: SchemaContext) =>
  z.strictObject({
    name: z.string().min(2),
    acronym: optionalText(),
    jurisdiction: slug(),
    authorityType: z.enum(AUTHORITY_TYPE),
    role: z.string().min(1).max(300),
    website: z.url(),
    logo: optionalImage(ctx),
    asOf: optionalDate(),
    status: status(),
    seo: seo(ctx),
    lang: lang(),
    translationKey: optionalText(),
  });

export const texteSchema = (ctx: SchemaContext) =>
  z.strictObject({
    title: z.string().min(5).max(200),
    shortTitle: optionalText(),
    type: z.enum(TEXT_TYPE),
    issuer: slug(),
    jurisdiction: slug(),
    officialUrl: z.url(),
    archivedUrl: optionalUrl(),
    documentNumber: optionalText(),
    citation: optionalText(),
    adoptedAt: optionalDate(),
    inForceAt: optionalDate(),
    legalStatus: z.preprocess((v) => (v === '' || v === null ? undefined : v), z.enum(LEGAL_STATUS).optional()),
    summary: z.string().min(1).max(400),
    keyProvisions: textList(),
    asOf: optionalDate(),
    status: status(),
    seo: seo(ctx),
    lang: lang(),
    translationKey: optionalText(),
  });

export const traitementSchema = (ctx: SchemaContext) =>
  z
    .strictObject({
      title: z.string().min(10).max(160),
      jurisdiction: slug(),
      taxpayerType: slug(),
      activity: slug(),
      taxType: z.enum(TAX_TYPE),
      taxableEvent: optionalText(),
      treatment: z.string().min(1),
      reportingRequirement: optionalText(),
      forms: z.array(z.strictObject({ code: z.string().min(1), name: z.string().min(1), url: optionalUrl() })).default([]),
      sources: sources(),
      asOf: optionalDate(),
      reviewEvery: reviewEvery(),
      status: status(),
      publishedAt: optionalDate(),
      updatedAt: optionalDate(),
      seo: seo(ctx),
      lang: lang(),
      translationKey: optionalText(),
    })
    .superRefine((value, check) => {
      requireOrderedDates(value, check);
      if (value.status !== 'brouillon' && !value.asOf) {
        check.addIssue({ code: 'custom', path: ['asOf'], message: '« Vérifié le » est obligatoire pour un traitement fiscal publié.' });
      }
    });

export const lexiqueSchema = (ctx: SchemaContext) =>
  z.strictObject({
    term: z.string().min(1),
    shortDefinition: z.string().min(1).max(200),
    seeAlso: slugList(),
    officialSources: sources(),
    synonyms: textList(),
    status: status(),
    seo: seo(ctx),
    lang: lang(),
    translationKey: optionalText(),
  });

export const sourceSchema = () =>
  z.strictObject({
    title: z.string().min(1),
    sourceType: z.enum(SOURCE_TYPE),
    issuer: optionalSlug(),
    issuerLabel: optionalText(),
    jurisdiction: optionalSlug(),
    url: z.url(),
    archivedUrl: optionalUrl(),
    documentDate: optionalDate(),
    accessedDate: optionalDate(),
    documentNumber: optionalText(),
    citation: optionalText(),
  });

export const agendaSchema = () =>
  z
    .strictObject({
      title: z.string().min(1),
      date: calendarDate(),
      endDate: optionalDate(),
      time: z.preprocess((v) => (v === '' || v === null ? undefined : v), z.enum(HALF_HOURS as [string, ...string[]]).optional()),
      type: z.enum(AGENDA_TYPE),
      jurisdiction: slug(),
      url: optionalUrl(),
      description: optionalText(),
      relatedDossier: optionalSlug(),
      status: status(),
    })
    .superRefine((value, check) => {
      if (value.endDate && value.endDate < value.date) {
        check.addIssue({ code: 'custom', path: ['endDate'], message: 'La date de fin précède la date de début.' });
      }
    });

export const auteurSchema = (ctx: SchemaContext) =>
  z.strictObject({
    name: z.string().min(2),
    avatar: optionalImage(ctx),
    role: optionalText(),
    bio: optionalText(),
    mentionProfessionnelle: optionalText(),
    socials: z.array(z.strictObject({ network: z.enum(SOCIAL_NETWORK), url: z.string().min(1) })).default([]),
    active: z.boolean().default(true),
  });

export const newsletterSchema = () =>
  z.strictObject({
    subject: z.string().min(5).max(120),
    preheader: optionalText(),
    issueNumber: z.number().int().min(1),
    sentAt: optionalDate(),
    status: z.enum(NEWSLETTER_STATUS).default('brouillon'),
    articles: slugList(),
    list: z.string().default('generale'),
    providerId: optionalText(),
    sponsor: optionalText(),
  });

export const pageSchema = (ctx: SchemaContext) =>
  z.strictObject({
    title: z.string().min(2).max(120),
    updatedAt: optionalDate(),
    noindex: z.boolean().default(false),
    status: status(),
    seo: seo(ctx),
    lang: lang(),
    translationKey: optionalText(),
  });

// Taxonomies : un fichier JSON par entrée, modifiables par l'auteur.
export const categorySchema = () =>
  z.strictObject({
    label: z.string().min(2),
    description: z.string().min(1).max(300),
    badgeStyle: z.enum(CATEGORY_BADGE),
    icon: icon(),
    order: z.number().int().default(100),
    requireVerification: z.boolean().default(false),
    defaultDisclaimer: optionalText(),
  });

export const themeSchema = () =>
  z.strictObject({
    label: z.string().min(2),
    description: optionalText(),
    group: z.enum(THEME_GROUP),
    order: z.number().int().default(100),
  });

export const formatSchema = () =>
  z.strictObject({
    label: z.string().min(2),
    description: optionalText(),
    schemaType: z.enum(SCHEMA_TYPE).default('NewsArticle'),
    order: z.number().int().default(100),
  });

export const simpleTaxonomySchema = () =>
  z.strictObject({
    label: z.string().min(2),
    description: optionalText(),
    order: z.number().int().default(100),
  });
