import { chromium } from 'playwright';
import { startStaticServer } from '../tests/helpers/static-server.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const { server, url: baseUrl } = await startStaticServer(ROOT);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(`${baseUrl}/playgrounds/damped-driven-oscillator/index.html`);
await page.waitForTimeout(3000);
const inner = await page.evaluate(() => {
  const sqrts = document.querySelectorAll('.katex .sqrt');
  return Array.from(sqrts).slice(0, 3).map(sq => {
    const inner = sq.querySelector('.mord');
    const styles = inner ? getComputedStyle(inner) : null;
    const rect = inner ? inner.getBoundingClientRect() : null;
    return {
      sqrtRect: sq.getBoundingClientRect(),
      innerColor: styles ? styles.color : null,
      innerOpacity: styles ? styles.opacity : null,
      innerVisibility: styles ? styles.visibility : null,
      innerRect: rect,
      innerText: inner ? inner.textContent.slice(0, 100) : null,
    };
  });
});
console.log(JSON.stringify(inner, null, 2));
await browser.close();
await server.closePromise();
