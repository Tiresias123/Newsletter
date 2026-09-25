// Règles de publication, appliquées partout (pages, listes, flux, plan du site, recherche, infolettre).
import { zonedInstant } from './dates.ts';

export type VisibilityContext = {
  now: Date;
  // Aperçu (développement, branches) : brouillons et contenus programmés visibles, avec un bandeau.
  includeDrafts: boolean;
  timezone: string;
};

export type PublicationState = 'publie' | 'programme' | 'brouillon' | 'archive';

export type Visibility = {
  state: PublicationState;
  // La page existe (production : publiée, archivée ou programmée échue).
  visible: boolean;
  // Le contenu figure dans les listes, flux et sections (un contenu archivé n'y figure plus).
  listed: boolean;
  // Visible seulement parce qu'on est en aperçu : afficher le bandeau « Brouillon » ou « Programmé ».
  previewOnly: boolean;
  instant?: Date;
};

type Publishable = { status: string; publishedAt?: string; publishedTime?: string };

export function publicationInstant(data: Publishable, timezone: string): Date | undefined {
  return data.publishedAt ? zonedInstant(data.publishedAt, data.publishedTime ?? '00:00', timezone) : undefined;
}

export function visibilityOf(data: Publishable, ctx: VisibilityContext): Visibility {
  const instant = publicationInstant(data, ctx.timezone);
  const state = data.status as PublicationState;
  const due = instant === undefined || instant.getTime() <= ctx.now.getTime();
  const published = state === 'publie' || (state === 'programme' && due);
  if (published) return { state, visible: true, listed: true, previewOnly: false, instant };
  if (state === 'archive') return { state, visible: true, listed: false, previewOnly: false, instant };
  // Brouillon, ou programmé pas encore échu.
  return { state, visible: ctx.includeDrafts, listed: ctx.includeDrafts, previewOnly: ctx.includeDrafts, instant };
}
