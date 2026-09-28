import { describe, expect, it } from 'vitest';
import { applyOutcome, canonicalUrl, emptyCache, matchesKeywords, prune, serializeCache, sourceState } from '../src/lib/veille/merge.ts';
import { htmlToText, parseFeed, parseFeedDate, UnreadableFeedError } from '../src/lib/veille/parse.ts';
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
    expect(sourceState(filtered, { status: 'ok', entries: [{ ...entry('Sans date', 'https://a.ca/s'), published: undefined }] }, now, TZ).status).toBe('ok');
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
    const found: string[] = [];
    const now = new Date('2026-09-28T16:00:00Z');
    const item = (sourceId: string, publishedAt: string) => ({ id: sourceId, sourceId, title: 't', url: 'https://a.ca/x', organisme: '', jurisdiction: 'canada', publishedAt, summary: '' });
    checkVeille(
      { config, add: (_file, where, message, rule, severity) => found.push(`${JSON.stringify(where)} ${rule} ${severity} ${message.split(' : ')[0]}`) },
      now,
      {
        panne: { status: 'erreur', since: '2026-09-20T08:00:00-04:00', detail: 'HTTP 503' },
        calme: { status: 'ok', since: '2026-01-01T08:00:00-05:00', detail: '' },
        active: { status: 'ok', since: '2026-01-01T08:00:00-05:00', detail: '' },
        // Mots-clés sans publication retenue depuis longtemps : normal, pas d'alerte.
        filtree: { status: 'ok', since: '2026-01-01T08:00:00-05:00', detail: '' },
        figee: { status: 'silencieux', since: '2026-09-01T08:00:00-04:00', detail: 'dernière publication du fil le 31 janvier 2023' },
      },
      [item('calme', '2026-08-01T10:00:00-04:00'), item('active', '2026-09-27T10:00:00-04:00')],
    );
    expect(found).toEqual([
      '["sources",0] veille avertissement panne',
      '["sources",1] veille information neuve',
      '["sources",2] veille avertissement calme',
      '["sources",4,"url"] veille avertissement vide',
      '["sources",7] veille avertissement figee',
    ]);
  });
});
