import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from '../tests/helpers/static-server.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { server, url } = await startStaticServer(ROOT);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1180, height: 1000 } });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push(String(e)));
await page.goto(`${url}/playgrounds/_heroes/exoplanet-transit-3d/index.html`, { waitUntil: 'load', timeout: 25000 });
for (const [tag, name] of [['c', 'central transit'], ['g', 'grazing transit'], ['n', 'no transit'], ['h', 'hot Jupiter'], ['e', 'Earth analogue']]) {
  await page.evaluate((n) => {
    const s = document.querySelectorAll('select');
    for (const e of s) if ([...e.options].some(o => o.text === n)) { e.value = n; e.dispatchEvent(new Event('change', { bubbles: true })); }
  }, name);
  await page.waitForTimeout(200);
  // Reset (sets sim.t = 0); then advance just over a period/4 in real-time to reach phase ~ 0.25 (transit).
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    const r = btns.find(b => b.textContent.trim() === 'Reset');
    if (r) r.click();
  });
  // The sim runs at "one full orbit in ~6 seconds" regardless of physical period, so phase = sim.t / period = realtime / 6.
  // To reach phase 0.25 we wait 1.5 s.
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `/tmp/tx2-${tag}.png` });
  const ro = await page.evaluate(() => document.getElementById('readout').textContent.replace(/\s+/g, ' ').trim());
  console.log(tag, name, '|', ro);
}
console.log('errs=', errs.length ? errs.slice(0, 5).join(' || ') : 'none');
await browser.close(); server.close();
