import { test, expect } from '@playwright/test';

test('Check viewport', async ({ page }) => {
  await page.goto('http://example.com');
  const viewport = page.viewportSize();
  console.log('Viewport:', viewport);
});
