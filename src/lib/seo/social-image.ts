// Image de partage d'une page : celle choisie par l'auteur (champ seo.socialImage), recadrée en 1200 × 630,
// sinon l'image Open Graph générée au build (/og/<adresse>.png).
import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import { ogImagePath } from './meta.ts';

export async function socialImagePath(seo: { socialImage?: unknown } | undefined, url: string): Promise<string> {
  const source = seo?.socialImage as ImageMetadata | undefined;
  if (!source) return ogImagePath(url);
  const image = await getImage({ src: source, width: 1200, height: 630, fit: 'cover', format: 'jpg', quality: 85 });
  return image.src;
}
