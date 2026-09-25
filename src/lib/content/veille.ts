// Cache de la veille officielle (data/veille/cache.json), produit par le script veille:fetch (phase 4).
// Le build lit ce cache et ne télécharge jamais rien.
import { z } from '../zod.ts';
import cache from '../../../data/veille/cache.json' with { type: 'json' };

export const veilleCacheSchema = z.strictObject({
  updatedAt: z.string().nullable(),
  items: z.array(
    z.strictObject({
      id: z.string().min(1),
      sourceId: z.string().min(1),
      title: z.string().min(1),
      url: z.url(),
      organisme: z.string().default(''),
      jurisdiction: z.string().min(1),
      publishedAt: z.iso.datetime({ offset: true }),
      summary: z.string().default(''),
    }),
  ),
});

export type VeilleItem = z.output<typeof veilleCacheSchema>['items'][number];

export function veilleItems(): VeilleItem[] {
  const parsed = veilleCacheSchema.safeParse(cache);
  if (!parsed.success) throw new Error('data/veille/cache.json est illisible : relancez « npm run veille:fetch ».');
  return [...parsed.data.items].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
