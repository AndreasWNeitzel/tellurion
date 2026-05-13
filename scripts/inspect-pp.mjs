import { chromium } from 'playwright';
import { startStaticServer } from '../tests/helpers/static-server.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const { server, url: baseUrl } = await startStaticServer(ROOT);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(`${baseUrl}/playgrounds/predator-prey-hopf/index.html`);
await page.waitForTimeout(2000);
const info = await page.evaluate(() => {
  // find the sqrt span for K - K_H
  const sqrts = Array.from(document.querySelectorAll('.katex .sqrt'));
  return sqrts.map(sq => {
    const r = sq.getBoundingClientRect();
    return {
      text: sq.textContent.slice(0, 30),
      x: r.x, y: r.y, w: r.width, h: r.height,
      katexText: sq.closest('.katex').textContent.slice(0, 60),
      overflow: getComputedStyle(sq).overflow,
    };
  });
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
await server.closePromise();
