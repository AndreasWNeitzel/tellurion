import { test } from '@playwright/test';
import { runVisualTest } from '../../../tests/visual-test-runner.mjs';
test('lorenz-attractor-3d-ensemble visual', async ({ page }) => { await runVisualTest(page, 'playgrounds/_heroes/lorenz-attractor-3d-ensemble'); });
