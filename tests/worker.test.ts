// Worker du site : formulaires (/api/newsletter, /api/contact) et tâche planifiée, sans réseau : Turnstile,
// Brevo et le Deploy Hook sont simulés.
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryMailer } from '../src/lib/contact/mailer.ts';
import { MemoryProvider } from '../src/lib/newsletter/memory.ts';
import { BREVO_API, BrevoMailer, BrevoProvider } from '../src/lib/providers/brevo.ts';
import { handleContact } from '../worker/contact.ts';
import type { Env, RateLimiter } from '../worker/http.ts';
import worker from '../worker/index.ts';
import { handleNewsletter } from '../worker/newsletter.ts';
import { isNightly, runScheduled } from '../worker/scheduled.ts';
import { fingerprint, ipPrefix, SITEVERIFY_URL, verifyTurnstile } from '../worker/security.ts';
import { email, oneOf, optional, text, validate } from '../worker/validate.ts';

const ORIGIN = 'https://site.test';
const baseEnv = (extra: Partial<Env> = {}): Env => ({
  ASSETS: { fetch: async () => new Response('page') },
  TURNSTILE_SECRET_KEY: 'secret',
  IP_HASH_SALT: 'sel',
  ...extra,
});

function post(path: string, fields: Record<string, string>, headers: Record<string, string> = {}) {
  const body = new URLSearchParams(fields);
  return new Request(`${ORIGIN}${path}`, {
    method: 'POST',
    body,
    headers: { origin: ORIGIN, accept: 'application/json', 'cf-connecting-ip': '203.0.113.7', 'content-type': 'application/x-www-form-urlencoded', ...headers },
  });
}

const subscription = (extra: Record<string, string> = {}) => ({
  email: 'Lecteur@Exemple.ca',
  consent: 'oui',
  list: 'generale',
  source: '/articles/un-article/',
  placement: 'article',
  consent_version: 'abcdef012345',
  'cf-turnstile-response': 'jeton',
  ...extra,
});

// Turnstile simulé : succès si le jeton vaut « jeton », pour l'hôte et l'action attendus.
let siteverify: Array<Record<string, string>> = [];
const verifyForm = (init?: RequestInit) => Object.fromEntries(new URLSearchParams(String(init?.body))) as Record<string, string>;
let outgoing: Array<{ url: string; body: unknown; headers: Headers }> = [];
function mockNetwork(action: string, brevoStatus = 201) {
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url === SITEVERIFY_URL) {
      const form = verifyForm(init);
      siteverify.push(form);
      return Response.json({ success: form.response === 'jeton', hostname: 'site.test', action });
    }
    outgoing.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined, headers: new Headers(init?.headers) });
    return new Response(brevoStatus === 201 ? null : JSON.stringify({ code: 'invalid_parameter', message: 'Lecteur@Exemple.ca invalide' }), { status: brevoStatus });
  });
}

beforeEach(() => {
  siteverify = [];
  outgoing = [];
  // Refus de Turnstile journalisés par le Worker : attendus ici.
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('inscription à l’infolettre', () => {
  it('inscrit l’abonné en attente avec sa preuve de consentement, sans conserver l’IP', async () => {
    mockNetwork('newsletter');
    const provider = new MemoryProvider();
    const response = await handleNewsletter(post('/api/newsletter', subscription()), baseEnv(), provider, new Date('2026-09-28T16:00:00Z'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('strict-transport-security')).toBe('max-age=31536000');
    expect(response.headers.get('cross-origin-opener-policy')).toBe('same-origin');
    expect(response.headers.get('permissions-policy')).toContain('camera=()');
    const [subscriber] = [...provider.subscribers.values()];
    expect(subscriber).toMatchObject({ email: 'lecteur@exemple.ca', list: 'generale', status: 'en-attente', tags: ['article'] });
    expect(subscriber?.consent).toEqual({
      at: '2026-09-28T16:00:00.000Z',
      source: 'https://site.test/articles/un-article/ (article)',
      textVersion: 'abcdef012345',
      ipHash: await fingerprint('sel', '203.0.113.7'),
    });
    expect(subscriber?.consent.ipHash).not.toContain('203.0.113.7');
    expect(siteverify[0]).toMatchObject({ secret: 'secret', response: 'jeton', remoteip: '203.0.113.7' });
  });

  it('refuse une autre origine, un envoi trop gros, des champs invalides ou un jeton refusé', async () => {
    mockNetwork('newsletter');
    const provider = new MemoryProvider();
    const call = async (request: Request) => {
      const response = await handleNewsletter(request, baseEnv(), provider);
      return [response.status, ((await response.json()) as { error?: string }).error];
    };
    expect(await call(post('/api/newsletter', subscription(), { origin: 'https://ailleurs.test' }))).toEqual([403, 'origine']);
    expect(await call(post('/api/newsletter', subscription({ message: 'x'.repeat(9000) })))).toEqual([413, 'taille']);
    expect(await call(post('/api/newsletter', subscription(), { 'content-type': 'application/json' }))).toEqual([415, 'invalide']);
    const truncated = new Request(`${ORIGIN}/api/newsletter`, {
      method: 'POST',
      body: '--limite\r\ncontent-disposition: form-data; name="email"\r\n\r\nlecteur',
      headers: { origin: ORIGIN, accept: 'application/json', 'content-type': 'multipart/form-data; boundary=limite' },
    });
    expect(await call(truncated)).toEqual([400, 'invalide']);
    expect(await call(post('/api/newsletter', subscription({ consent: '' })))).toEqual([400, 'invalide']);
    expect(await call(post('/api/newsletter', subscription({ list: 'fiscalite' })))).toEqual([400, 'invalide']);
    expect(await call(post('/api/newsletter', subscription({ source: 'https://ailleurs.test/' })))).toEqual([400, 'invalide']);
    expect(await call(post('/api/newsletter', subscription({ 'cf-turnstile-response': 'faux' })))).toEqual([403, 'verification']);
    expect(await call(new Request(`${ORIGIN}/api/newsletter`))).toEqual([405, 'methode']);
    expect(provider.subscribers.size).toBe(0);
  });

  it('répond comme un succès au robot qui remplit le champ piège, et limite le débit', async () => {
    mockNetwork('newsletter');
    const provider = new MemoryProvider();
    const trap = await handleNewsletter(post('/api/newsletter', subscription({ site_web: 'https://spam.test' })), baseEnv(), provider);
    expect(trap.status).toBe(200);
    expect(provider.subscribers.size).toBe(0);
    const keys: string[] = [];
    const limiter: RateLimiter = { limit: async ({ key }) => (keys.push(key), { success: !key.includes(':courriel:') }) };
    const limited = await handleNewsletter(post('/api/newsletter', subscription()), baseEnv({ FORM_LIMITER: limiter }), provider);
    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toBe('60');
    // Une clé par préfixe d'IP, puis, après le défi réussi, une par adresse courriel, en empreintes : ni l'IP ni
    // l'adresse en clair.
    expect(keys).toHaveLength(2);
    expect(keys[0]).toMatch(/^newsletter:ip:[a-f0-9]{24}$/);
    expect(keys[1]).toMatch(/^newsletter:courriel:[a-f0-9]{24}$/);
    expect(provider.subscribers.size).toBe(0);
    expect(siteverify).toHaveLength(1);
    // Sans défi réussi, la clé de l'adresse n'est jamais comptée : un tiers ne peut pas l'épuiser.
    keys.length = 0;
    await handleNewsletter(post('/api/newsletter', subscription({ 'cf-turnstile-response': 'faux' })), baseEnv({ FORM_LIMITER: limiter }), provider);
    expect(keys.every((key) => key.includes(':ip:'))).toBe(true);
  });

  it('reste générique quand le fournisseur échoue ou n’est pas configuré, sans journaliser l’adresse', async () => {
    mockNetwork('newsletter', 400);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const brevo = new BrevoProvider({ apiKey: 'cle', templateId: 7, redirectionUrl: `${ORIGIN}/newsletter/confirmation/`, listIds: { generale: 3 } });
    const failed = await handleNewsletter(post('/api/newsletter', subscription()), baseEnv(), brevo);
    expect([failed.status, await failed.json()]).toEqual([502, { ok: false, error: 'indisponible' }]);
    expect(errors.mock.calls.flat().join(' ')).not.toMatch(/exemple\.ca/i);
    const missing = await handleNewsletter(post('/api/newsletter', subscription()), baseEnv(), undefined);
    expect(missing.status).toBe(503);
    errors.mockRestore();
  });

  it('tient une adresse déjà inscrite pour un succès, sans le révéler', async () => {
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === SITEVERIFY_URL) return Response.json({ success: true, hostname: 'site.test', action: 'newsletter' });
      outgoing.push({ url: String(input), body: JSON.parse(String(init?.body)), headers: new Headers(init?.headers) });
      return Response.json({ code: 'duplicate_parameter', message: 'Contact already in list' }, { status: 400 });
    });
    const brevo = new BrevoProvider({ apiKey: 'cle', templateId: 7, redirectionUrl: `${ORIGIN}/newsletter/confirmation/`, listIds: { generale: 3 } });
    const response = await handleNewsletter(post('/api/newsletter', subscription()), baseEnv(), brevo);
    expect([response.status, await response.json()]).toEqual([200, { ok: true }]);
  });

  it('appelle le double consentement natif de Brevo avec les attributs de consentement', async () => {
    mockNetwork('newsletter');
    const brevo = new BrevoProvider({ apiKey: 'cle', templateId: 7, redirectionUrl: `${ORIGIN}/newsletter/confirmation/`, listIds: { generale: 3 } });
    await handleNewsletter(post('/api/newsletter', subscription()), baseEnv(), brevo, new Date('2026-09-28T16:00:00Z'));
    expect(outgoing[0]?.url).toBe(`${BREVO_API}/contacts/doubleOptinConfirmation`);
    expect(outgoing[0]?.headers.get('api-key')).toBe('cle');
    expect(outgoing[0]?.body).toMatchObject({
      email: 'lecteur@exemple.ca',
      includeListIds: [3],
      templateId: 7,
      redirectionUrl: 'https://site.test/newsletter/confirmation/',
      attributes: { CONSENT_AT: '2026-09-28T16:00:00.000Z', CONSENT_TEXT_VERSION: 'abcdef012345', NL_LIST: 'generale', NL_TAGS: 'article' },
    });
  });
});

describe('formulaire de contact', () => {
  const message = (extra: Record<string, string> = {}) => ({
    name: 'Camille\u0007 Tremblay',
    email: 'camille@exemple.ca',
    topic: 'erreur',
    message: 'Une date semble erronée dans cet article.',
    page: '/articles/un-article/',
    'cf-turnstile-response': 'jeton',
    ...extra,
  });

  it('transmet le message à l’auteur, réponse au lecteur, sans rien conserver', async () => {
    mockNetwork('contact');
    const mailer = new MemoryMailer();
    const response = await handleContact(post('/api/contact', message()), baseEnv({ CONTACT_TO: 'auteur@exemple.ca' }), mailer);
    expect(response.status).toBe(200);
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0]).toMatchObject({ to: 'auteur@exemple.ca', replyTo: { email: 'camille@exemple.ca', name: 'Camille Tremblay' } });
    expect(mailer.sent[0]?.subject).toContain('Signaler une erreur');
    expect(mailer.sent[0]?.text).toContain('https://site.test/articles/un-article/');
    expect(mailer.sent[0]?.text).toContain('Une date semble erronée dans cet article.');
  });

  it('refuse un message trop court, un sujet inconnu, une page externe, et sans adresse de réception', async () => {
    mockNetwork('contact');
    const mailer = new MemoryMailer();
    const env = baseEnv({ CONTACT_TO: 'auteur@exemple.ca' });
    const status = async (fields: Record<string, string>, e = env) => (await handleContact(post('/api/contact', fields), e, mailer)).status;
    expect(await status(message({ message: 'court' }))).toBe(400);
    expect(await status(message({ topic: 'publicite' }))).toBe(400);
    expect(await status(message({ page: 'https://ailleurs.test/' }))).toBe(400);
    expect(await status(message({ name: 'Camille\nBcc: autre@exemple.ca' }))).toBe(400);
    expect(await status(message({ 'cf-turnstile-response': 'faux' }))).toBe(403);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await status(message(), baseEnv())).toBe(503);
    errors.mockRestore();
    expect(mailer.sent).toHaveLength(0);
    // Essai en mémoire : aucun envoi réel, aucune adresse de réception exigée.
    expect(await status(message(), baseEnv({ MEMORY_SERVICES: 'true' }))).toBe(200);
    expect(mailer.sent[0]?.to).toBe('essai@exemple.invalid');
  });

  it('envoie par l’API transactionnelle de Brevo', async () => {
    mockNetwork('contact');
    await new BrevoMailer('cle', { email: 'site@exemple.ca', name: 'Site' }).send({ to: 'a@exemple.ca', replyTo: { email: 'b@exemple.ca', name: 'B' }, subject: 'S', text: 'T' });
    expect(outgoing[0]).toMatchObject({ url: `${BREVO_API}/smtp/email`, body: { sender: { email: 'site@exemple.ca', name: 'Site' }, to: [{ email: 'a@exemple.ca' }], replyTo: { email: 'b@exemple.ca', name: 'B' }, subject: 'S', textContent: 'T', htmlContent: '<p>T</p>' } });
  });
});

describe('protections communes', () => {
  it('renvoie à la page du formulaire un envoi sans JavaScript, sans rien traiter', async () => {
    const request = post('/api/newsletter', subscription(), { accept: 'text/html', referer: `${ORIGIN}/articles/un-article/?x=1` });
    const response = await handleNewsletter(request, baseEnv(), new MemoryProvider());
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(`${ORIGIN}/articles/un-article/`);
    const foreign = await handleContact(post('/api/contact', {}, { accept: 'text/html', referer: 'https://ailleurs.test/page/' }), baseEnv(), new MemoryMailer());
    expect(foreign.headers.get('location')).toBe(`${ORIGIN}/`);
  });

  it('refuse un corps trop gros même sans Content-Length', async () => {
    mockNetwork('newsletter');
    const big = new URLSearchParams(subscription({ remplissage: 'x'.repeat(9000) })).toString();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const bytes = new TextEncoder().encode(big);
        for (let i = 0; i < bytes.length; i += 1000) controller.enqueue(bytes.slice(i, i + 1000));
        controller.close();
      },
    });
    const request = new Request(`${ORIGIN}/api/newsletter`, {
      method: 'POST',
      body: stream,
      duplex: 'half',
      headers: { origin: ORIGIN, accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
    } as RequestInit);
    expect(request.headers.get('content-length')).toBeNull();
    expect((await handleNewsletter(request, baseEnv(), new MemoryProvider())).status).toBe(413);
  });

  it('compte les sauts de ligne comme le navigateur (CRLF à l’envoi)', () => {
    const rule = text(10, 20);
    // 19 caractères pour le navigateur, 21 transmis avec des CRLF.
    expect(rule('ligne un\r\nligne deux')).toBe('ligne un\nligne deux');
    expect(rule(' '.repeat(12))).toBeUndefined();
    expect(rule('123456789 ')).toBe('123456789');
  });

  it('valide les champs sans dépendance', () => {
    const rules = { courriel: email, sujet: oneOf(['a', 'b']), nom: text(1, 5), page: optional(text(1, 10, /^\//), '') };
    expect(validate({ courriel: 'x@exemple.ca', sujet: 'a', nom: ' Lé\u0000a ' }, rules)).toEqual({ courriel: 'x@exemple.ca', sujet: 'a', nom: 'Léa', page: '' });
    expect(validate({ courriel: 'x@exemple', sujet: 'a', nom: 'Léa' }, rules)).toBeUndefined();
    expect(validate({ courriel: '.x@exemple.ca', sujet: 'a', nom: 'Léa' }, rules)).toBeUndefined();
    expect(validate({ courriel: 'x@exemple.ca', sujet: 'c', nom: 'Léa' }, rules)).toBeUndefined();
    expect(validate({ courriel: 'x@exemple.ca', sujet: 'a', nom: 'Léa', page: 'externe' }, rules)).toBeUndefined();
    expect(validate({ courriel: 'x@exemple.ca', sujet: 'a', nom: '\u0007' }, rules)).toBeUndefined();
  });

  it('réduit une adresse IPv6 à son préfixe /64 et garde une adresse IPv4 entière', () => {
    expect(ipPrefix('203.0.113.7')).toBe('203.0.113.7');
    expect(ipPrefix('2001:db8:85a3:8d3:1319:8a2e:370:7348')).toBe('2001:db8:85a3:8d3::/64');
    expect(ipPrefix('2001:db8::1')).toBe('2001:db8:0:0::/64');
    expect(ipPrefix('2001:DB8:0:0:ffff::1')).toBe('2001:db8:0:0::/64');
    expect(ipPrefix('::ffff:192.0.2.1')).toBe('192.0.2.1');
  });

  it('simule les clés d’essai de Turnstile en mode d’essai seulement, et retente une fois avec la même clé d’idempotence', async () => {
    const calls: Array<Record<string, string>> = [];
    vi.stubGlobal('fetch', async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(verifyForm(init));
      return calls.length === 1 ? new Response('panne', { status: 503 }) : Response.json({ success: true, hostname: 'site.test', action: 'newsletter' });
    });
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const expected = { ip: '203.0.113.7', hostname: 'site.test', action: 'newsletter' };
    const key = (prefix: string) => `${prefix}x0000000000000000000000000000000AA`;
    const dummy = 'XXXX.DUMMY.TOKEN.XXXX';
    // Hors du mode d'essai : clé d'essai refusée, sans appel.
    expect(await verifyTurnstile({ TURNSTILE_SECRET_KEY: key('1') }, dummy, expected)).toBe(false);
    // En mode d'essai : réponse simulée, sans appel à Cloudflare; sans clé secrète, réussite; sans jeton, échec.
    const trial = (secret?: string) => ({ TURNSTILE_SECRET_KEY: secret, MEMORY_SERVICES: 'true' });
    expect(await verifyTurnstile(trial(key('1')), dummy, expected)).toBe(true);
    expect(await verifyTurnstile(trial(key('2')), dummy, expected)).toBe(false);
    expect(await verifyTurnstile(trial(key('3')), dummy, expected)).toBe(false);
    expect(await verifyTurnstile(trial(), dummy, expected)).toBe(true);
    expect(await verifyTurnstile(trial(), '', expected)).toBe(false);
    expect(calls).toHaveLength(0);
    errors.mockRestore();
    // Clé de production : relance unique après une panne, avec la même clé d'idempotence.
    expect(await verifyTurnstile({ TURNSTILE_SECRET_KEY: 'secret' }, 'jeton', expected)).toBe(true);
    expect(calls).toHaveLength(2);
    expect(calls[0]?.idempotency_key).toMatch(/^[0-9a-f-]{36}$/);
    expect(calls[1]?.idempotency_key).toBe(calls[0]?.idempotency_key);
    // Le nom d'hôte et l'action doivent correspondre.
    expect(await verifyTurnstile({ TURNSTILE_SECRET_KEY: 'secret' }, 'jeton', { ...expected, hostname: 'autre.test' })).toBe(false);
  });

  it('marche sans aucun secret en mode d’essai (aperçus de branche)', async () => {
    const provider = new MemoryProvider();
    const response = await handleNewsletter(post('/api/newsletter', { ...subscription(), 'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX' }), { ASSETS: baseEnv().ASSETS, MEMORY_SERVICES: 'true' }, provider);
    expect(response.status).toBe(200);
    expect(provider.subscribers.size).toBe(1);
  });
});

describe('routage et tâche planifiée', () => {
  const CRON = '7,22,37,52 * * * *';

  it('sert les pages statiques et répond 404 aux autres routes /api/', async () => {
    expect(await (await worker.fetch(new Request(`${ORIGIN}/articles/`), baseEnv())).text()).toBe('page');
    expect((await worker.fetch(new Request(`${ORIGIN}/api/inconnue`), baseEnv())).status).toBe(404);
  });

  it('répond à la sonde de disponibilité : 200 si les formulaires peuvent marcher, 503 sinon', async () => {
    const health = (method: string, env: Env) => worker.fetch(new Request(`${ORIGIN}/api/sante`, { method }), env);
    const ready = await health('GET', { ASSETS: baseEnv().ASSETS, MEMORY_SERVICES: 'true' });
    expect(ready.status).toBe(200);
    expect(await ready.json()).toEqual({ ok: true });
    expect(ready.headers.get('cache-control')).toBe('no-store');
    // Secrets absents du site en ligne (sel, clé de Brevo) : l'inscription serait refusée.
    const missing = await health('GET', { ASSETS: baseEnv().ASSETS });
    expect(missing.status).toBe(503);
    expect(await missing.json()).toEqual({ ok: false, error: 'indisponible' });
    const head = await health('HEAD', { ASSETS: baseEnv().ASSETS, MEMORY_SERVICES: 'true' });
    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');
    const post = await health('POST', baseEnv());
    expect(post.status).toBe(405);
    expect(post.headers.get('allow')).toBe('GET, HEAD');
  });

  it('relance un build quand une publication programmée vient d’échoir, et chaque nuit à 5 h 07 UTC', async () => {
    const hooks: string[] = [];
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => (hooks.push(String(input)), Response.json({ success: true, result: { already_exists: hooks.length > 1 } })));
    const logs = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const schedule = (publications: string[]) =>
      baseEnv({
        DEPLOY_HOOK_URL: 'https://hook.test/build',
        ASSETS: { fetch: async () => Response.json({ version: 1, builtAt: '2026-09-28T12:00:00Z', publications }) },
      });
    const at = (iso: string) => ({ cron: CRON, scheduledTime: Date.parse(iso) });
    expect(await runScheduled(at('2026-09-28T13:07:00Z'), schedule(['2026-09-28T13:00:00Z']))).toBe('reconstruction');
    expect(await runScheduled(at('2026-09-28T13:07:00Z'), schedule(['2026-09-28T14:00:00Z']))).toBe('rien');
    expect(await runScheduled(at('2026-09-28T17:07:00Z'), schedule(['2026-09-28T13:00:00Z']))).toBe('rien');
    expect(await runScheduled(at('2026-09-29T05:07:00Z'), schedule([]))).toBe('reconstruction');
    expect(hooks).toEqual(['https://hook.test/build', 'https://hook.test/build']);
    expect(logs.mock.calls.flat().join(' ')).toMatch(/déjà en file \(reconstruction nocturne\)/);
    logs.mockRestore();
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await runScheduled(at('2026-09-29T05:07:00Z'), baseEnv())).toBe('sans-hook');
    errors.mockRestore();
  });

  it('relance la reconstruction nocturne manquée pendant deux heures, tant que le site date d’avant 5 h 07', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ success: true, result: {} }));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const built = (builtAt: string) =>
      baseEnv({ DEPLOY_HOOK_URL: 'https://hook.test/build', ASSETS: { fetch: async () => Response.json({ version: 1, builtAt, publications: [] }) } });
    const at = (iso: string) => ({ cron: CRON, scheduledTime: Date.parse(iso) });
    expect(await runScheduled(at('2026-09-29T05:22:00Z'), built('2026-09-28T05:09:00Z'))).toBe('reconstruction');
    expect(await runScheduled(at('2026-09-29T05:22:00Z'), built('2026-09-29T05:09:00Z'))).toBe('rien');
    expect(await runScheduled(at('2026-09-29T07:22:00Z'), built('2026-09-28T05:09:00Z'))).toBe('rien');
    expect(await runScheduled(at('2026-09-29T04:52:00Z'), built('2026-09-28T05:09:00Z'))).toBe('rien');
    // Sans /schedule.json lisible : au seul passage de 5 h 07.
    const missing = baseEnv({ DEPLOY_HOOK_URL: 'https://hook.test/build', ASSETS: { fetch: async () => new Response('', { status: 404 }) } });
    expect(await runScheduled(at('2026-09-29T05:07:00Z'), missing)).toBe('reconstruction');
    expect(await runScheduled(at('2026-09-29T05:22:00Z'), missing)).toBe('rien');
  });

  it('passe à 5 h 07 UTC avec l’expression de wrangler.jsonc', () => {
    const config = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
    const crons = JSON.parse(/"crons"\s*:\s*(\[[^\]]*\])/.exec(config)?.[1] ?? '[]') as string[];
    expect(crons).toEqual([CRON]);
    const [minutes = '', hours = ''] = CRON.split(' ');
    expect(minutes.split(',')).toContain('7');
    expect(hours).toBe('*');
    expect(isNightly(Date.parse('2026-09-29T05:07:00Z'))).toBe(true);
    expect(isNightly(Date.parse('2026-09-29T05:22:00Z'))).toBe(false);
  });
});
