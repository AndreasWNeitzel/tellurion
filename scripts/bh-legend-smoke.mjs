import { chromium } from 'playwright';
import { startStaticServer } from '/home/aneitzel/projects/portfolio/playgrounds-portfolio/tests/helpers/static-server.mjs';
const { server, url } = await startStaticServer('/home/aneitzel/projects/portfolio/playgrounds-portfolio');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 1.0, reducedMotion: 'no-preference' });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERR', e.message));
const modes = ['overview', 'photons', 'lensing', 'shadow', 'framedrag', 'spacetime', 'ringdown', 'hawking', 'tde', 'tidal'];
for (const m of modes) {
  await page.goto(`${url}/playgrounds/_legends/blackhole-legend-3d/index.html?seed=0xC0FFEE`);
  await page.waitForFunction('window.__simulationReady === true', { timeout: 30000 });
  await page.evaluate((mode) => {
    const sel = document.getElementById('select-mode');
    sel.value = mode; sel.dispatchEvent(new Event('input'));
    if (mode === 'framedrag') {
      const c = document.getElementById('slider-chi');
      c.value = '0.9'; c.dispatchEvent(new Event('input'));
      const e = document.getElementById('t-ergo'); e.checked = true; e.dispatchEvent(new Event('change'));
    }
    if (mode === 'ringdown') {
      const c = document.getElementById('slider-chi');
      c.value = '0.7'; c.dispatchEvent(new Event('input'));
    }
  }, m);
  // Particle-driven modes: step the simulation explicitly (headless rAF
  // is throttled to ~1 fps and would barely advance the cluster).
  if (m === 'tidal') {
    await page.evaluate(() => window.__bh_advance && window.__bh_advance(28));
  } else if (m === 'tde') {
    await page.evaluate(() => window.__bh_advance && window.__bh_advance(36));
  } else if (m === 'framedrag') {
    await page.evaluate(() => window.__bh_advance && window.__bh_advance(18));
  }
  await page.waitForTimeout(700);
  const stage = await page.locator('#stage').boundingBox();
  const buf = await page.screenshot({ clip: { x: stage.x, y: stage.y, width: Math.min(stage.width, 1000), height: Math.min(stage.height, 720) } });
  const fs = await import('node:fs/promises');
  await fs.writeFile(`/tmp/bh-legend-${m}.png`, buf);
  console.log(`${m}: shot saved ${buf.length}B`);
}
await browser.close();
await server.closePromise();
