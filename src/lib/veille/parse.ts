// Lecture d'un fil de publications officielles : RSS 2.0, RSS 1.0 (RDF), Atom ou JSON Feed. On n'en garde que
// le titre, le lien, la date et un court résumé en texte brut : le contenu n'est jamais republié (ARCHITECTURE,
// section 14). Le format annoncé dans la configuration n'est qu'une indication : la racine du document décide.
import { DOMParser } from '@xmldom/xmldom';
import { zonedInstant } from '../dates.ts';

export type FeedEntry = { title: string; url: string; published?: Date; summary: string };

// Page HTML reçue à la place d'un fil (pare-feu, page d'erreur, fil déplacé) : la source est « illisible ».
export class UnreadableFeedError extends Error {}

const SUMMARY_LENGTH = 280;
const MONTHS: Record<string, number> = {
  janv: 1, jan: 1, janvier: 1, fevr: 2, fev: 2, fevrier: 2, feb: 2, mars: 3, mar: 3, avr: 4, avril: 4, apr: 4, mai: 5, may: 5,
  juin: 6, jun: 6, juil: 7, juillet: 7, jul: 7, aout: 8, aug: 8, sept: 9, sep: 9, septembre: 9, oct: 10, octobre: 10,
  nov: 11, novembre: 11, dec: 12, decembre: 12,
};

const ENGLISH_MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const collapse = (text: string) => text.replace(/\s+/g, ' ').trim();
const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

// Texte brut d'un fragment HTML (résumé d'un fil, titre Atom de type html) : entités décodées, balises retirées.
export function htmlToText(html: string): string {
  if (!/[<&]/.test(html)) return collapse(html);
  const doc = new DOMParser({ onError: () => undefined }).parseFromString(`<html><body>${html}</body></html>`, 'text/html');
  return collapse(doc.documentElement?.textContent ?? '');
}

export function truncate(text: string, length = SUMMARY_LENGTH): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length + 1).replace(/\s+\S*$/, '')}…`;
}

// Date d'un fil : RFC 822 (RSS), ISO 8601 (Atom), ou forme française (« lun., 28 sept. 2026 10:00 »).
// Sans fuseau, l'heure est celle de `timeZone`.
export function parseFeedDate(value: string | undefined, timeZone: string): Date | undefined {
  const text = value?.trim();
  if (!text) return undefined;
  const iso = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(:\d{2}(?:\.\d+)?)?)?(Z|[+-]\d{2}:?\d{2})?$/.exec(text);
  if (iso) {
    const [, date = '', time, seconds = ':00', zone] = iso;
    if (!time) return zonedInstant(date, '00:00', timeZone);
    if (!zone) return zonedInstant(date, time, timeZone);
    const instant = new Date(`${date}T${time}${seconds}${zone.length === 5 ? `${zone.slice(0, 3)}:${zone.slice(3)}` : zone}`);
    return Number.isNaN(instant.getTime()) ? undefined : instant;
  }
  // RFC 822 : « Mon, 28 Sep 2026 10:30:00 EDT » ; sans fuseau, heure locale.
  const rfc = /^(?:[A-Za-z]{3},?\s*)?(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?\s+(\d{4})\s+(\d{1,2}):(\d{2})(?::\d{2})?\s*([A-Za-z]{1,5}|[+-]\d{4})?$/.exec(text);
  const rfcMonth = rfc ? ENGLISH_MONTHS.indexOf((rfc[2] ?? '').toLowerCase()) + 1 : 0;
  if (rfc && rfcMonth > 0) {
    if (rfc[6]) {
      const parsed = Date.parse(text);
      return Number.isNaN(parsed) ? undefined : new Date(parsed);
    }
    const date = `${rfc[3]}-${String(rfcMonth).padStart(2, '0')}-${String(rfc[1]).padStart(2, '0')}`;
    return zonedInstant(date, `${String(rfc[4]).padStart(2, '0')}:${rfc[5]}`, timeZone);
  }
  const fr = /(\d{1,2})\s+([\p{L}.]+)\s+(\d{4})(?:\s+(\d{1,2})[:h](\d{2}))?/u.exec(fold(text));
  const month = fr ? MONTHS[(fr[2] ?? '').replace(/\./g, '')] : undefined;
  if (!fr || !month) return undefined;
  const date = `${fr[3]}-${String(month).padStart(2, '0')}-${String(fr[1]).padStart(2, '0')}`;
  return zonedInstant(date, fr[4] ? `${fr[4].padStart(2, '0')}:${fr[5]}` : '00:00', timeZone);
}

// Nœud XML, réduit à ce que la lecture d'un fil utilise.
type XmlNode = { nodeType: number; localName: string | null; textContent: string | null; childNodes: ArrayLike<XmlNode>; getAttribute(name: string): string | null };

const children = (node: XmlNode | undefined, name?: string): XmlNode[] =>
  node ? Array.from(node.childNodes).filter((c) => c.nodeType === 1 && (!name || c.localName === name)) : [];
const child = (node: XmlNode | undefined, ...names: string[]): XmlNode | undefined => {
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

function rssEntries(items: XmlNode[], base: string, timeZone: string): FeedEntry[] {
  return items.map((item) => {
    const guid = child(item, 'guid');
    const permalink = guid && guid.getAttribute('isPermaLink') !== 'false' && /^https?:/.test(text(guid).trim()) ? text(guid) : '';
    const link = text(child(item, 'link')) || permalink || (item.getAttribute('rdf:about') ?? '');
    return {
      title: htmlToText(text(child(item, 'title'))),
      url: absolute(link, base),
      published: parseFeedDate(text(child(item, 'pubDate', 'date', 'issued', 'published', 'updated')), timeZone),
      summary: truncate(htmlToText(text(child(item, 'description', 'summary', 'encoded')))),
    };
  });
}

function atomEntries(entries: XmlNode[], base: string, timeZone: string): FeedEntry[] {
  return entries.map((node) => {
    const links = children(node, 'link');
    const link = links.find((l) => (l.getAttribute('rel') ?? 'alternate') === 'alternate') ?? links[0];
    const title = child(node, 'title');
    return {
      title: title?.getAttribute('type') === 'html' ? htmlToText(text(title)) : collapse(text(title)),
      url: absolute(link?.getAttribute('href') ?? '', base),
      published: parseFeedDate(text(child(node, 'published', 'updated', 'issued', 'date')), timeZone),
      summary: truncate(htmlToText(text(child(node, 'summary', 'content')))),
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
      root = new DOMParser({ onError: () => undefined }).parseFromString(trimmed, 'text/xml').documentElement as unknown as XmlNode | null;
    } catch (error) {
      throw new UnreadableFeedError(`XML illisible : ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`);
    }
    const name = root?.localName ?? '';
    if (!root || name === 'html') throw new UnreadableFeedError('page HTML reçue au lieu d’un fil (pare-feu ou adresse périmée)');
    if (name === 'feed') entries = atomEntries(children(root, 'entry'), base, timeZone);
    else if (name === 'rss') entries = rssEntries(children(child(root, 'channel'), 'item'), base, timeZone);
    else if (name === 'RDF') entries = rssEntries(children(root, 'item'), base, timeZone);
    else throw new UnreadableFeedError(`racine « ${name} » inconnue : ni RSS, ni Atom`);
  }
  return entries.filter((e) => e.title && /^https?:\/\//.test(e.url));
}
