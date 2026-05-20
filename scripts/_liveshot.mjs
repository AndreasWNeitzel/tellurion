// Local debug: screenshot a playground's LIVE page (no capture params)
// at several wall-clock times so we see exactly what a visitor sees
// over time (blank? stuck? animating?). Not a gate; repo-local.
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import { startStaticServer } from '../tests/helpers/static-server.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const arg = process.argv[2];
const outBase = process.argv[3] || '/tmp/liveshot';
async function resolveDir(a) {
  const base = path.join(ROOT, 'playgrounds');
  const years = await fs.readdir(base);
  for (const y of years) {
    const cand = path.join(base, y, a);
    try { if ((await fs.stat(path.join(cand, 'index.html'))).isFile()) return cand; } catch {}
  }
  const direct = path.join(ROOT, 'playgrounds', a);
  try { if ((await fs.stat(path.join(direct, 'index.html'))).isFile()) return direct; } catch {}
  return null;
}
const pgDir = await resolveDir(arg);
if (!pgDir) { console.error('not found', arg); process.exit(2); }
const { server, url: baseUrl } = await startStaticServer(ROOT);
const rel = path.relative(ROOT, pgDir).split(path.sep).join('/');
const target = `${baseUrl}/${rel}/index.html`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
page.on('pageerror', (e) => errs.push('pageerror: ' + String(e)));
await page.goto(target, { waitUntil: 'load', timeout: 20000 });
const times = [1000, 3500, 6500];
let prev = 0;
for (let i = 0; i < times.length; i += 1) {
  await page.waitForTimeout(times[i] - prev); prev = times[i];
  await page.screenshot({ path: `${outBase}-${i}.png` });
}
const diag = await page.evaluate(() => {
  const c = document.getElementById('stage');
  const g = c && (c.getContext('2d'));
  let frozenHint = null;
  try { frozenHint = window.__rbcFrame ?? null; } catch {}
  return { w: c && c.width, h: c && c.height, ctx2d: !!g, ready: !!window.__simulationReady };
});
console.log('LIVESHOT', arg, JSON.stringify(diag), 'errs=', errs.length ? errs.join(' || ') : 'none');
await browser.close(); await server.closePromise();
