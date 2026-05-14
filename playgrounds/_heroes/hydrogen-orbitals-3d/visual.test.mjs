import { test } from '@playwright/test';
import { runVisualTest } from '../../../tests/visual-test-runner.mjs';
test('hydrogen-orbitals-3d visual', async ({ page }) => { await runVisualTest(page, 'playgrounds/_heroes/hydrogen-orbitals-3d'); });
