// Cours de marché (ARCHITECTURE 12.3) : récupérés au build auprès de CoinGecko (API « Demo », clé de build
// COINGECKO_API_KEY), en dollars canadiens, puis inscrits dans le HTML avec leur heure. Aucun appel depuis le
// navigateur, aucune route serveur. En cas d'échec, le module est simplement absent de la page.

export const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export type Quote = {
  id: string;
  symbol: string;
  label: string;
  // Cours en dollars canadiens et variation sur 24 heures, en points de pourcentage.
  price: number;
  change24h: number | null;
  // Cours horaires des sept derniers jours (courbe des cartes).
  sparkline: number[];
};

export type MarketData = { fetchedAt: Date; quotes: Quote[] };
export type MarketAsset = { id: string; symbol: string; label: string };

type MarketRow = { id?: unknown; current_price?: unknown; price_change_percentage_24h?: unknown; sparkline_in_7d?: { price?: unknown } };

export async function fetchMarket(assets: readonly MarketAsset[], apiKey: string, now = new Date(), fetchImpl: typeof fetch = fetch): Promise<MarketData> {
  // price_change_percentage_24h figure toujours dans la réponse : aucun paramètre de plus.
  const params = new URLSearchParams({ vs_currency: 'cad', ids: assets.map((a) => a.id).join(','), sparkline: 'true', precision: '2' });
  const response = await fetchImpl(`${COINGECKO_API}/coins/markets?${params}`, {
    headers: { accept: 'application/json', 'x-cg-demo-api-key': apiKey },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    // Codes de CoinGecko : 10002 (clé absente ou mal transmise), 10010 et 10011 (clé d'un autre forfait).
    const body = (await response.json().catch(() => ({}))) as { status?: { error_code?: unknown } };
    const code = typeof body.status?.error_code === 'number' ? body.status.error_code : undefined;
    const keyRefused = response.status === 401 || (code !== undefined && [10002, 10010, 10011].includes(code));
    throw new Error(`CoinGecko : HTTP ${response.status}${code ? ` (code ${code})` : ''}${keyRefused ? ', clé refusée : vérifiez COINGECKO_API_KEY (clé « Demo »)' : ''}`);
  }
  const rows = (await response.json()) as unknown;
  if (!Array.isArray(rows)) throw new Error('CoinGecko : réponse inattendue');
  const byId = new Map((rows as MarketRow[]).map((row) => [row.id, row]));
  const quotes = assets.flatMap((asset): Quote[] => {
    const row = byId.get(asset.id);
    if (!row || typeof row.current_price !== 'number') return [];
    const change = row.price_change_percentage_24h;
    const points = Array.isArray(row.sparkline_in_7d?.price) ? (row.sparkline_in_7d.price as unknown[]).filter((p): p is number => typeof p === 'number') : [];
    return [{ ...asset, price: row.current_price, change24h: typeof change === 'number' ? change : null, sparkline: points }];
  });
  if (quotes.length === 0) throw new Error('CoinGecko : aucun cours reçu');
  return { fetchedAt: now, quotes };
}

// Tracé SVG d'une courbe (points relatifs dans une boîte width × height), sans axe.
export function sparklinePath(points: readonly number[], width: number, height: number): string {
  if (points.length < 2) return '';
  // Au plus une soixantaine de points : la courbe reste lisible et le HTML léger.
  const step = Math.max(1, Math.ceil(points.length / 60));
  const sampled = points.filter((_, i) => i % step === 0 || i === points.length - 1);
  const min = Math.min(...sampled);
  const range = Math.max(...sampled) - min || 1;
  return sampled
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${((i / (sampled.length - 1)) * width).toFixed(1)} ${(height - ((p - min) / range) * height).toFixed(1)}`)
    .join(' ');
}
