import { test } from '@playwright/test';
import { runVisualTest } from '../../../tests/visual-test-runner.mjs';
test('tokamak-plasma-confinement-3d visual', async ({ page }) => { await runVisualTest(page, 'playgrounds/_heroes/tokamak-plasma-confinement-3d'); });
