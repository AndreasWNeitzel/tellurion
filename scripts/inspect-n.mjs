import { chromium } from 'playwright';
import { startStaticServer } from '../tests/helpers/static-server.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const { server, url: baseUrl } = await startStaticServer(ROOT);
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(`${baseUrl}/playgrounds/mc-integration-convergence/index.html`);
await page.waitForTimeout(2000);
const inspect = await page.evaluate(() => {
  const sqrts = document.querySelectorAll('.katex .sqrt');
  for (const sq of sqrts) {
    const nspan = sq.querySelector('.mord.mathnormal');
    if (nspan && nspan.textContent === 'N') {
      const s = getComputedStyle(nspan);
      const r = nspan.getBoundingClientRect();
      return {
        text: nspan.textContent,
        rect: { x: r.x, y: r.y, w: r.width, h: r.height },
        color: s.color, fontSize: s.fontSize, display: s.display,
        opacity: s.opacity, visibility: s.visibility,
        parentTop: getComputedStyle(nspan.parentElement).top,
        gpTop: getComputedStyle(nspan.parentElement.parentElement).top,
      };
    }
  }
  return 'no N found';
});
console.log(inspect);
await browser.close();
await server.closePromise();
