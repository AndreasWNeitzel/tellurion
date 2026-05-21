// Screenshot all 8 BH-legend modes for live inspection.
import { chromium } from 'playwright';
import { startStaticServer } from '/home/aneitzel/projects/portfolio/playgrounds-portfolio/tests/helpers/static-server.mjs';
import fs from 'node:fs/promises';

const { server, url } = await startStaticServer('/home/aneitzel/projects/portfolio/playgrounds-portfolio');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 720 }, deviceScaleFactor: 1.0 });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERR', e.message));
const modes = ['overview', 'photons', 'lensing', 'framedrag', 'spacetime', 'ringdown', 'hawking', 'tde'];
for (const m of modes) {
  await page.goto(`${url}/playgrounds/_legends/blackhole-legend-3d/index.html?seed=0xC0FFEE&deterministic=1&capture=t-000&captureFraction=0`);
  await page.waitForFunction('window.__simulationReady === true', { timeout: 30000 });
  await page.evaluate((mode) => {
    const sel = document.getElementById('select-mode');
    sel.value = mode; sel.dispatchEvent(new Event('input'));
  }, m);
  await page.waitForTimeout(700);
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 1000, height: 720 } });
  await fs.writeFile(`/tmp/bh-mode-${m}.png`, buf);
  console.log(`${m}: ${buf.length}B`);
}
await browser.close();
await server.closePromise();
