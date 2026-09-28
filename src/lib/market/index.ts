// Données de marché du build (ARCHITECTURE 12.3) : un seul appel à CoinGecko par build, gardé dix minutes en
// développement. Sans clé (COINGECKO_API_KEY), sans module actif ou en cas d'échec : rien, et les blocs de
// marché sont absents du HTML, sans décalage de mise en page.
import { getConfig, type SiteConfig } from '../config/index.ts';
import { fetchMarket, type MarketData } from './coingecko.ts';

const TTL_MS = 10 * 60_000;
let cached: { at: number; data: Promise<MarketData | undefined> } | undefined;

// Vrai si le bandeau des cours ou une section de marché de l'accueil est activé.
export function marketWanted({ ticker, homepage }: Pick<SiteConfig, 'ticker' | 'homepage'> = getConfig()): boolean {
  return ticker.enabled || homepage.sections.some((s) => s.enabled && (s.type === 'market-brief' || s.type === 'trending-assets'));
}

// Clé de build : variable d'environnement (Cloudflare) ou fichier .env local (lu par Astro, pas par Node).
export const coingeckoKey = (): string | undefined =>
  process.env.COINGECKO_API_KEY || (import.meta as { env?: Record<string, string | undefined> }).env?.COINGECKO_API_KEY || undefined;

export function getMarket(): Promise<MarketData | undefined> {
  const key = coingeckoKey();
  if (!marketWanted() || !key) return Promise.resolve(undefined);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;
  const assets = getConfig().ticker.assets.filter((asset) => asset.enabled);
  const data = fetchMarket(assets, key).catch((error: unknown) => {
    console.warn(`Données de marché indisponibles, module masqué : ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  });
  cached = { at: Date.now(), data };
  return data;
}
