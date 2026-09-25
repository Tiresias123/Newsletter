// Briques de schéma réutilisées par les collections et la configuration.
// Formats alignés sur ce qu'enregistre Keystatic : dates « AAAA-MM-JJ », textes vides "",
// relations = identifiants (slugs), listes de blocs { discriminant, value }.
import { z } from '../zod.ts';
import { HALF_HOURS, isCalendarDate, toCalendarDate } from '../dates.ts';
import { ICON_NAMES } from '../icons.ts';
import { LANG, PUBLICATION_STATUS, REVIEW_EVERY, SOURCE_TYPE } from './enums.ts';

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Contexte fourni par Astro (image() résout et optimise les images) ou par les scripts (simple texte).
export type SchemaContext = { image: () => z.ZodType };

// Les champs facultatifs peuvent arriver vides ("" ou null) depuis l'éditeur : on les ramène à undefined.
const emptyToUndefined = (value: unknown) => (value === '' || value === null ? undefined : value);

export const slug = () =>
  z
    .string()
    .max(80)
    .regex(SLUG_PATTERN, {
      error: 'Identifiant invalide : lettres minuscules sans accents, chiffres et tirets seulement (ex. « loi-c-15 »).',
    });

export const slugList = () => z.array(slug()).default([]);

export const optionalSlug = () => z.preprocess(emptyToUndefined, slug().optional());

export const calendarDate = () =>
  z.preprocess(
    toCalendarDate,
    z
      .string({ error: (iss) => (iss.input === undefined ? 'Champ obligatoire manquant.' : 'Date invalide : format attendu AAAA-MM-JJ.') })
      .refine(isCalendarDate, { error: "Date invalide : format attendu AAAA-MM-JJ (ex. 2026-09-24), et le jour doit exister." }),
  );

export const optionalDate = () => z.preprocess(emptyToUndefined, calendarDate().optional());

export const time = () => z.enum(HALF_HOURS as [string, ...string[]]).default('08:00');

export const optionalText = () => z.preprocess((v) => (v === null ? '' : v), z.string().default(''));

export const optionalUrl = () => z.preprocess(emptyToUndefined, z.url().optional());

// Adresse interne (« /dossiers/ ») ou externe (« https://… »).
export const link = () =>
  z.string().refine((v) => v.startsWith('/') || /^https?:\/\//.test(v) || v.startsWith('mailto:'), {
    error: 'Lien invalide : une adresse du site commence par « / », une adresse externe par « https:// ».',
  });

export const icon = () => z.preprocess(emptyToUndefined, z.enum(ICON_NAMES).optional());

export const status = () => z.enum(PUBLICATION_STATUS).default('brouillon');
export const lang = () => z.enum(LANG).default('fr');
export const reviewEvery = () => z.enum(REVIEW_EVERY).default('aucun');

export const corrections = () =>
  z
    .array(
      z.strictObject({
        date: calendarDate(),
        note: z.string().min(1),
      }),
    )
    .default([]);

// Image facultative : vide ou absente → pas d'image (une couverture sera générée).
export const optionalImage = (ctx: SchemaContext) => z.preprocess(emptyToUndefined, ctx.image().optional());

export const cover = (ctx: SchemaContext) =>
  z
    .strictObject({
      src: optionalImage(ctx),
      alt: optionalText(),
      credit: optionalText(),
      creditUrl: optionalUrl(),
    })
    .superRefine((value, check) => {
      if (value.src === undefined) return;
      if (!value.alt) check.addIssue({ code: 'custom', path: ['alt'], message: "Texte alternatif obligatoire : décrivez l'image pour les lecteurs d'écran." });
      if (!value.credit) check.addIssue({ code: 'custom', path: ['credit'], message: "Crédit obligatoire : indiquez l'auteur ou la source de l'image." });
    })
    .optional();

export const seo = (ctx: SchemaContext) =>
  z
    .strictObject({
      title: optionalText().pipe(z.string().max(70)),
      description: optionalText().pipe(z.string().max(160)),
      canonical: optionalUrl(),
      socialImage: optionalImage(ctx),
      noindex: z.boolean().default(false),
    })
    .optional();

// Source citée : référence à la collection « sources » ou source ponctuelle saisie sur place.
const sourceReference = z.strictObject({
  discriminant: z.literal('reference'),
  value: z.strictObject({ source: slug() }),
});
const sourceInline = z.strictObject({
  discriminant: z.literal('ponctuelle'),
  value: z.strictObject({
    label: z.string().min(1),
    url: z.url(),
    type: z.enum(SOURCE_TYPE),
    date: optionalDate(),
    archivedUrl: optionalUrl(),
  }),
});

export type CitedSource =
  | { kind: 'reference'; source: string }
  | { kind: 'ponctuelle'; label: string; url: string; type: (typeof SOURCE_TYPE)[number]; date?: string; archivedUrl?: string };

export const sources = () =>
  z
    .array(
      z.discriminatedUnion('discriminant', [sourceReference, sourceInline]).transform(
        (item): CitedSource => (item.discriminant === 'reference' ? { kind: 'reference', source: item.value.source } : { kind: 'ponctuelle', ...item.value }),
      ),
    )
    .default([]);
