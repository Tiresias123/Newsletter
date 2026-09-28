// Champs de l'éditeur, miroirs des briques Zod (src/lib/content/fields.ts) : mêmes valeurs enregistrées,
// libellés et aides lus dans config/i18n/fr.json. Toute règle reste dans Zod ; les validations ci-dessous
// préviennent l'auteur dès la saisie. Constats de l'étude de Keystatic 0.6.9 (ARCHITECTURE, section 4.3) :
// une date, un nombre ou une adresse vides sont omis du fichier ; une liste facultative a une option vide.
import { fields } from '@keystatic/core';
import newsletter from '../../../config/newsletter.json' with { type: 'json' };
import { HALF_HOURS } from '../dates.ts';
import { formatTime } from '../format.ts';
import { ICON_NAMES } from '../icons.ts';
import { PUBLICATION_STATUS, REVIEW_EVERY, SOURCE_TYPE } from '../content/enums.ts';
import { SLUG_PATTERN } from '../content/fields.ts';
import { slugFromTitle } from '../urls.ts';
import { collectionLabel, editorText, label, labelled, options } from './labels.ts';

type Length = { min?: number; max?: number };
type Option = { label: string; value: string };

const URL = /^https?:\/\/\S+$/;
const LINK = /^(?:\/|https?:\/\/|mailto:)\S*$/;
const optional = (regex: RegExp) => new RegExp(`^(?:${regex.source.slice(1, -1)})?$`);

// Longueur contrôlée par un motif, pour un message en français (celui de Keystatic est en anglais).
function lengthPattern(length: Length | undefined, required: boolean | undefined) {
  if (!length) return undefined;
  const bounds = `{${length.min ?? 0},${length.max ?? ''}}`;
  const message = editorText('messages', length.min && length.max ? 'lengthBetween' : length.max ? 'lengthMax' : 'lengthMin')
    .replace('{min}', String(length.min ?? 0))
    .replace('{max}', String(length.max ?? ''));
  return { regex: new RegExp(required ? `^[\\s\\S]${bounds}$` : `^(?:[\\s\\S]${bounds})?$`), message };
}

export const text = (key: string, scope?: string, opts: { multiline?: boolean; required?: boolean; length?: Length } = {}) =>
  fields.text({ ...labelled(key, scope), multiline: opts.multiline, validation: { isRequired: opts.required, pattern: lengthPattern(opts.length, opts.required) } });

export const date = (key: string, scope?: string, required = false) =>
  required ? fields.date({ ...labelled(key, scope), validation: { isRequired: true } }) : fields.date({ ...labelled(key, scope) });

// Adresse web en texte : la validation de fields.url laisse passer « www.exemple.ca », que Zod refuse.
export const url = (key: string, scope?: string, required = false) =>
  fields.text({
    ...labelled(key, scope),
    validation: { isRequired: required, pattern: { regex: required ? URL : optional(URL), message: editorText('messages', 'url') } },
  });

// Lien du site (« /dossiers/ ») ou externe (« https://… »).
export const link = (key: string, scope?: string, required = true) =>
  fields.text({
    ...labelled(key, scope),
    validation: { isRequired: required, pattern: { regex: required ? LINK : optional(LINK), message: editorText('messages', 'link') } },
  });

export const checkbox = (key: string, defaultValue: boolean, scope?: string) => fields.checkbox({ ...labelled(key, scope), defaultValue });

export const integer = (key: string, scope?: string, opts: { defaultValue?: number; min?: number; max?: number; required?: boolean } = {}) =>
  fields.integer({ ...labelled(key, scope), defaultValue: opts.defaultValue, validation: { isRequired: opts.required, min: opts.min, max: opts.max } });

// Relation vers une autre collection : l'identifiant (slug) est enregistré ; vide, la clé est omise.
export const relation = (key: string, collection: string, scope?: string, required = false) =>
  required
    ? fields.relationship({ ...labelled(key, scope), collection, validation: { isRequired: true } })
    : fields.relationship({ ...labelled(key, scope), collection });

export const relations = (key: string, collection: string, scope?: string, length?: Length) =>
  fields.multiRelationship({ ...labelled(key, scope), collection, validation: length ? { length } : undefined });

// Liste fermée ; facultative, elle commence par une option vide, pour ne jamais inventer de valeur.
function selectField(key: string, scope: string | undefined, list: Option[], defaultValue: string | undefined) {
  const withEmpty = defaultValue === undefined ? [{ label: editorText('valeurs', 'none'), value: '' }, ...list] : list;
  return fields.select({ ...labelled(key, scope), options: withEmpty, defaultValue: defaultValue ?? '' });
}

// Libellés de la section « enums » ; sans valeur par défaut, la liste est facultative.
export const choice = (key: string, group: Parameters<typeof options>[0], values: readonly string[], defaultValue?: string, scope?: string) =>
  selectField(key, scope, options(group, values), defaultValue);

export const choices = (key: string, group: Parameters<typeof options>[0], values: readonly string[], scope?: string) =>
  fields.multiselect({ ...labelled(key, scope), options: options(group, values) });

// Libellés de la section « editeur.valeurs ».
export const valueOptions = (group: string, values: readonly string[]): Option[] =>
  values.map((value) => ({ label: editorText('valeurs', `${group}.${value}`), value }));

export const select = (key: string, group: string, values: readonly string[], defaultValue?: string, scope?: string) =>
  selectField(key, scope, valueOptions(group, values), defaultValue);

// Liste de textes, un par ligne ; un élément vide serait écrit « null » : l'éditeur le refuse.
export const textList = (key: string, scope?: string, length?: Length) =>
  fields.array(fields.text({ label: label(key), validation: { isRequired: true } }), {
    ...labelled(key, scope),
    itemLabel: (props) => props.value,
    validation: length ? { length } : undefined,
  });

// Liste fermée sans valeur proposée : l'auteur doit choisir (« À choisir » est refusé par npm run check).
// Pour le type d'une source : un type officiel proposé d'office satisferait à tort la règle de la source officielle.
export const pick = (key: string, group: Parameters<typeof options>[0], values: readonly string[], scope?: string) =>
  fields.select({ ...labelled(key, scope), options: [{ label: editorText('valeurs', 'choose'), value: '' }, ...options(group, values)], defaultValue: '' });

// Avertissement : vide, celui par défaut (de la catégorie, sinon le général) ; « aucun », pas d'avertissement.
export const disclaimer = (key: string, ids: readonly { id: string; title: string }[]) =>
  fields.select({
    ...labelled(key),
    options: [
      { label: editorText('valeurs', 'disclaimer.default'), value: '' },
      { label: editorText('valeurs', 'disclaimer.none'), value: 'aucun' },
      ...ids.filter((d) => d.id !== 'aucun').map((d) => ({ label: `${d.title} (${d.id})`, value: d.id })),
    ],
    defaultValue: '',
  });

export const status = (scope?: string) => choice('status', 'status', PUBLICATION_STATUS, 'brouillon', scope);
export const reviewEvery = () => choice('reviewEvery', 'reviewEvery', REVIEW_EVERY, 'aucun');

// Heure à la demi-heure près, affichée à la québécoise (« 8 h 30 »), enregistrée « 08:30 ».
const halfHours = HALF_HOURS.map((value) => ({ label: formatTime(value), value }));
export const publishedTime = () => fields.select({ ...labelled('publishedTime'), options: halfHours, defaultValue: '08:00' });
export const optionalTime = (key: string, scope?: string) =>
  fields.select({ ...labelled(key, scope), options: [{ label: editorText('valeurs', 'noTime'), value: '' }, ...halfHours], defaultValue: '' });

// Liste de diffusion de config/newsletter.json, la première par défaut : jamais un identifiant écrit en dur,
// qu'un renommage dans les réglages rendrait invalide (l'éditeur ne se chargerait plus).
export function newsletterList(key = 'list', scope?: string) {
  const lists = newsletter.lists.map((l) => ({ label: l.label, value: l.id }));
  const first = lists[0];
  return first ? fields.select({ ...labelled(key, scope), options: lists, defaultValue: first.value }) : text(key, scope, { required: true });
}

export const icon = () => selectField('icon', undefined, ICON_NAMES.map((value) => ({ label: value, value })), undefined);

// Identifiant du fichier : le nom (titre, terme…) est enregistré sous sa clé, l'identifiant devient le nom du fichier.
export const slugField = (key: string, scope?: string, length?: Length) =>
  fields.slug({
    name: { ...labelled(key, scope), validation: { isRequired: true, pattern: lengthPattern(length, true) } },
    slug: {
      ...labelled('slug', scope),
      generate: slugFromTitle,
      validation: { length: { max: 80 }, pattern: { regex: SLUG_PATTERN, message: editorText('messages', 'slug') } },
    },
  });

export const corrections = () =>
  fields.array(fields.object({ date: date('date', undefined, true), note: text('note', undefined, { multiline: true, required: true }) }), {
    ...labelled('corrections'),
    itemLabel: (props) => props.fields.date.value ?? '',
  });

export const faq = () =>
  fields.array(fields.object({ question: text('question', undefined, { required: true }), answer: text('answer', undefined, { multiline: true, required: true }) }), {
    ...labelled('faq'),
    itemLabel: (props) => props.fields.question.value,
  });

// Sources citées : référence à la collection « Sources » ou source saisie sur place ({ discriminant, value }).
export const sources = (key = 'sources') =>
  fields.blocks(
    {
      reference: {
        label: collectionLabel('sources'),
        itemLabel: (props) => props.fields.source.value ?? '',
        schema: fields.object({ source: relation('source', 'sources', undefined, true) }),
      },
      ponctuelle: {
        label: label('source'),
        itemLabel: (props) => props.fields.label.value,
        schema: fields.object({
          label: text('label', undefined, { required: true }),
          url: url('url', undefined, true),
          type: pick('sourceType', 'sourceType', SOURCE_TYPE),
          date: date('documentDate'),
          archivedUrl: url('archivedUrl'),
        }),
      },
    },
    labelled(key),
  );

// Champs réservés à la version anglaise (v2) : conservés tels quels, invisibles.
export const reserved = () => ({ lang: fields.ignored(), translationKey: fields.ignored() });
