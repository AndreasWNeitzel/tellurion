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
await page.goto(`${url}/playgrounds/bsc-y2s2/FIS2003-nuclear-decay-chain-animation/index.html`, { waitUntil: 'load', timeout: 25000 });
// Capture three frames at different steps to see the chain progress.
for (const [tag, step] of [['s0', 0], ['s2', 2], ['s5', 5]]) {
  await page.evaluate((s) => {
    const inp = document.querySelector('input[type=range]');
    if (inp) { inp.value = String(s); inp.dispatchEvent(new Event('input', { bubbles: true })); }
  }, step);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `/tmp/decay-${tag}.png` });
  const ro = await page.evaluate(() => document.getElementById('readout').textContent.replace(/\s+/g, ' ').trim());
  console.log(tag, '|', ro);
}
console.log('errs=', errs.length ? errs.slice(0, 5).join(' || ') : 'none');
await browser.close(); server.close();
