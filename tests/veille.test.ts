import { describe, expect, it } from 'vitest';
import { veilleOrigin } from '../src/lib/content/cards.ts';
import type { Graph } from '../src/lib/content/graph.ts';
import { createCollector } from '../src/lib/veille/collect.ts';
import { applyOutcome, canonicalUrl, emptyCache, matchesKeywords, prune, serializeCache, sourceState, UNDATED } from '../src/lib/veille/merge.ts';
import { decodeFeed, htmlToText, parseFeed, parseFeedDate, UnreadableFeedError } from '../src/lib/veille/parse.ts';
import { robotsAllows } from '../src/lib/veille/robots.ts';
import { formatDate } from '../src/lib/format.ts';

const TZ = 'America/Toronto';
const BASE = 'https://www.exemple.gc.ca/fils/communiques.xml';

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>Communiqués</title>
<item><title><![CDATA[Avis & consultation : « plateformes »]]></title><link>/fr/nouvelles/2026/09/avis.html?utm_source=rss</link>
<description>&lt;p&gt;R&amp;eacute;sum&amp;eacute; &lt;strong&gt;important&lt;/strong&gt;&amp;nbsp;!&lt;/p&gt;</description>
<pubDate>Mon, 28 Sep 2026 10:30:00 EDT</pubDate></item>
<item><title>Sans lien</title></item>
<item><title>Deuxième</title><guid isPermaLink="true">https://www.exemple.gc.ca/fr/deux.html</guid><dc:date>2026-09-25</dc:date></item>
</channel></rss>`;

const ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"><title>Nouvelles</title>
<entry><title type="html">Budget &amp;amp; cryptoactifs</title><link rel="alternate" href="https://www.canada.ca/fr/ministere-finances/nouvelles/2026/09/budget.html"/>
<link rel="enclosure" href="https://www.canada.ca/x.pdf"/><published>2026-09-27T14:00:00-04:00</published><summary type="html">&lt;p&gt;Texte&lt;/p&gt;</summary></entry>
</feed>`;

describe('lecture des fils', () => {
  it('lit un fil RSS : texte brut, liens absolus, dates RFC 822 et entrées incomplètes écartées', () => {
    const entries = parseFeed(RSS, BASE, TZ);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      title: 'Avis & consultation : « plateformes »',
      url: 'https://www.exemple.gc.ca/fr/nouvelles/2026/09/avis.html?utm_source=rss',
      summary: 'Résumé important !',
    });
    expect(entries[0]?.published?.toISOString()).toBe('2026-09-28T14:30:00.000Z');
    expect(entries[1]?.published?.toISOString()).toBe('2026-09-25T04:00:00.000Z');
  });

  it('lit un fil Atom : lien « alternate », titre HTML, date avec décalage', () => {
    const [entry] = parseFeed(ATOM, BASE, TZ);
    expect(entry).toMatchObject({ title: 'Budget & cryptoactifs', url: 'https://www.canada.ca/fr/ministere-finances/nouvelles/2026/09/budget.html', summary: 'Texte' });
    expect(entry?.published?.toISOString()).toBe('2026-09-27T18:00:00.000Z');
  });

  it('lit un fil RSS 1.0 (RDF) et un JSON Feed', () => {
    const rdf = '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/" xmlns:dc="http://purl.org/dc/elements/1.1/"><item rdf:about="https://a.ca/1"><title>Un</title><link>https://a.ca/1</link><dc:date>2026-09-20T09:00:00Z</dc:date></item></rdf:RDF>';
    expect(parseFeed(rdf, BASE, TZ)).toMatchObject([{ title: 'Un', url: 'https://a.ca/1' }]);
    const json = JSON.stringify({ version: 'https://jsonfeed.org/version/1.1', items: [{ id: '1', url: 'https://a.ca/j', title: 'Json', date_published: '2026-09-21T10:00:00-04:00' }] });
    expect(parseFeed(json, BASE, TZ)).toMatchObject([{ title: 'Json', url: 'https://a.ca/j' }]);
  });

  it('refuse une page HTML (pare-feu) ou un XML invalide', () => {
    expect(() => parseFeed('<!DOCTYPE html><html><body>Accès refusé</body></html>', BASE, TZ)).toThrow(UnreadableFeedError);
    expect(() => parseFeed('<rss><channel></rss>', BASE, TZ)).toThrow(UnreadableFeedError);
    expect(() => parseFeed('{"pas": "un fil"}', BASE, TZ)).toThrow(UnreadableFeedError);
  });

  it('comprend les dates françaises et les dates sans fuseau', () => {
    expect(parseFeedDate('lun., 28 sept. 2026 10:30', TZ)?.toISOString()).toBe('2026-09-28T14:30:00.000Z');
    expect(parseFeedDate('28 septembre 2026', TZ)?.toISOString()).toBe('2026-09-28T04:00:00.000Z');
    expect(parseFeedDate('2026-01-15T08:00:00', TZ)?.toISOString()).toBe('2026-01-15T13:00:00.000Z');
    expect(parseFeedDate('2026-01-15T08:00:00+0100', TZ)?.toISOString()).toBe('2026-01-15T07:00:00.000Z');
    expect(parseFeedDate('n’importe quoi', TZ)).toBeUndefined();
    expect(htmlToText('<p>A&nbsp;: <em>b</em></p>')).toBe('A : b');
  });

  it('lit les formes de date moins courantes : commentaire, année à deux chiffres, fuseaux, « 1er »', () => {
    const iso = (value: string) => parseFeedDate(value, TZ)?.toISOString();
    expect(iso('Mon, 28 Sep 2026 10:30:00 +0000 (UTC)')).toBe('2026-09-28T10:30:00.000Z');
    expect(iso('Tue, 29 Sep 2026 02:00:00 +0000 (UTC)')).toBe('2026-09-29T02:00:00.000Z');
    expect(iso('Mon, 28 Sep 26 10:30:00 EDT')).toBe('2026-09-28T14:30:00.000Z');
    expect(iso('Mon, 28 Sep 2026 10:30:00 A')).toBe('2026-09-28T10:30:00.000Z');
    expect(iso('Monday, 28 September 2026 10:30:00 GMT')).toBe('2026-09-28T10:30:00.000Z');
    expect(iso('2026-09-28T10:30:00z')).toBe('2026-09-28T10:30:00.000Z');
    expect(iso('1er octobre 2026')).toBe('2026-10-01T04:00:00.000Z');
    expect(iso('28 septembre 2026 à 10 h 30 HAE')).toBe('2026-09-28T14:30:00.000Z');
    expect(iso('Publié le 28 septembre 2026')).toBe('2026-09-28T04:00:00.000Z');
    expect(iso('31 septembre 2026')).toBeUndefined();
  });

  it('ignore les éléments des extensions (atom:link, media:title) et suit xml:base', () => {
    const rss = `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/"><channel><item>
<atom:link rel="enclosure" href="https://a.ca/photo.jpg"/><media:title>Photo : ministre</media:title><media:description>Crédit photo</media:description>
<title>Consultation sur les cryptoactifs</title><link>https://a.ca/consultation.html</link><description>Texte du communiqué</description></item></channel></rss>`;
    expect(parseFeed(rss, BASE, TZ)).toMatchObject([{ title: 'Consultation sur les cryptoactifs', url: 'https://a.ca/consultation.html', summary: 'Texte du communiqué' }]);
    const atom = '<feed xmlns="http://www.w3.org/2005/Atom" xml:base="https://www.canada.ca/fr/"><entry xml:base="nouvelles/"><title>X</title><link href="x.html"/></entry></feed>';
    expect(parseFeed(atom, 'https://api.io.canada.ca/io-server/gc/news/fr/fil.atom', TZ)[0]?.url).toBe('https://www.canada.ca/fr/nouvelles/x.html');
  });

  it('sépare les blocs du résumé et ignore scripts et styles', () => {
    expect(htmlToText('<p>Le ministère annonce une consultation.</p><p>Les détails suivent</p>')).toBe('Le ministère annonce une consultation. Les détails suivent');
    expect(htmlToText('ligne un<br>ligne deux')).toBe('ligne un ligne deux');
    expect(htmlToText('<style>.x{color:red}</style><p>Texte</p><script>alert(1)</script>')).toBe('Texte');
    const summary = htmlToText('<p>Consultation sur les jetons</p><p>stables</p>');
    expect(matchesKeywords({ title: 'Avis', url: 'https://a.ca', summary }, ['jeton stable'])).toBe(true);
  });

  it('décode un fil selon son encodage : Latin-1 annoncé ou déclaré, UTF-8 mal annoncé', () => {
    const latin1 = (text: string) => Uint8Array.from([...text].map((c) => c.charCodeAt(0)));
    const xml = '<?xml version="1.0" encoding="ISO-8859-1"?><rss version="2.0"><channel><item><title>Réglementation des actifs numériques</title><link>https://a.ca/r</link></item></channel></rss>';
    expect(parseFeed(decodeFeed(latin1(xml), 'text/xml'), BASE, TZ)[0]?.title).toBe('Réglementation des actifs numériques');
    expect(decodeFeed(latin1('<rss>é</rss>'), 'application/rss+xml; charset=ISO-8859-1')).toBe('<rss>é</rss>');
    expect(decodeFeed(Uint8Array.from([0x92]), 'text/xml; charset=iso-8859-1')).toBe('’');
    // En-tête Latin-1 pour un fichier en UTF-8 : l'UTF-8 valide l'emporte.
    expect(decodeFeed(new TextEncoder().encode('<rss>é</rss>'), 'text/xml; charset=ISO-8859-1')).toBe('<rss>é</rss>');
    expect(decodeFeed(Uint8Array.from([0xef, 0xbb, 0xbf, 0x3c, 0x61, 0x3e]))).toBe('<a>');
  });
});

describe('robots.txt', () => {
  const robots = 'User-agent: *\nDisallow: /fr/recherche\nAllow: /fr/recherche/rss\nDisallow: /*.pdf$\n\nUser-agent: VeilleReglementaireBot\nUser-agent: AutreBot\nDisallow: /prive/\n';
  it('applique le groupe du robot, sinon « * », et la règle la plus longue', () => {
    expect(robotsAllows(robots, 'VeilleReglementaireBot/1.0', '/fr/recherche')).toBe(true);
    expect(robotsAllows(robots, 'VeilleReglementaireBot/1.0', '/prive/x')).toBe(false);
    expect(robotsAllows(robots, 'Inconnu', '/fr/recherche?q=1')).toBe(false);
    expect(robotsAllows(robots, 'Inconnu', '/fr/recherche/rss.xml')).toBe(true);
    expect(robotsAllows(robots, 'Inconnu', '/doc.pdf')).toBe(false);
    expect(robotsAllows('', 'Inconnu', '/tout')).toBe(true);
  });

  it('fusionne les groupes applicables, ignore un agent vide ou partiel, compare des chemins encodés', () => {
    const split = 'User-agent: *\nDisallow: /admin/\n\nUser-agent: Googlebot\nDisallow: /prive/\n\nUser-agent: *\nDisallow: /rss/\n';
    expect(robotsAllows(split, 'VeilleReglementaireBot', '/rss/fil.xml')).toBe(false);
    expect(robotsAllows(split, 'VeilleReglementaireBot', '/admin/x')).toBe(false);
    expect(robotsAllows(split, 'VeilleReglementaireBot', '/prive/x')).toBe(true);
    const partial = 'User-agent:\nDisallow:\n\nUser-agent: ca\nAllow: /\n\nUser-agent: *\nDisallow: /fils/\n';
    expect(robotsAllows(partial, 'VeilleReglementaireBot', '/fils/a.xml')).toBe(false);
    const encoded = 'User-agent: *\nDisallow: /fr/réglementation/\nDisallow: /%7eprive/\n';
    expect(robotsAllows(encoded, 'VeilleReglementaireBot', new URL('https://a.ca/fr/réglementation/fil.xml').pathname)).toBe(false);
    expect(robotsAllows(encoded, 'VeilleReglementaireBot', '/~prive/a')).toBe(false);
    // Deux groupes au nom du robot : leurs règles s'additionnent, et le groupe « * » ne s'applique plus.
    const own = 'User-agent: VeilleReglementaireBot\nDisallow: /a/\n\nUser-agent: *\nDisallow: /\n\nUser-agent: veillereglementairebot/1.0\nDisallow: /b/\n';
    expect(robotsAllows(own, 'VeilleReglementaireBot', '/b/x')).toBe(false);
    expect(robotsAllows(own, 'VeilleReglementaireBot', '/c/x')).toBe(true);
  });
});

describe('collecte', () => {
  const routes = (map: Record<string, () => Response>) =>
    (async (input: string | URL | Request) => {
      const route = map[String(input)];
      if (!route) throw new TypeError('fetch failed');
      return route();
    }) as typeof fetch;
  // Réponse coupée après les en-têtes (connexion perdue pendant la lecture du corps).
  const cut = () =>
    new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('User-agent: *'));
          controller.error(new TypeError('terminated'));
        },
      }),
    );
  const feed = '<rss version="2.0"><channel><item><title>Un</title><link>https://b.ca/1</link></item></channel></rss>';

  it('isole une source dont le robots.txt ou le fil est coupé, en panne ou injoignable', async () => {
    const collect = createCollector({
      agent: 'VeilleReglementaireBot/1.0',
      timeoutMs: 5000,
      timeZone: TZ,
      fetch: routes({
        'https://a.ca/robots.txt': cut,
        'https://b.ca/robots.txt': () => new Response('', { status: 404 }),
        'https://b.ca/fil.xml': () => new Response(feed, { headers: { 'content-type': 'application/rss+xml' } }),
        'https://c.ca/robots.txt': () => new Response('User-agent: *\nAllow: /'),
        'https://c.ca/fil.xml': cut,
        'https://d.ca/robots.txt': () => new Response('', { status: 503 }),
        'https://f.ca/robots.txt': () => new Response('User-agent: VeilleReglementaireBot\nDisallow: /'),
      }),
    });
    expect(await collect('https://a.ca/fil.xml')).toEqual({ status: 'erreur', detail: 'robots.txt : terminated' });
    expect(await collect('https://b.ca/fil.xml')).toMatchObject({ status: 'ok', entries: [{ title: 'Un' }], http: 200 });
    expect(await collect('https://c.ca/fil.xml')).toEqual({ status: 'erreur', detail: 'terminated' });
    expect(await collect('https://d.ca/fil.xml')).toEqual({ status: 'erreur', detail: 'robots.txt : HTTP 503' });
    expect(await collect('https://e.ca/fil.xml')).toEqual({ status: 'erreur', detail: 'robots.txt : fetch failed' });
    expect(await collect('https://f.ca/fil.xml')).toMatchObject({ status: 'bloque' });
  });
});

describe('cache de la veille', () => {
  const source = { id: 'finances', organisme: 'finances-canada', jurisdiction: 'canada', keywords: [] as string[], staleDays: 30 };
  const now = new Date('2026-09-28T16:00:00Z');
  const entry = (title: string, url: string, published = '2026-09-27T14:00:00Z') => ({ title, url, published: new Date(published), summary: '' });

  it('dédoublonne sur l’adresse canonique et sur le titre du même jour, et note l’état des sources', () => {
    const cache = emptyCache();
    const added = applyOutcome(
      cache,
      source,
      {
        status: 'ok',
        entries: [
          entry('Budget 2026', 'https://www.canada.ca/fr/budget.html?utm_source=rss#haut'),
          entry('Budget 2026', 'https://www.canada.ca/fr/budget.html'),
          entry('Budget  2026', 'https://www.canada.ca/fr/budget-bis.html'),
          entry('Autre', 'https://www.canada.ca/fr/autre.html', '2026-09-28T02:00:00Z'),
        ],
      },
      now,
      TZ,
      12,
    );
    expect(added).toBe(2);
    expect(cache.items.map((i) => i.url)).toEqual(['https://www.canada.ca/fr/budget.html', 'https://www.canada.ca/fr/autre.html']);
    // Date locale : 22 h le 27 septembre à Montréal.
    expect(cache.items[1]?.publishedAt).toBe('2026-09-27T22:00:00-04:00');
    expect(cache.sources.finances).toEqual({ status: 'ok', since: '2026-09-28T12:00:00-04:00', detail: '' });
    expect(canonicalUrl('https://WWW.Canada.ca/a?b=1&utm_medium=x&fbclid=y#z')).toBe('https://www.canada.ca/a?b=1');
  });

  it('garde les publications en cache quand la source échoue, et ne change le fichier que si nécessaire', () => {
    const cache = emptyCache();
    applyOutcome(cache, source, { status: 'ok', entries: [entry('Budget', 'https://a.ca/b')] }, now, TZ, 12);
    const before = structuredClone(cache);
    applyOutcome(cache, source, { status: 'erreur', detail: 'HTTP 503' }, new Date('2026-09-29T16:00:00Z'), TZ, 12);
    expect(cache.items).toHaveLength(1);
    expect(cache.sources.finances).toMatchObject({ status: 'erreur', detail: 'HTTP 503', since: '2026-09-29T12:00:00-04:00' });
    expect(serializeCache(before, cache, now, TZ).changed).toBe(true);
    const again = structuredClone(cache);
    applyOutcome(again, source, { status: 'erreur', detail: 'HTTP 503' }, new Date('2026-09-30T16:00:00Z'), TZ, 12);
    expect(serializeCache(cache, again, now, TZ).changed).toBe(false);
  });

  it('filtre par mots-clés sans tenir compte des accents, et retire ce qui dépasse la rétention', () => {
    expect(matchesKeywords(entry('Projet de loi sur les actifs numériques', 'https://a.ca'), ['actif numerique'])).toBe(true);
    expect(matchesKeywords(entry('Budget des dépenses', 'https://a.ca'), ['crypto', 'stablecoin'])).toBe(false);
    const cache = emptyCache();
    applyOutcome(cache, source, { status: 'ok', entries: [entry('Vieux', 'https://a.ca/v', '2025-08-01T12:00:00Z'), entry('Récent', 'https://a.ca/r')] }, now, TZ, 12);
    expect(cache.items.map((i) => i.title)).toEqual(['Récent']);
    cache.items.push({ ...cache.items[0]!, id: 'ancien', title: 'Ancien', publishedAt: '2025-09-01T10:00:00-04:00' });
    cache.sources.retiree = { status: 'ok', since: '2026-01-01T00:00:00-05:00', detail: '' };
    prune(cache, ['finances'], now, TZ, 12);
    expect(cache.items.map((i) => i.title)).toEqual(['Récent']);
    expect(Object.keys(cache.sources)).toEqual(['finances']);
  });

  it('juge un fil silencieux sur sa publication la plus récente, quels que soient les mots-clés', () => {
    const filtered = { ...source, keywords: ['crypto'] };
    const cache = emptyCache();
    // Fil vivant, rien de retenu par les mots-clés : ni publication ni alerte.
    expect(applyOutcome(cache, filtered, { status: 'ok', entries: [entry('Budget', 'https://a.ca/b')] }, now, TZ, 12)).toBe(0);
    expect(cache.sources.finances?.status).toBe('ok');
    // Fil figé depuis 2023 : silencieux, sans nouvelle écriture tant que rien ne change.
    const frozen = { status: 'ok' as const, entries: [entry('Rapport annuel', 'https://a.ca/r', '2023-01-31T14:30:00Z')] };
    applyOutcome(cache, filtered, frozen, now, TZ, 12);
    expect(cache.sources.finances).toMatchObject({ status: 'silencieux', detail: `dernière publication du fil le ${formatDate('2023-01-31')}` });
    const again = structuredClone(cache);
    applyOutcome(again, filtered, frozen, new Date('2026-09-29T16:00:00Z'), TZ, 12);
    expect(serializeCache(cache, again, now, TZ).changed).toBe(false);
    expect(sourceState(filtered, { status: 'ok', entries: [] }, now, TZ)).toEqual({ status: 'silencieux', detail: 'fil vide' });
    expect(sourceState(filtered, { status: 'ok', entries: [{ ...entry('Sans date', 'https://a.ca/s'), published: undefined }] }, now, TZ)).toEqual({ status: 'ok', detail: UNDATED });
  });

  it('garde la date et la cause du début d’une panne, sans réécrire le fichier', () => {
    const day = (d: number) => new Date(`2026-09-${d}T16:00:00Z`);
    const cache = emptyCache();
    applyOutcome(cache, source, { status: 'erreur', detail: 'délai de 20 s dépassé' }, day(28), TZ, 12);
    const before = structuredClone(cache);
    applyOutcome(cache, source, { status: 'erreur', detail: 'HTTP 503' }, day(29), TZ, 12);
    expect(cache.sources.finances).toEqual({ status: 'erreur', since: '2026-09-28T12:00:00-04:00', detail: 'délai de 20 s dépassé' });
    expect(serializeCache(before, cache, day(29), TZ).changed).toBe(false);
    // Fil silencieux : le détail suit la dernière publication du fil, la date du début reste.
    const frozen = (published: string) => ({ status: 'ok' as const, entries: [entry('Vieux', 'https://a.ca/v', published)] });
    const quiet = emptyCache();
    applyOutcome(quiet, source, frozen('2026-06-01T12:00:00Z'), day(28), TZ, 12);
    applyOutcome(quiet, source, frozen('2026-07-01T12:00:00Z'), day(29), TZ, 12);
    expect(quiet.sources.finances).toEqual({ status: 'silencieux', since: '2026-09-28T12:00:00-04:00', detail: `dernière publication du fil le ${formatDate('2026-07-01')}` });
  });

  it('remonte une entrée redatée dans le fil un jour suivant, avec son nouveau titre', () => {
    const day = (d: number) => new Date(`2026-09-${d}T16:00:00Z`);
    const bills = emptyCache();
    expect(applyOutcome(bills, source, { status: 'ok', entries: [entry('C-99, Loi sur les actifs numériques', 'https://a.ca/c-99', '2026-09-01T14:00:00Z')] }, day(28), TZ, 12)).toBe(1);
    const staged = entry('C-99, Loi sur les actifs numériques (sanction royale)', 'https://a.ca/c-99', '2026-09-28T14:00:00Z');
    expect(applyOutcome(bills, source, { status: 'ok', entries: [staged] }, day(29), TZ, 12)).toBe(1);
    expect(bills.items).toHaveLength(1);
    expect(bills.items[0]).toMatchObject({ title: staged.title, publishedAt: '2026-09-28T10:00:00-04:00' });
    // Le même jour, ou sans date dans le fil : rien ne change.
    expect(applyOutcome(bills, source, { status: 'ok', entries: [entry('Autre titre', 'https://a.ca/c-99', '2026-09-28T20:00:00Z')] }, day(29), TZ, 12)).toBe(0);
    expect(applyOutcome(bills, source, { status: 'ok', entries: [{ ...entry('Sans date', 'https://a.ca/c-99'), published: undefined }] }, day(30), TZ, 12)).toBe(0);
    expect(bills.items[0]?.title).toBe(staged.title);
  });

  it('étiquette une publication par son organisme, à défaut par le libellé de sa source', () => {
    const organismes: Record<string, { id: string; data: { acronym?: string; name: string } }> = { arc: { id: 'arc', data: { acronym: 'ARC', name: 'Agence du revenu du Canada' } } };
    const graph = { get: (_c: string, id?: string) => (id ? organismes[id] : undefined), config: { veilleSources: { sources: [{ id: 'gazette', label: 'Gazette du Canada' }] } } } as unknown as Graph;
    const item = (sourceId: string, organisme: string) => ({ id: 'x', sourceId, title: 't', url: 'https://a.ca', organisme, jurisdiction: 'canada', publishedAt: '2026-09-28T10:00:00-04:00', summary: '' });
    expect(veilleOrigin(graph, item('arc', 'arc'))).toMatchObject({ key: 'arc', label: 'ARC' });
    expect(veilleOrigin(graph, item('gazette', ''))).toEqual({ key: 'source:gazette', label: 'Gazette du Canada' });
  });
});

describe('santé des sources dans le rapport', () => {
  it('distingue source en erreur, jamais collectée, silencieuse et sans adresse', async () => {
    const { getConfig } = await import('../src/lib/config/index.ts');
    const { checkVeille } = await import('../src/lib/check/veille.ts');
    const base = getConfig();
    const source = (id: string, extra: Record<string, unknown> = {}) => ({
      id,
      label: id,
      organisme: '',
      jurisdiction: 'canada',
      url: `https://a.ca/${id}.xml`,
      format: 'rss' as const,
      language: 'fr' as const,
      keywords: [],
      staleDays: 30,
      enabled: true,
      note: '',
      ...extra,
    });
    const config = {
      ...base,
      veilleSources: {
        retentionMonths: 12,
        sources: [
          source('panne'),
          source('neuve'),
          source('calme'),
          source('active'),
          source('vide', { url: '' }),
          source('eteinte', { enabled: false }),
          source('filtree', { keywords: ['crypto'] }),
          source('figee', { keywords: ['crypto'] }),
        ],
      },
    };
    config.veilleSources.sources.push(source('sansdate', { keywords: ['crypto'] }));
    const found: string[] = [];
    const now = new Date('2026-09-28T16:00:00Z');
    const item = (sourceId: string, publishedAt: string) => ({ id: sourceId, sourceId, title: 't', url: 'https://a.ca/x', organisme: '', jurisdiction: 'canada', publishedAt, summary: '' });
    checkVeille({ config, add: (_file, where, message, rule, severity) => found.push(`${JSON.stringify(where)} ${rule} ${severity} ${message.split(' : ')[0]}`) }, now, {
      health: {
        panne: { status: 'erreur', since: '2026-09-20T08:00:00-04:00', detail: 'HTTP 503' },
        calme: { status: 'ok', since: '2026-01-01T08:00:00-05:00', detail: '' },
        active: { status: 'ok', since: '2026-01-01T08:00:00-05:00', detail: '' },
        // Mots-clés sans publication retenue depuis longtemps : normal, pas d'alerte.
        filtree: { status: 'ok', since: '2026-01-01T08:00:00-05:00', detail: '' },
        figee: { status: 'silencieux', since: '2026-09-01T08:00:00-04:00', detail: 'dernière publication du fil le 31 janvier 2023' },
        sansdate: { status: 'ok', since: '2026-09-01T08:00:00-04:00', detail: UNDATED },
      },
      items: [item('calme', '2026-08-01T10:00:00-04:00'), item('active', '2026-09-27T10:00:00-04:00')],
    });
    expect(found).toEqual([
      '["sources",0] veille avertissement panne',
      '["sources",1] veille information neuve',
      '["sources",2] veille avertissement calme',
      '["sources",4,"url"] veille avertissement vide',
      '["sources",7] veille avertissement figee',
      '["sources",8] veille information sansdate',
    ]);
  });

  it('signale une tâche « veille » qui ne passe plus (désactivée ou suspendue)', async () => {
    const { getConfig } = await import('../src/lib/config/index.ts');
    const { checkVeille, VEILLE_WORKFLOW } = await import('../src/lib/check/veille.ts');
    const config = { ...getConfig(), veilleSources: { retentionMonths: 12, sources: [] } };
    const now = new Date('2026-09-28T16:00:00Z');
    const run = (lastRun?: string) => {
      const found: string[] = [];
      checkVeille({ config, add: (file, _where, message, _rule, severity) => found.push(`${file} ${severity} ${message}`) }, now, { health: {}, items: [], lastRun });
      return found;
    };
    expect(run()).toEqual([]);
    // Vendredi après-midi, lu le lundi : une fin de semaine, rien d'anormal.
    expect(run('2026-09-25T18:07:00Z')).toEqual([]);
    expect(run('2026-09-20T12:07:00Z')).toEqual([expect.stringMatching(new RegExp(`^${VEILLE_WORKFLOW} avertissement .*il y a 8 jours`))]);
    expect(run('aucun')).toEqual([expect.stringContaining('aucun passage planifié sur main')]);
  });
});
