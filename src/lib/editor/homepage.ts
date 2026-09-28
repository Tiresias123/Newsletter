// Sections de la page d'accueil (config/homepage.json) : une liste réordonnable de blocs typés, enregistrés
// { discriminant, value } comme le lit src/lib/config/schemas.ts. Un formulaire par type de section.
import { fields } from '@keystatic/core';
import ads from '../../../config/ads.json' with { type: 'json' };
import * as f from './fields.ts';
import { editorText, labelled } from './labels.ts';

const BACKGROUNDS = ['default', 'brand', 'muted'] as const;
const LAYOUTS = ['featured', 'grid', 'list', 'compact', 'horizontal'] as const;

const common = () => ({
  enabled: f.checkbox('enabled', true),
  title: f.text('title'),
  subtitle: f.text('subtitle'),
  background: f.select('background', 'background', BACKGROUNDS, 'default'),
});
const count = (defaultValue: number) => f.integer('count', undefined, { defaultValue, min: 1, max: 40 });
const cta = () => fields.object({ label: f.text('label', 'cta'), url: f.link('url', 'cta', false) }, labelled('cta'));
const selection = (collection: string) => ({
  source: f.select('source', 'source', ['auto', 'manual'], 'auto'),
  manualSelection: f.relations('manualSelection', collection),
});
const filters = () =>
  fields.object(
    {
      category: f.relation('category', 'categories'),
      format: f.relation('format', 'formats'),
      themes: f.relations('themes', 'themes', 'filters'),
      jurisdictions: f.relations('jurisdictions', 'juridictions', 'filters'),
      tags: f.textList('tags', 'filters'),
    },
    labelled('filters'),
  );

const section = (type: string, schema: Record<string, unknown>) => ({
  label: editorText('valeurs', `sectionType.${type}`),
  itemLabel: (props: { fields: { title: { value: string } } }) => `${editorText('valeurs', `sectionType.${type}`)}${props.fields.title.value ? ` : ${props.fields.title.value}` : ''}`,
  schema: fields.object({ ...common(), ...(schema as Record<string, never>) }),
});

export function homepageSchema() {
  const partners = [{ label: editorText('valeurs', 'none'), value: '' }, ...ads.partners.map((p) => ({ label: p.name, value: p.id }))];
  return {
    sections: fields.blocks(
      {
        'hero-selection': section('hero-selection', selection('articles')),
        'content-block': section('content-block', { ...selection('articles'), filters: filters(), count: count(6), layout: f.select('layout', 'layout', LAYOUTS, 'grid'), cta: cta() }),
        'dossiers-strip': section('dossiers-strip', { ...selection('dossiers'), count: count(4), cta: cta() }),
        essentials: section('essentials', { ...selection('guides'), count: count(4), cta: cta() }),
        watchlist: section('watchlist', { count: count(6), cta: cta() }),
        'veille-latest': section('veille-latest', { count: count(8), cta: cta() }),
        'lexique-spotlight': section('lexique-spotlight', { ...selection('lexique'), count: count(3), cta: cta() }),
        'market-brief': section('market-brief', {}),
        'trending-assets': section('trending-assets', { count: count(6) }),
        'most-read': section('most-read', { manualSelection: f.relations('manualSelection', 'articles'), count: count(5) }),
        'newsletter-cta': section('newsletter-cta', { list: f.newsletterList() }),
        'partner-block': section('partner-block', { partnerId: fields.select({ ...labelled('partnerId'), options: partners, defaultValue: '' }) }),
        'custom-html': section('custom-html', { content: f.text('content', 'custom-html', { multiline: true }) }),
      },
      labelled('sections', 'homepage'),
    ),
  };
}
