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
const html = await page.evaluate(() => {
  // Find a katex with sqrt(N) and print its inner HTML
  const candidates = Array.from(document.querySelectorAll('.katex')).filter(k => k.textContent.includes('N'));
  return candidates.slice(0, 3).map(k => k.outerHTML);
});
console.log(html.join('\n\n========\n\n'));
await browser.close();
await server.closePromise();
