import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from '../tests/helpers/static-server.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { server, url } = await startStaticServer(ROOT);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push(String(e)));
await page.goto(`${url}/playgrounds/bsc-y2s2/FIS2003-nuclear-decay-chain-animation/index.html`, { waitUntil: 'load', timeout: 25000 });
// Move to step 5 (Ra-226 alpha decay)
await page.evaluate(() => {
  const inp = document.querySelector('input[type=range]');
  if (inp) { inp.value = '5'; inp.dispatchEvent(new Event('input', { bubbles: true })); }
});
// Wait small intervals to capture animation progress
for (let i = 0; i < 8; i += 1) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `/tmp/decayanim-${i}.png`, clip: { x: 0, y: 200, width: 600, height: 500 } });
}
console.log('errs=', errs.length ? errs.slice(0, 5).join(' || ') : 'none');
await browser.close(); server.close();
