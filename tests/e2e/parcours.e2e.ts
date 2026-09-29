// Parcours principaux : inscription à l'infolettre (Worker en mode d'essai, faux Turnstile), recherche, menu
// mobile, bascule du thème, route du Worker. Textes lus dans la configuration, comme sur le site.
import { expect, test, type Page } from '@playwright/test';
import newsletter from '../../config/newsletter.json' with { type: 'json' };
import { frenchTypography } from '../../src/lib/typo.ts';
import { axeViolations, fakeTurnstile, watchErrors } from './helpers.ts';
import { SEARCH_TERM } from './site.ts';

// Adresse IP et adresse courriel propres à chaque passage : la limitation de débit du Worker d'essai (5 envois par
// minute et par clé) ne joue pas entre des passages rapprochés.
async function freshSender(page: Page): Promise<string> {
  const n = 1 + Math.floor(Math.random() * 254);
  await page.route('**/api/newsletter', (route) => route.continue({ headers: { ...route.request().headers(), 'cf-connecting-ip': `198.51.100.${n}` } }));
  return `lecteur-${n}-${Date.now()}@exemple.ca`;
}

test('inscription à l’infolettre depuis sa page : succès en mode d’essai', async ({ page }) => {
  const errors = watchErrors(page);
  await fakeTurnstile(page);
  const email = await freshSender(page);
  await page.goto('/newsletter/');
  const form = page.locator('main form[action="/api/newsletter"]').first();
  await form.getByLabel(newsletter.texts.emailLabel).fill(email);
  await form.getByRole('checkbox').check();
  const sent = page.waitForResponse((response) => response.url().endsWith('/api/newsletter'));
  await form.getByRole('button', { name: newsletter.texts.button }).click();
  expect((await sent).status()).toBe(200);
  await expect(form.locator('[data-form-status]')).toHaveText(frenchTypography(newsletter.texts.success));
  expect(await axeViolations(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test('inscription refusée sans consentement : le navigateur bloque l’envoi', async ({ page }) => {
  await fakeTurnstile(page);
  await page.goto('/newsletter/');
  const form = page.locator('main form[action="/api/newsletter"]').first();
  await form.getByLabel(newsletter.texts.emailLabel).fill('lecteur@exemple.ca');
  // Un envoi part après la préparation du jeton : on l'attend deux secondes.
  const posted = page.waitForRequest((request) => request.url().endsWith('/api/newsletter'), { timeout: 2000 }).then(
    () => true,
    () => false,
  );
  await form.getByRole('button', { name: newsletter.texts.button }).click();
  await expect(form.getByRole('checkbox')).toHaveJSProperty('validity.valid', false);
  expect(await posted).toBe(false);
});

test('le Worker répond aux routes /api/ : méthode refusée, route inconnue, sonde de disponibilité', async ({ request }) => {
  const get = await request.get('/api/newsletter');
  expect(get.status()).toBe(405);
  expect(get.headers()['content-security-policy']).toContain("default-src 'none'");
  expect((await request.get('/api/inconnue')).status()).toBe(404);
  // Mode d'essai : fournisseur en mémoire et sel fixe, les formulaires peuvent marcher.
  expect(await (await request.get('/api/sante')).json()).toEqual({ ok: true });
});

test('recherche : des résultats pour un terme du site', async ({ page }) => {
  test.skip(!SEARCH_TERM, 'aucun article à chercher');
  const errors = watchErrors(page);
  await page.goto(`/recherche/?q=${encodeURIComponent(SEARCH_TERM)}`);
  await expect(page.locator('[data-search-results] a').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('menu mobile : ouverture, fermeture par Échap', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'menu propre aux petits écrans');
  await page.goto('/');
  const drawer = page.locator('dialog[data-drawer]');
  await page.locator('[data-drawer-open]').click();
  await expect(drawer).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
});

test('fenêtre de recherche : Ctrl K, puis Échap', async ({ page, isMobile }) => {
  test.skip(isMobile, 'raccourci clavier des grands écrans');
  await page.goto('/');
  await page.keyboard.press('Control+k');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('searchbox').or(dialog.locator('input[type="search"]')).first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('bascule du thème : sombre, mémorisé d’une page à l’autre', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const toggle = page.locator('header [data-theme-toggle]').first();
  if (!(await toggle.isVisible())) await page.locator('[data-drawer-open]').click();
  await page.locator('[data-theme-toggle]:visible').first().click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.goto('/lexique/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
