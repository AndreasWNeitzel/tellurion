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
await page.goto(`${url}/playgrounds/_heroes/exoplanet-interior-3d/index.html`, { waitUntil: 'load', timeout: 25000 });
for (const [tag, name] of [['e', 'Earth-like'], ['m', 'Mercury-like (iron-rich)'], ['o', 'ocean world'], ['n', 'mini-Neptune']]) {
  await page.evaluate((n) => {
    const sels = [...document.querySelectorAll('select')];
    for (const s of sels) if ([...s.options].some(o => o.text === n)) { s.value = n; s.dispatchEvent(new Event('change', { bubbles: true })); }
  }, name);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `/tmp/int-${tag}.png` });
  const ro = await page.evaluate(() => document.getElementById('readout').textContent.replace(/\s+/g, ' ').trim());
  console.log(tag, name, '|', ro);
}
console.log('errs=', errs.length ? errs.slice(0, 5).join(' || ') : 'none');
await browser.close(); server.close();
