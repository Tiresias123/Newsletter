// Outils des parcours de fumée : faux Turnstile (aucun appel à Cloudflare), erreurs de la page, analyse axe.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { Page } from '@playwright/test';

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

// Script servi à la place de celui de Turnstile, à la même adresse (la CSP du site l'autorise) : il rend un
// jeton factice, comme la clé d'essai de Cloudflare, en donne un nouveau après chaque réinitialisation, puis
// appelle le rappel que nomme le paramètre onload, comme le vrai script.
const fakeTurnstileScript = (onload: string) => `
  (() => {
    const widgets = new Map();
    const issue = (id) => setTimeout(() => widgets.get(id)?.callback?.('XXXX.DUMMY.TOKEN.XXXX'), 50);
    window.turnstile = {
      render(container, options) { const id = 'essai-' + (widgets.size + 1); widgets.set(id, options); issue(id); return id; },
      reset(id) { issue(id); },
      remove(id) { widgets.delete(id); },
      getResponse() { return 'XXXX.DUMMY.TOKEN.XXXX'; },
    };
    window[${JSON.stringify(onload)}]?.();
  })();
`;

// Seule l'adresse documentée du script (chargement explicite, rappel nommé) reçoit le double : toute autre
// requête vers Cloudflare échoue, et avec elle le parcours (adresse mal écrite, paramètre oublié).
export async function fakeTurnstile(page: Page): Promise<void> {
  await page.route('https://challenges.cloudflare.com/**', (route) => {
    const address = new URL(route.request().url());
    const onload = address.searchParams.get('onload');
    if (address.pathname !== '/turnstile/v0/api.js' || address.searchParams.get('render') !== 'explicit' || !onload) return route.abort();
    return route.fulfill({ contentType: 'text/javascript', body: fakeTurnstileScript(onload) });
  });
}

// Erreurs de la page : exceptions, messages d'erreur de la console (dont les violations de la CSP), ressources
// en échec, avec leur adresse (la console ne la donne pas : sa ligne « Failed to load resource » est écartée,
// ce qui laisse aussi passer le code 404 attendu d'une page introuvable).
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`exception : ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) errors.push(`console : ${message.text()}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && response.request().resourceType() !== 'document') errors.push(`HTTP ${response.status()} : ${response.url()}`);
  });
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText ?? '';
    if (!failure.includes('ERR_ABORTED')) errors.push(`échec : ${request.url()} (${failure})`);
  });
  return errors;
}

type AxeViolation = { id: string; impact: string | null; help: string; nodes: Array<{ target: unknown[] }> };

// Violations des règles WCAG 2.2 A et AA (axe-core), résumées : règle, gravité, premiers éléments en cause.
export async function axeViolations(page: Page): Promise<string[]> {
  // Transitions finies (changement de thème, survol) : sinon le contraste se mesure sur des couleurs
  // intermédiaires.
  await page.waitForFunction(() => document.getAnimations().every((animation) => !(animation instanceof CSSTransition) || animation.playState !== 'running'));
  // Injecté par le protocole du navigateur, hors de la CSP de la page (un script ajouté serait refusé).
  await page.evaluate(AXE);
  const violations = await page.evaluate(
    async () =>
      (
        await (window as unknown as { axe: { run(context: Document, options: unknown): Promise<{ violations: AxeViolation[] }> } }).axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
        })
      ).violations,
  );
  return violations.map((v) => `${v.id} (${v.impact}) : ${v.help} : ${v.nodes.slice(0, 3).map((n) => JSON.stringify(n.target)).join(', ')}`);
}

// Débordement horizontal de la page, en pixels (0 attendu).
export const horizontalOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
