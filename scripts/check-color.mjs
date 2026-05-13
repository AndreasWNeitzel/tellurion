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
await page.goto(`${baseUrl}/playgrounds/predator-prey-hopf/index.html`);
await page.waitForTimeout(2000);
const info = await page.evaluate(() => {
  const sqrt = Array.from(document.querySelectorAll('.katex .sqrt')).find(s => s.textContent.includes('K−KH'));
  if (!sqrt) return 'no sqrt';
  // walk through descendants printing color
  const out = [];
  function walk(el, depth = 0) {
    if (depth > 8) return;
    const s = getComputedStyle(el);
    if (el.textContent && el.textContent.trim().length > 0 && el.textContent.trim().length < 10) {
      out.push({
        tag: el.tagName,
        cls: el.className.toString().slice(0, 60),
        text: el.textContent.slice(0, 20),
        color: s.color,
        opacity: s.opacity,
        background: s.background.slice(0, 30),
      });
    }
    for (const c of el.children) walk(c, depth + 1);
  }
  walk(sqrt);
  return out;
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
await server.closePromise();
