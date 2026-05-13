// __TITLE__ visual gate.
// Captures five reference frames via Playwright and diffs against committed goldens.

import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { compareImagesSSIM } from '../../tests/helpers/ssim.mjs';

const PLAYGROUND_DIR = path.dirname(new URL(import.meta.url).pathname);
const GOLDEN_DIR     = path.join(PLAYGROUND_DIR, 'references', 'golden-frames');
const SEED           = '0xC0FFEE';
const FRAMES         = ['t-000', 't-025', 't-050', 't-075', 't-100'];
const SSIM_MIN       = 0.92;

test.describe('__TITLE__ visual gate', () => {
  for (const frameName of FRAMES) {
    test(`frame ${frameName} matches golden`, async ({ page }) => {
      await page.goto(`file://${PLAYGROUND_DIR}/index.html?seed=${SEED}&deterministic=1&capture=${frameName}`);
      await page.waitForEvent('simulation-ready', { timeout: 30_000 });

      const screenshot = await page.locator('#stage').screenshot();
      const goldenPath = path.join(GOLDEN_DIR, `${frameName}.png`);
      const golden     = await fs.readFile(goldenPath);

      const ssim = await compareImagesSSIM(screenshot, golden);
      expect(ssim).toBeGreaterThan(SSIM_MIN);
    });
  }
});
