import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['**/visual.test.mjs', 'tests/**/*.spec.{mjs,ts}'],
  testIgnore: ['playgrounds/_template/**', 'node_modules/**', 'tests/heroes/**'],
  fullyParallel: false,           // visual diffs are seed-deterministic but disk-bound
  forbidOnly: !!process.env.CI,
  retries: 0,                     // deterministic captures should not need retries; investigate flake
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? [['line']] : [['list']],
  timeout: 60_000,                // per-test cap; some playgrounds (logistic-cobweb) precompute heavy bifurcation diagrams during boot
  expect: { timeout: 15_000 },
  use: {
    headless: true,
    // bypassCSP: waitForFunction evaluates in-page, which the playground CSP would block.
    bypassCSP: true,
    viewport: { width: 800, height: 600 },
    deviceScaleFactor: 2,
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
    colorScheme: 'light',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      // Spread the Chrome device first so explicit viewport / deviceScaleFactor below
      // override the device defaults and match scripts/capture-reference.mjs.
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 800, height: 600 },
        deviceScaleFactor: 2,
        colorScheme: 'light'
      }
    }
  ]
});
