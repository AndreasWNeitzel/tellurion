import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['**/visual.test.mjs', 'tests/**/*.spec.{mjs,ts}'],
  fullyParallel: false,           // visual diffs are seed-deterministic but disk-bound
  forbidOnly: !!process.env.CI,
  retries: 0,                     // deterministic captures should not need retries; investigate flake
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? [['line']] : [['list']],
  use: {
    headless: true,
    viewport: { width: 800, height: 600 },
    deviceScaleFactor: 2,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    colorScheme: 'light',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
