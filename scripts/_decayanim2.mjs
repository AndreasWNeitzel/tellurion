import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from '../tests/helpers/static-server.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { server, url } = await startStaticServer(ROOT);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1320, height: 1200 } });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push(String(e)));
await page.goto(`${url}/playgrounds/bsc-y2s2/FIS2003-nuclear-decay-chain-animation/index.html`, { waitUntil: 'load', timeout: 25000 });
// Set step 5, set speed slow (0.3x) so animation can be seen across screenshots
await page.evaluate(() => {
  const ins = [...document.querySelectorAll('input[type=range]')];
  ins[0].value = '5'; ins[0].dispatchEvent(new Event('input', { bubbles: true }));      // decay step
  ins[1].value = '0.5'; ins[1].dispatchEvent(new Event('input', { bubbles: true }));    // speed
});
const canvasBB = await page.evaluate(() => {
  const c = document.getElementById('stage');
  const r = c.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
console.log('canvas bb', canvasBB);
for (let i = 0; i < 10; i += 1) {
  await page.waitForTimeout(400);
  await page.screenshot({
    path: `/tmp/decayanim2-${i}.png`,
    clip: { x: canvasBB.x, y: canvasBB.y, width: canvasBB.w, height: canvasBB.h },
  });
}
console.log('errs=', errs.length ? errs.slice(0, 5).join(' || ') : 'none');
await browser.close(); server.close();
