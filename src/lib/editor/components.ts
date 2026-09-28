// Blocs insérables dans le corps MDX (ARCHITECTURE, section 7.15), sur le contrat de src/lib/content/blocks.ts :
// mêmes noms, mêmes propriétés. Blocs de page réservés aux pages statiques.
import { fields } from '@keystatic/core';
import { block, inline, mark, wrapper } from '@keystatic/core/content-components';
import { createElement } from 'react';
import ads from '../../../config/ads.json' with { type: 'json' };
import { CALLOUT_VARIANTS } from '../content/blocks.ts';
import { SOURCE_TYPE } from '../content/enums.ts';
import messages from '../../../config/i18n/fr.json' with { type: 'json' };
import { frenchTypography } from '../typo.ts';
import type { CollectionName } from '../content/collections.ts';
import { newsletterList } from './fields.ts';
import { bodyImage } from './images.ts';
import { editorText, label, labelled, options } from './labels.ts';

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const AMOUNT = /^-?\d+(?:\.\d+)?$/;
const DIGITS = /^\d*$/;
// Listes d'un bloc : au moins un élément, comme au rendu (content/block-props.ts).
const AT_LEAST_ONE = { length: { min: 1 } };

// Icônes de la barre d'outils (tracés de Lucide, licence ISC), dessinées sans dépendance.
const icon = (...paths: string[]) =>
  createElement(
    'svg',
    { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
    ...paths.map((d) => createElement('path', { key: d, d })),
  );

const blockLabel = (name: string) => editorText('blocs', name);
const prop = (name: string, key: string, opts: { multiline?: boolean; required?: boolean } = {}) =>
  fields.text({ ...labelled(key, name), multiline: opts.multiline, validation: { isRequired: opts.required } });
const cell = () => fields.text({ label: label('text') });

const table = (name: string) => ({
  caption: prop(name, 'caption', { required: true }),
  columns: fields.array(cell(), { ...labelled('columns', name), itemLabel: (p) => p.value, validation: AT_LEAST_ONE }),
  rows: fields.array(fields.array(cell(), { label: label('cells'), itemLabel: (p) => p.value }), {
    ...labelled('rows', name),
    itemLabel: (p) => p.elements.map((c) => c.value).join(' · '),
    validation: AT_LEAST_ONE,
  }),
});

// Montant en texte : Keystatic ne relit pas un nombre négatif écrit dans le MDX.
const amountRow = (name: string) =>
  fields.object({
    label: prop(name, 'label', { required: true }),
    amount: fields.text({ ...labelled('amount', name), validation: { isRequired: true, pattern: { regex: AMOUNT, message: labelled('amount', name).description } } }),
  });

const partnerIds = ads.partners.map((p) => ({ label: p.name, value: p.id }));

export function bodyComponents(collection: CollectionName) {
  const calloutLabels = messages.blocks.callout as Record<string, string>;
  return {
    Callout: wrapper({
      label: blockLabel('Callout'),
      schema: {
        variant: fields.select({
          ...labelled('variant', 'Callout'),
          options: CALLOUT_VARIANTS.map((value) => ({ label: frenchTypography(calloutLabels[value] ?? value), value })),
          defaultValue: 'a-retenir',
        }),
        title: prop('Callout', 'title'),
        href: prop('Callout', 'href'),
      },
    }),
    TexteDeLoi: wrapper({
      label: blockLabel('TexteDeLoi'),
      schema: { reference: prop('TexteDeLoi', 'reference', { required: true }), version: prop('TexteDeLoi', 'version', { required: true }), url: prop('TexteDeLoi', 'url', { required: true }) },
    }),
    ExempleChiffre: block({
      label: blockLabel('ExempleChiffre'),
      schema: {
        title: prop('ExempleChiffre', 'title'),
        rows: fields.array(amountRow('ExempleChiffre'), { ...labelled('rows', 'ExempleChiffre'), itemLabel: (p) => p.fields.label.value, validation: AT_LEAST_ONE }),
        total: amountRow('ExempleChiffre'),
      },
    }),
    Chronologie: block({
      label: blockLabel('Chronologie'),
      schema: {
        items: fields.array(
          fields.object({
            date: fields.date({ label: label('date'), validation: { isRequired: true } }),
            title: prop('Chronologie', 'title', { required: true }),
            description: prop('Chronologie', 'description', { multiline: true }),
            url: prop('Chronologie', 'url'),
          }),
          { ...labelled('items', 'Chronologie'), itemLabel: (p) => `${p.fields.date.value ?? ''} ${p.fields.title.value}`, validation: AT_LEAST_ONE },
        ),
      },
    }),
    Comparatif: block({ label: blockLabel('Comparatif'), schema: table('Comparatif') }),
    Citation: wrapper({
      label: blockLabel('Citation'),
      schema: { author: prop('Citation', 'author', { required: true }), role: prop('Citation', 'role'), source: prop('Citation', 'source'), date: prop('Citation', 'date') },
    }),
    Video: block({
      label: blockLabel('Video'),
      schema: {
        id: fields.text({ ...labelled('id', 'Video'), validation: { isRequired: true, pattern: { regex: YOUTUBE_ID, message: labelled('id', 'Video').description } } }),
        title: prop('Video', 'title', { required: true }),
      },
    }),
    Note: mark({ label: blockLabel('Note'), icon: icon('M12 6v12', 'M17.196 9 6.804 15', 'm6.804 9 10.392 6'), tag: 'sup', schema: {} }),
    Definition: mark({
      label: blockLabel('Definition'),
      icon: icon('M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20'),
      tag: 'abbr',
      schema: { term: fields.relationship({ ...labelled('term', 'Definition'), collection: 'lexique', validation: { isRequired: true } }) },
    }),
    MiseEnGarde: block({ label: blockLabel('MiseEnGarde'), schema: {} }),
    StatutReglementaire: inline({
      label: blockLabel('StatutReglementaire'),
      schema: { dossier: fields.relationship({ ...labelled('dossier', 'StatutReglementaire'), collection: 'dossiers', validation: { isRequired: true } }) },
    }),
    BlocPartenaire: block({
      label: blockLabel('BlocPartenaire'),
      schema: {
        id:
          partnerIds.length > 0
            ? fields.select({ ...labelled('id', 'BlocPartenaire'), options: partnerIds, defaultValue: partnerIds[0]?.value ?? '' })
            : prop('BlocPartenaire', 'id', { required: true }),
      },
    }),
    FAQ: block({
      label: blockLabel('FAQ'),
      schema: {
        items: fields.array(fields.object({ question: prop('FAQ', 'question', { required: true }), answer: prop('FAQ', 'answer', { multiline: true, required: true }) }), {
          ...labelled('items', 'FAQ'),
          itemLabel: (p) => p.fields.question.value,
          validation: AT_LEAST_ONE,
        }),
      },
    }),
    Image: block({
      label: blockLabel('Image'),
      schema: {
        src: bodyImage(collection),
        alt: prop('Image', 'alt', { required: true }),
        caption: prop('Image', 'caption'),
        credit: prop('Image', 'credit', { required: true }),
        creditUrl: prop('Image', 'creditUrl'),
      },
    }),
  };
}

// Blocs de page (content/pages/), en plus des blocs du corps.
export function pageComponents() {
  return {
    ...bodyComponents('pages'),
    Hero: wrapper({ label: blockLabel('Hero'), schema: { title: prop('Hero', 'title', { required: true }), ctaLabel: prop('Hero', 'ctaLabel'), ctaUrl: prop('Hero', 'ctaUrl') } }),
    ListeArticles: block({
      label: blockLabel('ListeArticles'),
      schema: {
        category: fields.relationship({ ...labelled('category', 'ListeArticles'), collection: 'categories' }),
        theme: fields.relationship({ ...labelled('theme', 'ListeArticles'), collection: 'themes' }),
        jurisdiction: fields.relationship({ ...labelled('jurisdiction', 'ListeArticles'), collection: 'juridictions' }),
        format: fields.relationship({ ...labelled('format', 'ListeArticles'), collection: 'formats' }),
        tag: prop('ListeArticles', 'tag'),
        count: fields.text({ ...labelled('count', 'ListeArticles'), validation: { pattern: { regex: DIGITS, message: labelled('count', 'ListeArticles').description } } }),
        layout: fields.select({ ...labelled('layout', 'ListeArticles'), options: [{ label: editorText('valeurs', 'listLayout.list'), value: 'list' }, { label: editorText('valeurs', 'listLayout.grid'), value: 'grid' }], defaultValue: 'list' }),
      },
    }),
    CarteAuteur: block({ label: blockLabel('CarteAuteur'), schema: { id: fields.relationship({ label: label('author'), collection: 'auteurs', validation: { isRequired: true } }) } }),
    Newsletter: block({ label: blockLabel('Newsletter'), schema: { list: newsletterList('list', 'Newsletter') } }),
    ListeSources: block({
      label: blockLabel('ListeSources'),
      schema: {
        ids: fields.multiRelationship({ ...labelled('ids', 'ListeSources'), collection: 'sources' }),
        jurisdiction: fields.relationship({ ...labelled('jurisdiction', 'ListeSources'), collection: 'juridictions' }),
        type: fields.select({ ...labelled('sourceType', 'ListeSources'), options: [{ label: editorText('valeurs', 'none'), value: '' }, ...options('sourceType', SOURCE_TYPE)], defaultValue: '' }),
      },
    }),
    Tableau: block({ label: blockLabel('Tableau'), schema: table('Tableau') }),
    FormulaireContact: block({ label: blockLabel('FormulaireContact'), schema: {} }),
    ResponsableProtection: block({ label: blockLabel('ResponsableProtection'), schema: {} }),
    InventaireDonnees: block({ label: blockLabel('InventaireDonnees'), schema: {} }),
  };
}
