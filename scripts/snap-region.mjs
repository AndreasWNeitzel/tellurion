import { chromium } from 'playwright';
import { startStaticServer } from '../tests/helpers/static-server.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const slug = process.argv[2];
if (!slug) { console.error('slug required'); process.exit(1); }
const { server, url: baseUrl } = await startStaticServer(ROOT);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();
await page.goto(`${baseUrl}/playgrounds/${slug}/index.html`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const out = path.join(ROOT, 'tests', 'audit-snaps', `${slug}-zoom.png`);
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1400, height: 500 } });
console.log('saved', out);
await browser.close();
await server.closePromise();
