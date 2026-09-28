// En-têtes HTTP des fichiers statiques (ARCHITECTURE 16.1), écrits dans dist/_headers après le build : sécurité
// (CSP, HSTS…) et mise en cache des fichiers à empreinte. Les réponses du Worker (/api/*) posent les leurs.
// La CSP autorise les scripts intégrés à la page par leur empreinte SHA-256, calculée sur les pages construites :
// aucun « unsafe-inline » pour les scripts.
import { createHash } from 'node:crypto';

// Scripts exécutables écrits dans la page (thème sans clignotement, petits scripts qu'Astro intègre) ; les blocs
// de données (JSON, JSON-LD) ne s'exécutent pas et n'ont pas besoin d'empreinte.
const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
const DATA_TYPE = /\stype=["']?(?!module|text\/javascript)[^"'\s>]+/i;

export function inlineScriptHashes(html: string): string[] {
  const hashes: string[] = [];
  for (const [, attributes = '', body = ''] of html.matchAll(INLINE_SCRIPT)) {
    if (DATA_TYPE.test(attributes) || !body.trim()) continue;
    hashes.push(`'sha256-${createHash('sha256').update(body).digest('base64')}'`);
  }
  return hashes;
}

export type CspSources = {
  // Empreintes des scripts intégrés, toutes pages confondues.
  hashes: string[];
  // Mesure d'audience, si elle est activée : origine du script (ex. https://cloud.umami.is) et serveurs qui
  // reçoivent les mesures (ex. https://gateway.umami.is).
  analytics?: { script: string; collect: string[] };
};

const TURNSTILE = 'https://challenges.cloudflare.com';
const YOUTUBE = 'https://www.youtube-nocookie.com';

export function contentSecurityPolicy({ hashes, analytics }: CspSources): string {
  const scripts = ["'self'", ...[...new Set(hashes)].sort(), TURNSTILE, ...(analytics ? [analytics.script] : []), "'wasm-unsafe-eval'"];
  const connect = ["'self'", ...new Set(analytics ? [analytics.script, ...analytics.collect] : [])];
  return [
    "default-src 'self'",
    `script-src ${scripts.join(' ')}`,
    // Styles : ceux du site et les attributs de style qu'insèrent Turnstile ou Astro.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${connect.join(' ')}`,
    `frame-src ${TURNSTILE} ${YOUTUBE}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export function headersFile(sources: CspSources): string {
  const all = [
    '/*',
    `  Content-Security-Policy: ${contentSecurityPolicy(sources)}`,
    '  Strict-Transport-Security: max-age=31536000',
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
    '  X-Frame-Options: DENY',
    '  Cross-Origin-Opener-Policy: same-origin',
    // Fichiers à empreinte (scripts, styles, polices, images optimisées) : jamais modifiés, gardés un an.
    '/_astro/*',
    '  Cache-Control: public, max-age=31536000, immutable',
  ];
  return `${all.join('\n')}\n`;
}

// Limites du fichier _headers chez Cloudflare, qui ne l'analyse qu'au déploiement : au-delà, les règles ou les
// lignes en trop sont ignorées sans échec.
export const MAX_HEADER_RULES = 100;
export const MAX_HEADER_LINE = 2000;

export function headersFileProblems(text: string): string[] {
  const problems: string[] = [];
  const lines = text.split('\n').filter((line) => line.trim() && !line.trim().startsWith('#'));
  const rules = lines.filter((line) => !/^\s/.test(line));
  if (rules.length > MAX_HEADER_RULES) problems.push(`_headers : ${rules.length} règles, au-delà des ${MAX_HEADER_RULES} que Cloudflare applique.`);
  for (const rule of rules) if ((rule.match(/\*/g) ?? []).length > 1) problems.push(`_headers : plus d'une étoile dans la règle « ${rule} ».`);
  for (const line of lines) {
    if (line.length > MAX_HEADER_LINE) problems.push(`_headers : ligne de ${line.length} caractères (« ${line.trim().slice(0, 40)}… »), au-delà des ${MAX_HEADER_LINE} que Cloudflare lit.`);
    else if (/^\s/.test(line) && !/^\s+(! )?[A-Za-z0-9-]+(: \S.*)?$/.test(line)) problems.push(`_headers : ligne illisible « ${line.trim().slice(0, 60)} ».`);
  }
  return problems;
}
