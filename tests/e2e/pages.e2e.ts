// Pages principales (rubriques, pages fixes, une entrée de chaque collection, tirées du contenu) : réponse,
// repères, CSP présente, aucune erreur ni violation de la CSP, aucun débordement horizontal, accessibilité (axe,
// WCAG 2.2 AA) en thème clair et en thème sombre. De même pour la page introuvable.
import { expect, test, type Page } from '@playwright/test';
import { axeViolations, horizontalOverflow, watchErrors } from './helpers.ts';
import { PAGES } from './site.ts';

// Contrôles communs à toutes les pages, une fois la page chargée.
async function checkPage(page: Page, errors: string[], csp: string | undefined) {
  // CSP du site appliquée (dist/_headers) : sans elle, l'absence de violation ne prouverait rien.
  expect(csp).toContain("script-src 'self'");
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    expect(await axeViolations(page), `accessibilité en thème ${colorScheme === 'light' ? 'clair' : 'sombre'}`).toEqual([]);
  }
  expect(errors).toEqual([]);
}

for (const path of PAGES) {
  test(`page ${path}`, async ({ page }) => {
    const errors = watchErrors(page);
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1').first()).toBeAttached();
    await checkPage(page, errors, response?.headers()['content-security-policy']);
  });
}

test('page introuvable : code 404 et page du site', async ({ page }) => {
  const errors = watchErrors(page);
  const response = await page.goto('/cette-page-n-existe-pas/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('main h1')).toBeVisible();
  await checkPage(page, errors, response?.headers()['content-security-policy']);
});
