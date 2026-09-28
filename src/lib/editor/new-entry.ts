// Nouvel article ou guide prérempli (npm run new:article) : identifiant tiré du titre, classement par défaut
// (premiers catégorie, format et thème dans l'ordre d'affichage, premier auteur actif), brouillon daté du jour.
// Tout ce qui reste à écrire porte un marqueur, qui bloque la publication tant qu'il n'est pas remplacé.
import { calendarDateInZone } from '../dates.ts';
import type { Graph } from '../content/graph.ts';
import { slugFromTitle } from '../urls.ts';

export { slugFromTitle };

export type NewArticleOptions = { guide?: boolean; category?: string; format?: string; theme?: string; author?: string };
export type NewArticle = { collection: 'articles' | 'guides'; slug: string; data: Record<string, unknown>; body: string };

const TODO = "[À COMPLÉTER PAR L'AUTEUR]";
export const DEK_TEMPLATE = `${TODO} Chapô : l'essentiel de l'article en une ou deux phrases, de 160 à 300 caractères. Il s'affiche sous le titre, dans les listes et dans les résultats des moteurs de recherche.`;
export const BODY_TEMPLATE = `${TODO} Paragraphe d'introduction : le contexte en deux ou trois phrases, puis ce que l'article explique.\n\n## ${TODO} Premier intertitre\n\n${TODO}\n`;

function first(graph: Graph, collection: 'categories' | 'formats' | 'themes', wanted?: string): string {
  const entries = graph.all(collection).sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id));
  if (wanted) {
    if (!graph.get(collection, wanted)) throw new Error(`« ${wanted} » n'existe pas (${collection} : ${entries.map((e) => e.id).join(', ')}).`);
    return wanted;
  }
  const entry = entries[0];
  if (!entry) throw new Error(`Aucune entrée dans la collection « ${collection} ».`);
  return entry.id;
}

export function newArticle(graph: Graph, title: string, options: NewArticleOptions = {}): NewArticle {
  const clean = title.trim().replace(/\s+/g, ' ');
  if (clean.length < 20 || clean.length > 120) throw new Error(`Le titre doit compter de 20 à 120 caractères (il en compte ${clean.length}).`);
  const collection = options.guide ? 'guides' : 'articles';
  const slug = slugFromTitle(clean);
  if (!slug) throw new Error('Le titre ne contient ni lettre ni chiffre : impossible d’en tirer un identifiant.');
  if (graph.get('articles', slug) || graph.get('guides', slug)) throw new Error(`Un contenu porte déjà l'identifiant « ${slug} » : choisissez un autre titre.`);
  const authors = graph.all('auteurs').filter((a) => a.data.active);
  const author = options.author ?? authors.sort((a, b) => a.id.localeCompare(b.id))[0]?.id;
  if (!author || !graph.get('auteurs', author)) throw new Error(`Auteur introuvable${options.author ? ` : « ${options.author} »` : ''}.`);
  const data: Record<string, unknown> = {
    title: clean,
    dek: DEK_TEMPLATE,
    ...(options.guide ? { level: 'facile' } : { category: first(graph, 'categories', options.category) }),
    ...(options.guide && options.category ? { category: first(graph, 'categories', options.category) } : {}),
    format: first(graph, 'formats', options.format),
    themes: [first(graph, 'themes', options.theme)],
    author,
    status: 'brouillon',
    publishedAt: calendarDateInZone(graph.ctx.now, graph.ctx.timezone),
    publishedTime: '08:00',
  };
  return { collection, slug, data, body: BODY_TEMPLATE };
}
