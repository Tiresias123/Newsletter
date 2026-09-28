// Formulaire du thème (config/theme.json) : couleurs en champs hexadécimaux validés (Keystatic n'a pas de
// sélecteur de couleur), styles de puces et de statuts par jetons, polices en liste fermée, tailles en nombres.
// Le script check vérifie ensuite les contrastes. Les clés viennent du fichier, que le schéma Zod fige.
import { fields } from '@keystatic/core';
import theme from '../../../config/theme.json' with { type: 'json' };
import { FONT_FAMILIES } from '../config/schemas.ts';
import * as f from './fields.ts';
import { editorText, label, labelled } from './labels.ts';

const HEX = /^#[0-9A-Fa-f]{6}$/;
const REF = /^(#[0-9A-Fa-f]{6}|white|black|(brand|gold|neutral|semantic|dark)\.[A-Za-z0-9]+)$/;
const OPTIONAL_REF = new RegExp(`^(?:${REF.source.slice(1, -1)})?$`);

const hex = (key: string) => fields.text({ label: label(key), validation: { isRequired: true, pattern: { regex: HEX, message: editorText('messages', 'color') } } });
const ref = (key: string, required: boolean) =>
  fields.text({ label: label(key), validation: { isRequired: required, pattern: { regex: required ? REF : OPTIONAL_REF, message: editorText('messages', 'colorRef') } } });

const variant = () => fields.object({ bg: ref('bg', false), fg: ref('fg', true), border: ref('border', false), dot: ref('dot', false) });
const styleGroup = (keys: string[], withRule: boolean) =>
  fields.object(
    Object.fromEntries(
      keys.map((key) => [key, fields.object({ light: variant(), dark: variant(), ...(withRule ? { rule: ref('rule', false) } : {}) }, { label: label(key) })]),
    ),
  );

const number = (key: string, min: number, max: number, step = 1) =>
  fields.number({ label: label(key), step, validation: { isRequired: true, min, max } });
const whole = (key: string, min: number, max: number) => fields.integer({ label: label(key), validation: { isRequired: true, min, max } });
const numbers = (keys: string[], min: number, max: number) => fields.object(Object.fromEntries(keys.map((key) => [key, number(key, min, max)])));

export function themeSchema() {
  const colors = theme.colors as Record<string, Record<string, string>>;
  return {
    accentGold: f.checkbox('accentGold', true),
    colors: fields.object(
      Object.fromEntries(Object.entries(colors).map(([group, shades]) => [group, fields.object(Object.fromEntries(Object.keys(shades).map((key) => [key, hex(key)])), { label: label(group) })])),
      labelled('colors'),
    ),
    badgeStyles: fields.object(styleGroup(Object.keys(theme.badgeStyles), true).fields, labelled('badgeStyles')),
    statusStyles: fields.object(styleGroup(Object.keys(theme.statusStyles), false).fields, labelled('statusStyles')),
    fonts: fields.object(
      {
        heading: fields.select({ label: label('heading'), options: f.valueOptions('fontHeading', FONT_FAMILIES), defaultValue: 'Manrope' }),
        body: fields.select({ label: label('body'), options: f.valueOptions('fontBody', ['Inter', 'Manrope']), defaultValue: 'Inter' }),
        legalSerif: f.checkbox('legalSerif', true),
      },
      labelled('fonts'),
    ),
    type: fields.object(
      {
        scale: fields.array(fields.number({ label: label('scale'), validation: { isRequired: true, min: 10, max: 96 } }), { ...labelled('scale'), validation: { length: { min: 9, max: 9 } } }),
        articleBodyMobile: number('articleBodyMobile', 14, 22),
        leading: fields.object({ heading: number('heading', 1, 2, 0.05), body: number('body', 1, 2, 0.05), label: number('label', 1, 2, 0.05) }, labelled('leading')),
      },
      labelled('type'),
    ),
    radius: fields.object(numbers(Object.keys(theme.radius), 0, 32).fields, labelled('radius')),
    layout: fields.object(
      {
        container: whole('container', 960, 1600),
        sidebar: whole('sidebar', 240, 480),
        readingWidth: whole('readingWidth', 560, 900),
        header: whole('header', 48, 96),
        headerMobile: whole('headerMobile', 44, 96),
      },
      labelled('layout'),
    ),
  };
}
