import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from '../tests/helpers/static-server.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { server, url } = await startStaticServer(ROOT);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push(String(e)));
await page.goto(`${url}/playgrounds/bsc-y2s2/FIS2003-special-relativity-spacetime-lab/index.html`, { waitUntil: 'load', timeout: 25000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `/tmp/sr-initial.png` });
// move beta slider to 0.95
await page.evaluate(() => {
  const ins = [...document.querySelectorAll('input[type=range]')];
  ins[0].value = '0.95'; ins[0].dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(1500);
await page.screenshot({ path: `/tmp/sr-fast.png` });
// move L slider to 14
await page.evaluate(() => {
  const ins = [...document.querySelectorAll('input[type=range]')];
  ins[1].value = '14'; ins[1].dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(1500);
await page.screenshot({ path: `/tmp/sr-longtrip.png` });
const ro = await page.evaluate(() => document.getElementById('readout').textContent.replace(/\s+/g, ' ').trim());
console.log('readout:', ro);
console.log('errs=', errs.length ? errs.slice(0, 5).join(' || ') : 'none');
await browser.close(); server.close();
