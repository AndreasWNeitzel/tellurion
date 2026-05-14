import { test } from '@playwright/test';
import { runVisualTest } from '../../../tests/visual-test-runner.mjs';
test('schwarzschild-kerr-blackhole-3d visual', async ({ page }) => { await runVisualTest(page, 'playgrounds/_heroes/schwarzschild-kerr-blackhole-3d'); });
