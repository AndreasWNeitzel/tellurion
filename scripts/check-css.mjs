import { chromium } from 'playwright';
import { startStaticServer } from '../tests/helpers/static-server.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const { server, url: baseUrl } = await startStaticServer(ROOT);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 700 } });
const page = await ctx.newPage();
await page.goto(`${baseUrl}/playgrounds/mc-integration-convergence/index.html`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
const info = await page.evaluate(() => {
  const k = document.querySelector('.katex');
  if (!k) return 'no .katex';
  const s = getComputedStyle(k);
  return {
    whiteSpace: s.whiteSpace,
    display: s.display,
    fontSize: s.fontSize,
    width: k.getBoundingClientRect().width,
  };
});
console.log(info);
const allKatex = await page.evaluate(() => Array.from(document.querySelectorAll('.katex')).map(k => ({
  text: k.textContent.slice(0, 60),
  ws: getComputedStyle(k).whiteSpace,
})));
for (const k of allKatex.slice(0, 8)) console.log('  ', k);
await browser.close();
await server.closePromise();
