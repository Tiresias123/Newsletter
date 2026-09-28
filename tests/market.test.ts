import { describe, expect, it } from 'vitest';
import { COINGECKO_API, fetchMarket, sparklinePath } from '../src/lib/market/coingecko.ts';

const assets = [
  { id: 'bitcoin', symbol: 'BTC', label: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', label: 'Ether' },
  { id: 'inconnu', symbol: 'XXX', label: 'Inconnu' },
];

describe('données de marché', () => {
  it('demande les cours en dollars canadiens avec la clé Demo, dans l’ordre de la configuration', async () => {
    const calls: Array<{ url: string; headers: Headers }> = [];
    const fake = (async (url: string, init?: RequestInit) => {
      calls.push({ url, headers: new Headers(init?.headers) });
      return Response.json([
        { id: 'ethereum', current_price: 3512.4, price_change_percentage_24h: -0.43, sparkline_in_7d: { price: [3400, 3500] } },
        { id: 'bitcoin', current_price: 84146, price_change_percentage_24h: 1.2, sparkline_in_7d: { price: [80000, 81000, 84146] } },
      ]);
    }) as typeof fetch;
    const data = await fetchMarket(assets, 'cle-demo', new Date('2026-09-28T18:10:00Z'), fake);
    expect(calls[0]?.url.startsWith(`${COINGECKO_API}/coins/markets?`)).toBe(true);
    expect(new URL(calls[0]?.url ?? '').searchParams.get('vs_currency')).toBe('cad');
    expect(new URL(calls[0]?.url ?? '').searchParams.get('ids')).toBe('bitcoin,ethereum,inconnu');
    expect(new URL(calls[0]?.url ?? '').searchParams.get('precision')).toBe('full');
    expect(calls[0]?.headers.get('x-cg-demo-api-key')).toBe('cle-demo');
    expect(data.quotes.map((q) => [q.symbol, q.price, q.change24h])).toEqual([
      ['BTC', 84146, 1.2],
      ['ETH', 3512.4, -0.43],
    ]);
  });

  it('échoue si CoinGecko refuse ou ne renvoie aucun cours : le module est alors masqué', async () => {
    await expect(fetchMarket(assets, 'k', new Date(), (async () => new Response('', { status: 429 })) as typeof fetch)).rejects.toThrow('HTTP 429');
    await expect(fetchMarket(assets, 'k', new Date(), (async () => Response.json([])) as typeof fetch)).rejects.toThrow('aucun cours');
    // Clé absente, mal transmise ou d'un autre forfait : le journal du build le dit clairement.
    const refused = (async () => Response.json({ status: { error_code: 10002, error_message: 'API Key Missing' } }, { status: 401 })) as typeof fetch;
    await expect(fetchMarket(assets, 'k', new Date(), refused)).rejects.toThrow('HTTP 401 (code 10002), clé refusée');
  });

  it('trace une courbe sans axe, bornée à sa boîte', () => {
    const path = sparklinePath([1, 3, 2], 200, 48);
    expect(path).toBe('M0.0 48.0 L100.0 0.0 L200.0 24.0');
    expect(sparklinePath([5], 200, 48)).toBe('');
    expect(sparklinePath(Array.from({ length: 168 }, (_, i) => i), 200, 48).split(' L')).toHaveLength(57);
  });
});
