// Parcours de fumée (npm run test:e2e) : le site construit en mode aperçu (tous les gabarits, brouillons
// compris) et servi avec son Worker en mode d'essai par wrangler dev, comme en ligne (en-têtes, CSP, /api/*).
// Chromium de Playwright; ailleurs, PLAYWRIGHT_CHROMIUM donne un autre exécutable.
import { defineConfig, devices } from '@playwright/test';

export const E2E_PORT = 8791;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: /.*\.e2e\.ts$/,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // Aucune nouvelle tentative : un échec intermittent est un défaut à corriger.
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${E2E_PORT}`,
    locale: 'fr-CA',
    timezoneId: 'America/Toronto',
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {},
  },
  projects: [
    { name: 'ordinateur', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node scripts/e2e-server.ts',
    url: `http://127.0.0.1:${E2E_PORT}/`,
    // Construction d'aperçu comprise.
    timeout: 600_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
  },
});
