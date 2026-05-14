import { test } from '@playwright/test';
import { runVisualTest } from '../../../tests/visual-test-runner.mjs';
test('earth-axial-precession-nutation-3d visual', async ({ page }) => { await runVisualTest(page, 'playgrounds/_heroes/earth-axial-precession-nutation-3d'); });
