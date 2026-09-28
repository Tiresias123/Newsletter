// Lecture d'un fil de publications officielles : RSS 2.0, RSS 1.0 (RDF), Atom ou JSON Feed. On n'en garde que
// le titre, le lien, la date et un court résumé en texte brut : le contenu n'est jamais republié (ARCHITECTURE,
// section 14). Le format annoncé dans la configuration n'est qu'une indication : la racine du document décide.
import { DOMParser } from '@xmldom/xmldom';
import { isCalendarDate, zonedInstant } from '../dates.ts';

export type FeedEntry = { title: string; url: string; published?: Date; summary: string };

// Page HTML reçue à la place d'un fil (pare-feu, page d'erreur, fil déplacé) : la source est « illisible ».
export class UnreadableFeedError extends Error {}

const SUMMARY_LENGTH = 280;

// Espaces de noms : un élément d'une extension (atom:link, media:title…) ne remplace jamais celui du fil.
const NS = {
  rss1: 'http://purl.org/rss/1.0/',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  atom: 'http://www.w3.org/2005/Atom',
  dc: 'http://purl.org/dc/elements/1.1/',
  dcterms: 'http://purl.org/dc/terms/',
  content: 'http://purl.org/rss/1.0/modules/content/',
  xml: 'http://www.w3.org/XML/1998/namespace',
};

// Mois en français et en anglais, sans accents, abrégés ou non.
const MONTHS: Record<string, number> = {
  janv: 1, jan: 1, janvier: 1, january: 1, fevr: 2, fev: 2, fevrier: 2, feb: 2, february: 2, mars: 3, mar: 3, march: 3,
  avr: 4, avril: 4, apr: 4, april: 4, mai: 5, may: 5, juin: 6, jun: 6, june: 6, juil: 7, juillet: 7, jul: 7, july: 7,
  aout: 8, aug: 8, august: 8, sept: 9, sep: 9, septembre: 9, september: 9, oct: 10, octobre: 10, october: 10,
  nov: 11, novembre: 11, november: 11, dec: 12, decembre: 12, december: 12,
};

// Fuseaux nommés, en minutes par rapport à UTC : ceux de la RFC 822, l'Atlantique et Terre-Neuve, et leurs
// abréviations françaises (HNE, HAE…).
const ZONES: Record<string, number> = {
  ut: 0, utc: 0, gmt: 0, z: 0, est: -300, edt: -240, cst: -360, cdt: -300, mst: -420, mdt: -360, pst: -480, pdt: -420,
  ast: -240, adt: -180, nst: -210, ndt: -150, hne: -300, hae: -240, hnc: -360, hac: -300, hnr: -420, har: -360,
  hnp: -480, hap: -420, hna: -240, haa: -180, hnt: -210, hat: -150,
};

// Éléments de bloc : une espace les sépare du texte voisin (« <p>A</p><p>B</p> » donne « A B »).
const BLOCKS = new Set(['address', 'article', 'aside', 'blockquote', 'br', 'dd', 'div', 'dl', 'dt', 'figcaption', 'figure', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'li', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'td', 'th', 'tr', 'ul']);
// Éléments dont le contenu n'est pas du texte à lire.
const HIDDEN = new Set(['script', 'style', 'template']);

const collapse = (text: string) => text.replace(/\s+/g, ' ').trim();
const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

// Nœud XML ou HTML, réduit à ce que la lecture d'un fil utilise.
type XmlNode = {
  nodeType: number;
  nodeName: string;
  localName: string | null;
  namespaceURI: string | null;
  textContent: string | null;
  data?: string;
  parentNode: XmlNode | null;
  childNodes: ArrayLike<XmlNode>;
  getAttribute(name: string): string | null;
  getAttributeNS(namespace: string, name: string): string | null;
};
type Name = readonly [namespace: string | null, localName: string];

const parser = () => new DOMParser({ onError: () => undefined });

// Texte d'un nœud : blocs séparés par une espace, scripts et styles ignorés.
function textOf(node: XmlNode): string {
  let result = '';
  for (const c of Array.from(node.childNodes)) {
    if (c.nodeType === 3 || c.nodeType === 4) result += c.data ?? '';
    else if (c.nodeType === 1) {
      const name = (c.localName ?? c.nodeName).toLowerCase();
      if (HIDDEN.has(name)) continue;
      result += BLOCKS.has(name) ? ` ${textOf(c)} ` : textOf(c);
    }
  }
  return result;
}

// Texte brut d'un fragment HTML (résumé d'un fil, titre Atom de type html) : entités décodées, balises retirées.
export function htmlToText(html: string): string {
  if (!/[<&]/.test(html)) return collapse(html);
  const root = parser().parseFromString(`<html><body>${html}</body></html>`, 'text/html').documentElement as unknown as XmlNode | null;
  return collapse(root ? textOf(root) : '');
}

export function truncate(text: string, length = SUMMARY_LENGTH): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length + 1).replace(/\s+\S*$/, '')}…`;
}

// Texte d'un fil selon l'encodage annoncé : marque d'ordre des octets, sinon UTF-8 s'il est valide (un en-tête
// qui annonce ISO-8859-1 pour un fichier UTF-8 est fréquent), sinon l'encodage de l'en-tête Content-Type ou de
// la déclaration XML, sinon Windows-1252.
export function decodeFeed(bytes: Uint8Array, contentType = ''): string {
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes);
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    // Pas de l'UTF-8 : encodage déclaré.
  }
  const head = new TextDecoder('windows-1252').decode(bytes.subarray(0, 256));
  const declared = /charset\s*=\s*["']?([\w.:-]+)/i.exec(contentType)?.[1] ?? /^\s*<\?xml[^>]*\bencoding\s*=\s*["']([\w.:-]+)["']/i.exec(head)?.[1];
  try {
    if (declared) return new TextDecoder(declared).decode(bytes);
  } catch {
    // Encodage inconnu : Windows-1252, qui lit aussi l'ISO-8859-1.
  }
  return new TextDecoder('windows-1252').decode(bytes);
}

// Décalage d'un fuseau en minutes : « -0400 », « +05:30 », « EDT », « HAE »; une lettre (fuseau militaire) ou un
// nom inconnu vaut UTC, comme le veut la RFC 5322.
function zoneOffset(zone: string): number {
  const numeric = /^([+-])(\d{2}):?(\d{2})?$/.exec(zone);
  if (numeric) return (numeric[1] === '-' ? -1 : 1) * (Number(numeric[2]) * 60 + Number(numeric[3] ?? 0));
  return ZONES[zone.toLowerCase()] ?? 0;
}

// Instant d'une date et d'une heure : avec un fuseau, exact; sans fuseau, heure de `timeZone`.
function instant(date: string, hour: number, minute: number, second: number, zone: string | undefined, timeZone: string): Date | undefined {
  if (!isCalendarDate(date) || hour > 23 || minute > 59 || second > 60) return undefined;
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  if (zone === undefined) return zonedInstant(date, time, timeZone);
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day, hour, minute, Math.min(second, 59)) - zoneOffset(zone) * 60_000);
}

const pad = (value: string | number) => String(value).padStart(2, '0');

// Date d'un fil : ISO 8601 (Atom), RFC 822 (RSS, commentaires et années à deux chiffres compris), ou forme
// française (« lun., 28 sept. 2026 10:00 », « 1er octobre 2026 à 10 h 30 HAE »). Sans fuseau, l'heure est celle
// de `timeZone`.
export function parseFeedDate(value: string | undefined, timeZone: string): Date | undefined {
  // Commentaires permis par la RFC 5322 : « Mon, 28 Sep 2026 10:30:00 +0000 (UTC) ».
  const text = value?.replace(/\([^)]*\)/g, ' ').trim();
  if (!text) return undefined;
  const iso = /^(\d{4}-\d{2}-\d{2})(?:[t ](\d{2}):(\d{2})(?::(\d{2})(?:[.,]\d+)?)?)?\s*(z|[+-]\d{2}(?::?\d{2})?)?$/i.exec(text);
  if (iso) {
    const [, date = '', hour, minute, second, zone] = iso;
    return instant(date, Number(hour ?? 0), Number(minute ?? 0), Number(second ?? 0), hour ? zone : undefined, timeZone);
  }
  const folded = fold(text);
  // Jour, mois, année et heure facultative : forme RFC 822 et forme française, avec ou sans jour de la semaine.
  const dated = /^(?:[a-z]{2,9}\.?,?\s+)?(\d{1,2})(?:er)?\s+([a-z]{3,9})\.?,?\s+(\d{4}|\d{2})(?:(?:\s+a\s+|\s*,\s*|\s+)(\d{1,2})\s*[:h]\s*(\d{2})(?::(\d{2}))?(?:\s*([+-]\d{2}:?\d{2}|[a-z]{1,5}))?(?:\s+[a-z]{1,5})?)?$/.exec(folded);
  if (dated) {
    const [, day = '', name = '', year = '', hour, minute, second, zone] = dated;
    const month = MONTHS[name];
    if (!month) return undefined;
    // Année à deux chiffres (RFC 822) : 00 à 49 pour 2000 à 2049, 50 à 99 pour 1950 à 1999.
    const fullYear = year.length === 2 ? (Number(year) < 50 ? 2000 : 1900) + Number(year) : Number(year);
    return instant(`${fullYear}-${pad(month)}-${pad(day)}`, Number(hour ?? 0), Number(minute ?? 0), Number(second ?? 0), hour ? zone : undefined, timeZone);
  }
  // Date au fil d'un texte (« Publié le 28 septembre 2026 ») : heure locale.
  const loose = /(\d{1,2})(?:er)?\s+([a-z]+)\.?\s+(\d{4})(?:\s+(?:a\s+)?(\d{1,2})\s*[:h]\s*(\d{2}))?/.exec(folded);
  const month = loose ? MONTHS[loose[2] ?? ''] : undefined;
  if (!loose || !month) return undefined;
  return instant(`${loose[3]}-${pad(month)}-${pad(loose[1] ?? '')}`, Number(loose[4] ?? 0), Number(loose[5] ?? 0), 0, undefined, timeZone);
}

const children = (node: XmlNode | undefined, name?: Name): XmlNode[] =>
  node ? Array.from(node.childNodes).filter((c) => c.nodeType === 1 && (!name || (c.localName === name[1] && (c.namespaceURI ?? null) === name[0]))) : [];
const child = (node: XmlNode | undefined, ...names: Name[]): XmlNode | undefined => {
  for (const name of names) {
    const found = children(node, name)[0];
    if (found) return found;
  }
  return undefined;
};
const text = (node: XmlNode | undefined) => node?.textContent ?? '';

function absolute(url: string, base: string): string {
  if (!url.trim()) return '';
  try {
    return new URL(url.trim(), base).href;
  } catch {
    return '';
  }
}

// Adresse de base d'un élément : xml:base de ses ancêtres (Atom surtout), à défaut l'adresse du fil.
function baseOf(node: XmlNode | null, documentUrl: string): string {
  if (!node || node.nodeType !== 1) return documentUrl;
  const parent = baseOf(node.parentNode, documentUrl);
  const own = node.getAttributeNS(NS.xml, 'base');
  return own ? absolute(own, parent) || parent : parent;
}

// `ns` : espace de noms des éléments du fil (aucun pour RSS 2.0, celui de RSS 1.0 pour le RDF).
function rssEntries(items: XmlNode[], ns: string | null, documentUrl: string, timeZone: string): FeedEntry[] {
  return items.map((item) => {
    const guid = child(item, [ns, 'guid']);
    const permalink = guid && guid.getAttribute('isPermaLink') !== 'false' && /^https?:/.test(text(guid).trim()) ? text(guid) : '';
    const link = text(child(item, [ns, 'link'])) || permalink || (item.getAttributeNS(NS.rdf, 'about') ?? '');
    return {
      title: htmlToText(text(child(item, [ns, 'title']))),
      url: absolute(link, baseOf(item, documentUrl)),
      published: parseFeedDate(text(child(item, [ns, 'pubDate'], [NS.dc, 'date'], [NS.dcterms, 'issued'], [NS.atom, 'published'], [NS.atom, 'updated'])), timeZone),
      summary: truncate(htmlToText(text(child(item, [ns, 'description'], [NS.content, 'encoded'])))),
    };
  });
}

// Texte d'une construction Atom : « text » (par défaut), « html » (balisage échappé) ou « xhtml » (éléments).
function atomText(node: XmlNode | undefined, markup: boolean): string {
  if (!node) return '';
  const type = node.getAttribute('type');
  if (type === 'xhtml') return collapse(textOf(node));
  return markup || type === 'html' ? htmlToText(text(node)) : collapse(text(node));
}

// `ns` : espace de noms d'Atom 1.0, ou d'Atom 0.3 (dates « issued » et « modified »).
function atomEntries(entries: XmlNode[], ns: string | null, documentUrl: string, timeZone: string): FeedEntry[] {
  return entries.map((node) => {
    const links = children(node, [ns, 'link']);
    const link = links.find((l) => (l.getAttribute('rel') ?? 'alternate') === 'alternate') ?? links[0];
    return {
      title: atomText(child(node, [ns, 'title']), false),
      url: link ? absolute(link.getAttribute('href') ?? '', baseOf(link, documentUrl)) : '',
      published: parseFeedDate(text(child(node, [ns, 'published'], [ns, 'updated'], [ns, 'issued'], [ns, 'modified'], [NS.dc, 'date'])), timeZone),
      summary: truncate(atomText(child(node, [ns, 'summary'], [ns, 'content']), true)),
    };
  });
}

function jsonEntries(body: unknown, base: string, timeZone: string): FeedEntry[] {
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) throw new UnreadableFeedError('fil JSON sans liste « items »');
  return items.map((raw) => {
    const item = raw as Record<string, unknown>;
    const str = (key: string) => (typeof item[key] === 'string' ? (item[key] as string) : '');
    return {
      title: htmlToText(str('title')),
      url: absolute(str('url') || str('external_url') || str('id'), base),
      published: parseFeedDate(str('date_published') || str('date_modified'), timeZone),
      summary: truncate(htmlToText(str('summary') || str('content_text') || str('content_html'))),
    };
  });
}

// Entrées lisibles d'un fil (titre et lien présents), dans l'ordre du fil.
export function parseFeed(body: string, base: string, timeZone: string): FeedEntry[] {
  const trimmed = body.trimStart();
  let entries: FeedEntry[];
  if (trimmed.startsWith('{')) {
    let json: unknown;
    try {
      json = JSON.parse(trimmed);
    } catch {
      throw new UnreadableFeedError('JSON illisible');
    }
    entries = jsonEntries(json, base, timeZone);
  } else {
    let root: XmlNode | null;
    try {
      root = parser().parseFromString(trimmed, 'text/xml').documentElement as unknown as XmlNode | null;
    } catch (error) {
      throw new UnreadableFeedError(`XML illisible : ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`);
    }
    const name = root?.localName ?? '';
    if (!root || name === 'html') throw new UnreadableFeedError('page HTML reçue au lieu d’un fil (pare-feu ou adresse périmée)');
    const ns = root.namespaceURI ?? null;
    if (name === 'feed') entries = atomEntries(children(root, [ns, 'entry']), ns, base, timeZone);
    else if (name === 'rss') entries = rssEntries(children(child(root, [ns, 'channel']), [ns, 'item']), ns, base, timeZone);
    else if (name === 'RDF') {
      // RSS 1.0 (ou 0.90) : les éléments du fil sont dans l'espace de noms de ses « item ».
      const itemNs = children(root).find((c) => c.localName === 'item')?.namespaceURI ?? NS.rss1;
      entries = rssEntries(children(root, [itemNs, 'item']), itemNs, base, timeZone);
    } else throw new UnreadableFeedError(`racine « ${name} » inconnue : ni RSS, ni Atom`);
  }
  return entries.filter((e) => e.title && /^https?:\/\//.test(e.url));
}
