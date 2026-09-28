// Pages principales, une par gabarit : réponse, repères, aucune erreur ni violation de la CSP, aucun débordement
// horizontal, accessibilité (axe, WCAG 2.2 AA) en thème clair et en thème sombre.
import { expect, test } from '@playwright/test';
import { axeViolations, horizontalOverflow, watchErrors } from './helpers.ts';

const PAGES = [
  '/',
  '/articles/',
  '/articles/exemple-avis-21-332-synthese/',
  '/guides/exemple-declarer-ses-cryptoactifs/',
  '/reglementation/',
  '/fiscalite/',
  '/fiscalite/traitements/particulier-vente-canada/',
  '/dossiers/stablecoins-canada/',
  '/lexique/',
  '/lexique/jalonnement/',
  '/organismes/amf/',
  '/juridictions/quebec/',
  '/textes/avis-acvm-21-332/',
  '/formats/opinion/',
  '/auteurs/auteur-demo/',
  '/agenda/',
  '/veille/',
  '/recherche/',
  '/newsletter/',
  '/newsletter/2026-001/',
  '/contact/',
  '/confidentialite/',
];

for (const path of PAGES) {
  test(`page ${path}`, async ({ page }) => {
    const errors = watchErrors(page);
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1').first()).toBeAttached();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme });
      expect(await axeViolations(page), `accessibilité en thème ${colorScheme === 'light' ? 'clair' : 'sombre'}`).toEqual([]);
    }
    expect(errors).toEqual([]);
  });
}

test('page introuvable : code 404 et page du site', async ({ page }) => {
  const errors = watchErrors(page);
  const response = await page.goto('/cette-page-n-existe-pas/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('main h1')).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
  expect(errors).toEqual([]);
});
