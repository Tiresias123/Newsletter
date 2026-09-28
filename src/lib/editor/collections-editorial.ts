// Collections éditoriales de l'éditeur : articles, guides, dossiers, pages et numéros de l'infolettre.
// Mêmes clés que les schémas Zod (src/lib/content/schemas.ts), regroupées dans l'ordre de l'ARCHITECTURE (7.0).
import { collection, fields } from '@keystatic/core';
import ads from '../../../config/ads.json' with { type: 'json' };
import legal from '../../../config/legal.json' with { type: 'json' };
import { AUDIENCE, GUIDE_LEVEL, LEGAL_STATUS, NEWSLETTER_STATUS, WHO_IS_AFFECTED } from '../content/enums.ts';
import { bodyComponents, pageComponents } from './components.ts';
import * as f from './fields.ts';
import { heading } from './heading.ts';
import { image } from './images.ts';
import type { CollectionName } from '../content/collections.ts';
import { collectionLabel, editorText, label, labelled } from './labels.ts';

export const MDX_OPTIONS = { image: false, heading: [2, 3] } as const;
export const body = (collection: CollectionName) => fields.mdx({ label: label('body'), components: bodyComponents(collection), options: MDX_OPTIONS });
const pageBody = () => fields.mdx({ label: label('body'), components: pageComponents(), options: MDX_OPTIONS });

const disclaimers = () => f.disclaimer('disclaimerVariant', legal.disclaimers);

export const cover = (collection: CollectionName) =>
  fields.object(
    { src: image('src', collection), alt: f.text('alt'), credit: f.text('credit'), creditUrl: f.url('creditUrl') },
    labelled('cover'),
  );

export const seo = (collection: CollectionName) =>
  fields.object(
    {
      title: f.text('title', 'seo', { length: { max: 70 } }),
      description: f.text('description', 'seo', { multiline: true, length: { max: 160 } }),
      canonical: f.url('canonical'),
      socialImage: image('socialImage', collection),
      noindex: f.checkbox('noindex', false),
    },
    labelled('seo'),
  );

// Champs communs aux articles et aux guides ; `extra` s'insère dans le groupe Contenu.
function articleSchema(scope: 'articles' | 'guides', extra: Record<string, ReturnType<typeof f.text>> = {}) {
  return {
    title: f.slugField('title', scope, { min: 20, max: 120 }),
    dek: f.text('dek', scope, { multiline: true, required: true, length: { min: 160, max: 300 } }),
    cover: cover(scope),
    tldr: f.textList('tldr', scope, { max: 5 }),
    body: body(scope),
    ...extra,
    _classement: heading('classement'),
    category: f.relation('category', 'categories', scope, scope === 'articles'),
    format: f.relation('format', 'formats', scope, true),
    themes: f.relations('themes', 'themes', scope, { min: 1, max: 5 }),
    jurisdictions: f.relations('jurisdictions', 'juridictions', scope),
    tags: f.textList('tags', scope),
    _publication: heading('publication'),
    author: f.relation('author', 'auteurs', scope, true),
    status: f.status(scope),
    publishedAt: f.date('publishedAt', scope),
    publishedTime: f.publishedTime(),
    updatedAt: f.date('updatedAt', scope),
    featured: f.checkbox('featured', false),
    editorsPick: f.checkbox('editorsPick', false),
    breaking: f.checkbox('breaking', false),
    previousSlugs: f.textList('previousSlugs', scope),
    _revision: heading('revision'),
    asOf: f.date('asOf', scope),
    reviewEvery: f.reviewEvery(),
    reviewedBy: f.text('reviewedBy', scope),
    corrections: f.corrections(),
    disclaimerVariant: disclaimers(),
    _sources: heading('sources'),
    sources: f.sources(),
    _relations: heading('relations'),
    relatedDossiers: f.relations('relatedDossiers', 'dossiers', scope),
    relatedTextes: f.relations('relatedTextes', 'textes', scope),
    relatedOrganismes: f.relations('relatedOrganismes', 'organismes', scope),
    relatedTraitements: f.relations('relatedTraitements', 'traitements', scope),
    relatedArticles: f.relations('relatedArticles', 'articles', scope),
    // Seuls les articles entrent dans l'infolettre : la case reste invisible sur les guides.
    ...(scope === 'guides' ? { newsletterEligible: fields.ignored() } : { _infolettre: heading('infolettre'), newsletterEligible: f.checkbox('newsletterEligible', true, scope) }),
    _referencement: heading('referencement'),
    seo: seo(scope),
    ...f.reserved(),
  };
}

const guideExtra = {
  level: f.choice('level', 'level', GUIDE_LEVEL, 'facile', 'guides'),
  duration: f.integer('duration', 'guides', { min: 1, max: 600 }),
  steps: fields.array(fields.object({ title: f.text('title', undefined, { required: true }), content: f.text('content', undefined, { multiline: true, required: true }) }), {
    ...labelled('steps', 'guides'),
    itemLabel: (props) => props.fields.title.value,
  }),
  prerequisites: f.textList('prerequisites', 'guides'),
  audience: f.choices('audience', 'audience', AUDIENCE, 'guides'),
};

const mdx = { contentField: 'body' } as const;

export const editorialCollections = {
  articles: collection({
    label: collectionLabel('articles'),
    path: 'content/articles/*',
    slugField: 'title',
    format: mdx,
    entryLayout: 'content',
    columns: ['title', 'status', 'publishedAt'],
    previewUrl: '/articles/{slug}/',
    schema: articleSchema('articles'),
  }),
  guides: collection({
    label: collectionLabel('guides'),
    path: 'content/guides/*',
    slugField: 'title',
    format: mdx,
    entryLayout: 'content',
    columns: ['title', 'status', 'publishedAt'],
    previewUrl: '/guides/{slug}/',
    schema: articleSchema('guides', guideExtra as unknown as Record<string, ReturnType<typeof f.text>>),
  }),
  dossiers: collection({
    label: collectionLabel('dossiers'),
    path: 'content/dossiers/*',
    slugField: 'title',
    format: mdx,
    columns: ['title', 'legalStatus', 'status'],
    previewUrl: '/dossiers/{slug}/',
    schema: {
      title: f.slugField('title', 'dossiers', { min: 10, max: 120 }),
      shortTitle: f.text('shortTitle'),
      summary: f.text('summary', undefined, { multiline: true, required: true, length: { min: 80, max: 400 } }),
      cover: cover('dossiers'),
      body: body('dossiers'),
      faq: f.faq(),
      _reglementation: heading('reglementation'),
      legalStatus: f.choice('legalStatus', 'legalStatus', LEGAL_STATUS, 'projet'),
      jurisdictions: f.relations('jurisdictions', 'juridictions', 'dossiers', { min: 1 }),
      themes: f.relations('themes', 'themes', 'dossiers'),
      authorities: f.relations('authorities', 'organismes'),
      proposalDate: f.date('proposalDate'),
      publicationDate: f.date('publicationDate', 'proposalDate'),
      adoptedDate: f.date('adoptedDate', 'proposalDate'),
      effectiveDate: f.date('effectiveDate', 'proposalDate'),
      implementationDate: f.date('implementationDate', 'proposalDate'),
      repealDate: f.date('repealDate', 'proposalDate'),
      whoIsAffected: f.choices('whoIsAffected', 'whoIsAffected', WHO_IS_AFFECTED),
      keyChanges: f.textList('keyChanges'),
      obligations: f.textList('obligations'),
      sanctions: f.textList('sanctions'),
      _fiscalite: heading('fiscalite'),
      taxImplications: f.text('taxImplications', undefined, { multiline: true }),
      _chronologie: heading('chronologie'),
      timeline: fields.array(
        fields.object({ date: f.date('date', 'timeline', true), title: f.text('title', 'timeline', { required: true }), description: f.text('description', 'timeline', { multiline: true }), url: f.url('url') }),
        { ...labelled('timeline'), itemLabel: (props) => `${props.fields.date.value ?? ''} ${props.fields.title.value}` },
      ),
      _sources: heading('sources'),
      keyTextes: f.relations('keyTextes', 'textes'),
      sources: f.sources(),
      _revision: heading('revision'),
      asOf: f.date('asOf'),
      reviewEvery: f.reviewEvery(),
      corrections: f.corrections(),
      disclaimerVariant: disclaimers(),
      _publication: heading('publication'),
      status: f.status(),
      publishedAt: f.date('publishedAt'),
      publishedTime: f.publishedTime(),
      updatedAt: f.date('updatedAt'),
      featured: f.checkbox('featured', false),
      previousSlugs: f.textList('previousSlugs'),
      _referencement: heading('referencement'),
      seo: seo('dossiers'),
      ...f.reserved(),
    },
  }),
  pages: collection({
    label: collectionLabel('pages'),
    path: 'content/pages/*',
    slugField: 'title',
    format: mdx,
    entryLayout: 'content',
    columns: ['title', 'status'],
    previewUrl: '/{slug}/',
    schema: {
      title: f.slugField('title', 'pages', { min: 2, max: 120 }),
      body: pageBody(),
      _publication: heading('publication'),
      updatedAt: f.date('updatedAt', 'pages'),
      noindex: f.checkbox('noindex', false),
      status: f.status(),
      _referencement: heading('referencement'),
      seo: seo('pages'),
      ...f.reserved(),
    },
  }),
  newsletters: collection({
    label: collectionLabel('newsletters'),
    path: 'content/newsletters/*',
    slugField: 'subject',
    format: mdx,
    entryLayout: 'content',
    columns: ['subject', 'issueNumber', 'status'],
    previewUrl: '/newsletter/{slug}/',
    schema: {
      subject: f.slugField('subject', 'newsletters', { min: 5, max: 120 }),
      preheader: f.text('preheader'),
      body: body('newsletters'),
      articles: f.relations('articles', 'articles', 'newsletters'),
      _envoi: heading('envoi'),
      issueNumber: f.integer('issueNumber', undefined, { min: 1, required: true }),
      status: f.select('status', 'newsletterStatus', NEWSLETTER_STATUS, 'brouillon', 'newsletters'),
      sentAt: f.date('sentAt'),
      list: f.newsletterList(),
      providerId: f.text('providerId'),
      sponsor: fields.select({
        ...labelled('sponsor'),
        options: [{ label: editorText('valeurs', 'none'), value: '' }, ...ads.partners.map((p) => ({ label: p.name, value: p.id }))],
        defaultValue: '',
      }),
    },
  }),
};
