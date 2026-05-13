import { chromium } from 'playwright';
import { startStaticServer } from '../tests/helpers/static-server.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const { server, url: baseUrl } = await startStaticServer(ROOT);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();
await page.goto(`${baseUrl}/playgrounds/mc-integration-convergence/index.html`);
await page.waitForTimeout(2500);
// find first sqrt and screenshot it
const handle = await page.evaluateHandle(() => {
  return Array.from(document.querySelectorAll('.katex .sqrt')).find(sq => {
    return sq.textContent.includes('N');
  });
});
const el = handle.asElement();
if (el) {
  const box = await el.boundingBox();
  await page.screenshot({ path: path.join(ROOT, 'tests', 'audit-snaps', 'sqrt-zoom.png'),
    clip: { x: Math.max(0, box.x - 30), y: Math.max(0, box.y - 30), width: box.width + 60, height: box.height + 60 } });
  console.log('saved sqrt zoom', box);
}
await browser.close();
await server.closePromise();
