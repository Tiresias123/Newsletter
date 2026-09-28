// Réglages du site (fichiers de config/) dans l'éditeur, un formulaire par fichier, sur les schémas de
// src/lib/config/schemas.ts. Les valeurs que l'auteur ne doit pas changer sont conservées telles quelles.
import { fields, singleton } from '@keystatic/core';
import { SOCIAL_NETWORK, SOURCE_TYPE } from '../content/enums.ts';
import * as f from './fields.ts';
import { homepageSchema } from './homepage.ts';
import { interfaceTextsSchema } from './interface-texts.ts';
import { label, labelled, options } from './labels.ts';
import { themeSchema } from './theme.ts';
import messages from '../../../config/i18n/fr.json' with { type: 'json' };

const json = { data: 'json' } as const;
const socialOptions = SOCIAL_NETWORK.map((value) => ({ label: (messages.social as Record<string, string>)[value] ?? value, value }));

const navLink = {
  label: f.text('label', undefined, { required: true }),
  url: f.link('url'),
  icon: f.icon(),
  description: f.text('description', 'navigation'),
  enabled: f.checkbox('enabled', true),
  openInNewTab: f.checkbox('openInNewTab', false),
  highlight: f.checkbox('highlight', false),
  badge: f.text('badge'),
};

const configLabel = (key: string) => label(key);

export const singletons = {
  site: singleton({
    label: configLabel('site'),
    path: 'config/site',
    format: json,
    schema: {
      name: f.text('name', 'site', { required: true }),
      baseline: f.text('baseline', undefined, { required: true, length: { max: 160 } }),
      description: f.text('description', 'site', { multiline: true, required: true, length: { max: 300 } }),
      url: f.url('url', 'site', true),
      locale: fields.ignored(),
      timezone: fields.ignored(),
      contactEmail: f.text('contactEmail'),
      logo: fields.object({ light: f.text('light', 'logo'), dark: f.text('dark', 'logo') }, labelled('logo')),
      socials: fields.array(
        fields.object({ network: fields.select({ ...labelled('network'), options: socialOptions, defaultValue: 'linkedin' }), url: f.link('url', undefined, false), enabled: f.checkbox('enabled', false) }),
        { ...labelled('socials'), itemLabel: (props) => props.fields.network.value },
      ),
      announcement: fields.object(
        { enabled: f.checkbox('enabled', false), message: f.text('message'), linkLabel: f.text('linkLabel'), linkUrl: f.link('linkUrl', undefined, false) },
        labelled('announcement'),
      ),
      dataHosting: f.text('dataHosting'),
      copyrightHolder: f.text('copyrightHolder'),
    },
  }),
  navigation: singleton({
    label: configLabel('navigation'),
    path: 'config/navigation',
    format: json,
    schema: {
      header: fields.array(fields.object({ ...navLink, children: fields.array(fields.object(navLink), { ...labelled('children'), itemLabel: (props) => props.fields.label.value }) }), {
        ...labelled('header'),
        itemLabel: (props) => props.fields.label.value,
      }),
      subscribeButton: fields.object({ enabled: f.checkbox('enabled', true), label: f.text('label', undefined, { required: true }), url: f.link('url') }, labelled('subscribeButton')),
      footer: fields.array(
        fields.object({
          title: f.text('title', undefined, { required: true }),
          links: fields.array(fields.object({ label: f.text('label', undefined, { required: true }), url: f.link('url'), enabled: f.checkbox('enabled', true) }), {
            ...labelled('links'),
            itemLabel: (props) => props.fields.label.value,
          }),
        }),
        { ...labelled('footer'), itemLabel: (props) => props.fields.title.value },
      ),
    },
  }),
  homepage: singleton({ label: configLabel('homepage'), path: 'config/homepage', format: json, schema: homepageSchema() }),
  theme: singleton({ label: configLabel('theme'), path: 'config/theme', format: json, schema: themeSchema() }),
  newsletter: singleton({
    label: configLabel('newsletter'),
    path: 'config/newsletter',
    format: json,
    schema: {
      provider: f.select('provider', 'provider', ['brevo', 'cyberimpact', 'test'], 'brevo'),
      doubleOptIn: fields.ignored(),
      unsubscribeUrl: f.text('unsubscribeUrl', undefined, { required: true }),
      lists: fields.array(fields.object({ id: f.text('id', undefined, { required: true }), label: f.text('label', undefined, { required: true }), enabled: f.checkbox('enabled', false) }), {
        ...labelled('lists'),
        itemLabel: (props) => props.fields.label.value,
      }),
      texts: fields.object(
        {
          title: f.text('title', undefined, { required: true }),
          subtitle: f.text('subtitle', undefined, { multiline: true }),
          emailLabel: f.text('emailLabel', undefined, { required: true }),
          emailPlaceholder: f.text('emailPlaceholder'),
          button: f.text('button', undefined, { required: true }),
          consent: f.text('consent', undefined, { multiline: true, required: true }),
          privacyLinkLabel: f.text('privacyLinkLabel', undefined, { required: true }),
          privacyUrl: f.link('privacyUrl'),
          success: f.text('success', 'newsletter', { multiline: true, required: true }),
          error: f.text('error', undefined, { multiline: true, required: true }),
          frequency: f.text('frequency'),
        },
        labelled('texts'),
      ),
    },
  }),
  legal: singleton({
    label: configLabel('legal'),
    path: 'config/legal',
    format: json,
    schema: {
      privacyOfficer: fields.object({ name: f.text('name', 'privacyOfficer'), title: f.text('title', 'privacyOfficer'), email: f.text('email') }, labelled('privacyOfficer')),
      disclaimers: fields.array(
        fields.object({ id: f.text('id', undefined, { required: true }), title: f.text('title', undefined, { required: true }), text: f.text('text', 'disclaimers', { multiline: true, required: true }) }),
        { ...labelled('disclaimers'), itemLabel: (props) => `${props.fields.title.value} (${props.fields.id.value})` },
      ),
      officialSourceTypes: fields.multiselect({ ...labelled('officialSourceTypes'), options: options('sourceType', SOURCE_TYPE) }),
      officialSourceTypesValidated: f.checkbox('officialSourceTypesValidated', false),
      communiqueFromOrganismeIsOfficial: f.checkbox('communiqueFromOrganismeIsOfficial', true),
      newsletterSender: fields.object({ identification: f.text('identification', undefined, { multiline: true }), postalAddress: f.text('postalAddress', undefined, { multiline: true }) }, labelled('newsletterSender')),
    },
  }),
  veilleSources: singleton({
    label: configLabel('veilleSources'),
    path: 'config/sources-veille',
    format: json,
    schema: {
      retentionMonths: f.integer('retentionMonths', undefined, { defaultValue: 12, min: 1, max: 60 }),
      sources: fields.array(
        fields.object({
          id: f.text('id', undefined, { required: true }),
          label: f.text('label', undefined, { required: true }),
          organisme: f.relation('organisme', 'organismes'),
          jurisdiction: f.relation('jurisdiction', 'juridictions', undefined, true),
          url: f.url('url'),
          format: f.select('format', 'veilleFormat', ['rss', 'atom', 'json'], 'rss'),
          language: f.select('language', 'veilleLanguage', ['fr', 'en'], 'fr'),
          keywords: f.textList('keywords'),
          enabled: f.checkbox('enabled', false),
          note: f.text('note', undefined, { multiline: true }),
        }),
        { ...labelled('sources', 'veilleSources'), itemLabel: (props) => props.fields.label.value },
      ),
    },
  }),
  ads: singleton({
    label: configLabel('ads'),
    path: 'config/ads',
    format: json,
    schema: {
      enabled: f.checkbox('enabled', false),
      partners: fields.array(
        fields.object({
          id: f.text('id', undefined, { required: true }),
          name: f.text('name', 'partners', { required: true }),
          logo: f.text('logo'),
          url: f.url('url', undefined, true),
          campaign: f.text('campaign'),
          startDate: f.date('startDate'),
          endDate: f.date('endDate'),
          placement: fields.multiselect({ ...labelled('placement'), options: f.valueOptions('placement', ['article', 'sidebar', 'home', 'newsletter']) }),
          disclosure: f.text('disclosure', undefined, { required: true }),
          enabled: f.checkbox('enabled', false),
        }),
        { ...labelled('partners'), itemLabel: (props) => props.fields.name.value },
      ),
    },
  }),
  redirects: singleton({
    label: configLabel('redirects'),
    path: 'config/redirects',
    format: json,
    schema: {
      redirects: fields.array(
        // Code en nombre (301 ou 302) : une liste de Keystatic n'enregistre que du texte, que Zod refuserait.
        fields.object({ from: f.text('from', undefined, { required: true }), to: f.link('to'), status: f.integer('status', 'redirects', { defaultValue: 301, min: 301, max: 302 }) }),
        { ...labelled('redirects'), itemLabel: (props) => `${props.fields.from.value} → ${props.fields.to.value}` },
      ),
    },
  }),
  ticker: singleton({
    label: configLabel('ticker'),
    path: 'config/ticker',
    format: json,
    schema: {
      enabled: f.checkbox('enabled', false, 'ticker'),
      provider: fields.ignored(),
      currency: fields.ignored(),
      assets: fields.array(
        fields.object({ id: f.text('id', 'ticker', { required: true }), symbol: f.text('symbol', undefined, { required: true, length: { max: 10 } }), label: f.text('label', undefined, { required: true }), enabled: f.checkbox('enabled', true) }),
        { ...labelled('assets'), itemLabel: (props) => `${props.fields.symbol.value} ${props.fields.label.value}` },
      ),
    },
  }),
  messages: singleton({ label: configLabel('messages'), path: 'config/i18n/fr', format: json, schema: interfaceTextsSchema() }),
};

