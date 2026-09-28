// Parcours principaux : inscription à l'infolettre (Worker en mode d'essai, faux Turnstile), recherche, menu
// mobile, bascule du thème, route du Worker. Textes lus dans la configuration, comme sur le site.
import { expect, test } from '@playwright/test';
import newsletter from '../../config/newsletter.json' with { type: 'json' };
import { frenchTypography } from '../../src/lib/typo.ts';
import { axeViolations, fakeTurnstile, watchErrors } from './helpers.ts';

test('inscription à l’infolettre depuis sa page : succès en mode d’essai', async ({ page }) => {
  const errors = watchErrors(page);
  await fakeTurnstile(page);
  await page.goto('/newsletter/');
  const form = page.locator('main form[action="/api/newsletter"]').first();
  await form.getByLabel(newsletter.texts.emailLabel).fill('lecteur@exemple.ca');
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
  let posted = false;
  page.on('request', (request) => {
    if (request.url().endsWith('/api/newsletter')) posted = true;
  });
  await form.getByRole('button', { name: newsletter.texts.button }).click();
  await expect(form.getByRole('checkbox')).toHaveJSProperty('validity.valid', false);
  expect(posted).toBe(false);
});

test('le Worker répond aux routes /api/ : méthode refusée, route inconnue', async ({ request }) => {
  const get = await request.get('/api/newsletter');
  expect(get.status()).toBe(405);
  expect(get.headers()['content-security-policy']).toContain("default-src 'none'");
  expect((await request.get('/api/inconnue')).status()).toBe(404);
});

test('recherche : des résultats pour un terme du site', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/recherche/?q=stablecoins');
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
