// Accretion Disk Temperature Profile visual gate.
// Captures five reference frames via Playwright and diffs against committed goldens.
// Serves the project over http://127.0.0.1 because Chromium blocks ES-module imports from file://.

import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareImagesSSIM } from '../../tests/helpers/ssim.mjs';
import { startStaticServer } from '../../tests/helpers/static-server.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLAYGROUND_DIR = __dirname;
const PROJECT_ROOT   = path.resolve(PLAYGROUND_DIR, '..', '..');
const GOLDEN_DIR     = path.join(PLAYGROUND_DIR, 'references', 'golden-frames');
const SEED           = '0xC0FFEE';
const FRAMES         = ['t-000', 't-025', 't-050', 't-075', 't-100'];
const SSIM_MIN       = 0.92;

let server, baseUrl;

test.beforeAll(async () => {
  const started = await startStaticServer(PROJECT_ROOT);
  server  = started.server;
  baseUrl = started.url;
});

test.afterAll(async () => {
  if (server) await server.closePromise();
});

const PG_SLUG = path.basename(PLAYGROUND_DIR);
const FRACTION = { 't-000': 0, 't-025': 0.25, 't-050': 0.5, 't-075': 0.75, 't-100': 1 };

test.describe('Accretion Disk Temperature Profile visual gate', () => {
  for (const frameName of FRAMES) {
    test(`frame ${frameName} matches golden`, async ({ page }) => {
      const url = new URL(`${baseUrl}/playgrounds/${PG_SLUG}/index.html`);
      url.searchParams.set('seed', SEED);
      url.searchParams.set('deterministic', '1');
      url.searchParams.set('capture', frameName);
      url.searchParams.set('captureFraction', String(FRACTION[frameName]));
      await page.goto(url.toString());
      await page.waitForFunction('window.__simulationReady === true', { timeout: 30_000 });
      await page.waitForTimeout(50);

      const screenshot = await page.locator('#stage').screenshot();
      const goldenPath = path.join(GOLDEN_DIR, `${frameName}.png`);
      const golden     = await fs.readFile(goldenPath);

      const ssim = await compareImagesSSIM(screenshot, golden);
      expect(ssim).toBeGreaterThan(SSIM_MIN);
    });
  }
});
