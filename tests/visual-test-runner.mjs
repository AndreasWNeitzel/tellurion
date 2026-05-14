// Shared visual-test runner used by playgrounds/_heroes/*/visual.test.mjs.
// Hero pages live one directory deeper than year/UC playgrounds, so the relative
// helper path is the same: ../../../tests/helpers/.
import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { compareImagesSSIM } from './helpers/ssim.mjs';
import { startStaticServer } from './helpers/static-server.mjs';

const SEED = '0xC0FFEE';
const FRAMES = ['t-000', 't-025', 't-050', 't-075', 't-100'];
const FRACTION = { 't-000': 0, 't-025': 0.25, 't-050': 0.5, 't-075': 0.75, 't-100': 1 };
const SSIM_MIN = 0.92;

export async function runVisualTest(page, relPgDir) {
  // (kept for backwards-compat; the new pattern uses registerVisualGate below).
  const PROJECT_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  const PLAYGROUND_DIR = path.resolve(PROJECT_ROOT, relPgDir);
  const URL_PATH = relPgDir.split(path.sep).join('/');
  const GOLDEN_DIR = path.join(PLAYGROUND_DIR, 'references', 'golden-frames');
  const { server, url: baseUrl } = await startStaticServer(PROJECT_ROOT);
  try {
    for (const frameName of FRAMES) {
      const url = new URL(`${baseUrl}/${URL_PATH}/index.html`);
      url.searchParams.set('seed', SEED);
      url.searchParams.set('deterministic', '1');
      url.searchParams.set('capture', frameName);
      url.searchParams.set('captureFraction', String(FRACTION[frameName]));
      await page.goto(url.toString());
      await page.waitForFunction('window.__simulationReady === true', { timeout: 30_000 });
      await page.waitForTimeout(50);
      const screenshot = await page.locator('#stage').screenshot();
      const golden = await fs.readFile(path.join(GOLDEN_DIR, `${frameName}.png`));
      const ssim = await compareImagesSSIM(screenshot, golden);
      expect(ssim).toBeGreaterThan(SSIM_MIN);
    }
  } finally {
    await server.closePromise();
  }
}

// Preferred pattern: register a full describe/beforeAll/tests block from the test file.
export function registerVisualGate(pgDir, title) {
  const PROJECT_ROOT = path.resolve(pgDir, '..', '..', '..');
  const GOLDEN_DIR = path.join(pgDir, 'references', 'golden-frames');
  let server, baseUrl;
  test.beforeAll(async () => { const s = await startStaticServer(PROJECT_ROOT); server = s.server; baseUrl = s.url; });
  test.afterAll(async () => { if (server) await server.closePromise(); });
  const URL_PATH = path.relative(PROJECT_ROOT, pgDir).split(path.sep).join('/');
  test.describe(title, () => {
    for (const frameName of FRAMES) {
      test(`frame ${frameName} matches golden`, async ({ page }) => {
        const url = new URL(`${baseUrl}/${URL_PATH}/index.html`);
        url.searchParams.set('seed', SEED);
        url.searchParams.set('deterministic', '1');
        url.searchParams.set('capture', frameName);
        url.searchParams.set('captureFraction', String(FRACTION[frameName]));
        await page.goto(url.toString());
        await page.waitForFunction('window.__simulationReady === true', { timeout: 30_000 });
        await page.waitForTimeout(50);
        const screenshot = await page.locator('#stage').screenshot();
        const golden = await fs.readFile(path.join(GOLDEN_DIR, `${frameName}.png`));
        const ssim = await compareImagesSSIM(screenshot, golden);
        expect(ssim).toBeGreaterThan(SSIM_MIN);
      });
    }
  });
}
