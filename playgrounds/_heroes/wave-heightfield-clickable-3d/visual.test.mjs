import { test } from '@playwright/test';
import { runVisualTest } from '../../../tests/visual-test-runner.mjs';
test('wave-heightfield visual', async ({ page }) => { await runVisualTest(page, 'playgrounds/_heroes/wave-heightfield-clickable-3d'); });
