// Cache de la veille officielle (data/veille/cache.json), produit par le script veille:fetch.
// Le build lit ce cache et ne télécharge jamais rien.
import { z } from '../zod.ts';
import cache from '../../../data/veille/cache.json' with { type: 'json' };

export const VEILLE_STATUS = ['ok', 'erreur', 'illisible', 'bloque'] as const;
export type VeilleStatus = (typeof VEILLE_STATUS)[number];

const item = z.strictObject({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  title: z.string().min(1),
  url: z.url(),
  organisme: z.string().default(''),
  jurisdiction: z.string().min(1),
  publishedAt: z.iso.datetime({ offset: true }),
  summary: z.string().default(''),
});

// État de chaque source à la dernière collecte : « erreur » (réponse en échec), « illisible » (page HTML ou
// XML invalide, souvent un pare-feu), « bloque » (robots.txt). `since` : depuis quand cet état dure.
const health = z.strictObject({ status: z.enum(VEILLE_STATUS), since: z.iso.datetime({ offset: true }), detail: z.string().default('') });

export const veilleCacheSchema = z.strictObject({
  updatedAt: z.iso.datetime({ offset: true }).nullable(),
  sources: z.record(z.string(), health).default({}),
  items: z.array(item),
});

export type VeilleCache = z.output<typeof veilleCacheSchema>;
export type VeilleHealth = z.output<typeof health>;
export type VeilleItem = z.output<typeof veilleCacheSchema>['items'][number];

function readCache(): VeilleCache {
  const parsed = veilleCacheSchema.safeParse(cache);
  if (!parsed.success) throw new Error('data/veille/cache.json est illisible : relancez « npm run veille:fetch ».');
  return parsed.data;
}

export function veilleItems(): VeilleItem[] {
  return [...readCache().items].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

// État de santé des sources à la dernière collecte (rapport « À vérifier »).
export function veilleHealth(): Record<string, VeilleHealth> {
  return readCache().sources;
}
