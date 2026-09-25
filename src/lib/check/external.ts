// Liens externes (option --liens-externes, utilisée par le rapport hebdomadaire) : chaque adresse est
// interrogée une fois, quelques-unes à la fois. Une réponse 2xx ou 3xx suivie jusqu'au bout est jugée valide.

export type ExternalResult = { url: string; ok: boolean; detail: string };

const USER_AGENT = 'Mozilla/5.0 (compatible; verification-des-liens)';

async function probe(url: string, timeoutMs: number): Promise<ExternalResult> {
  let detail = 'adresse injoignable';
  // HEAD d'abord ; certains sites le refusent (403, 405, 501) : on retente alors en GET.
  for (const method of ['HEAD', 'GET'] as const) {
    try {
      const response = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs), headers: { 'user-agent': USER_AGENT } });
      await response.body?.cancel();
      if (response.ok) return { url, ok: true, detail: String(response.status) };
      detail = `réponse ${response.status}`;
      if (![403, 405, 501].includes(response.status)) break;
    } catch (error) {
      detail = error instanceof Error && error.name === 'TimeoutError' ? `aucune réponse en ${timeoutMs / 1000} s` : 'adresse injoignable';
    }
  }
  return { url, ok: false, detail };
}

export async function checkExternalLinks(urls: Iterable<string>, { concurrency = 6, timeoutMs = 15000 } = {}): Promise<ExternalResult[]> {
  const queue = [...new Set(urls)];
  const results: ExternalResult[] = [];
  const worker = async () => {
    for (let url = queue.shift(); url !== undefined; url = queue.shift()) results.push(await probe(url, timeoutMs));
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
  return results;
}
