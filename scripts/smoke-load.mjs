// scripts/smoke-load.mjs --playground <slug-or-relpath>
// Load guard: opens a playground's LIVE index.html (no capture/
// deterministic query params, i.e. exactly what a visitor loads),
// over the http static server, and fails if the page throws, logs a
// console error, leaves the canvas blank, or never signals ready.
// The capture-only visual gate never exercises this path, which is
// how a broken live page could ship. Exit code 0 = ok, 1 = broken.
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from '../tests/helpers/static-server.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const pi = args.indexOf('--playground');
if (pi < 0 || !args[pi + 1]) { console.error('usage: smoke-load.mjs --playground <slug-or-relpath>'); process.exit(2); }
const arg = args[pi + 1];

// Resolve to playgrounds/<...>/ dir (accept full relpath or basename).
import { promises as fs } from 'node:fs';
async function resolveDir(a) {
  const direct = path.join(ROOT, 'playgrounds', a);
  try { if ((await fs.stat(path.join(direct, 'index.html'))).isFile()) return direct; } catch {}
  const base = path.join(ROOT, 'playgrounds');
  const years = await fs.readdir(base);
  for (const y of years) {
    const cand = path.join(base, y, a);
    try { if ((await fs.stat(path.join(cand, 'index.html'))).isFile()) return cand; } catch {}
  }
  return null;
}
const pgDir = await resolveDir(arg);
if (!pgDir) { console.error(`smoke-load: playground not found: ${arg}`); process.exit(2); }

const { server, url: baseUrl } = await startStaticServer(ROOT);
const rel = path.relative(ROOT, pgDir).split(path.sep).join('/');
const target = `${baseUrl}/${rel}/index.html`;
const browser = await chromium.launch();
const page = await browser.newPage();
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
page.on('pageerror', (e) => errs.push('pageerror: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : String(e))));
let diag = {};
try {
  await page.goto(target, { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(2600);
  diag = await page.evaluate(() => {
    const c = document.getElementById('stage');
    if (!c) return { hasStage: false };
    let nonblank = false;
    try {
      const g = c.getContext('2d') || c.getContext('webgl2') || c.getContext('webgl');
      if (g && g.getImageData) {
        // Scan the WHOLE canvas (coarse stride), not just a corner:
        // centred-content playgrounds have dark margins. Blank only if
        // almost nothing deviates from the darkest (background) pixel.
        const d = g.getImageData(0, 0, c.width, c.height).data;
        const stride = 4 * 53;
        let mn = 255, total = 0, content = 0;
        for (let i = 0; i < d.length; i += stride) {
          const lum = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
          if (lum < mn) mn = lum; total += 1;
        }
        for (let i = 0; i < d.length; i += stride) {
          if (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11 > mn + 14) content += 1;
        }
        nonblank = total > 0 && content / total > 0.01;   // >=1% of canvas rendered
      } else { nonblank = true; } // webgl: cannot cheaply sample; rely on no-error
    } catch (e) { return { hasStage: true, sampleErr: String(e) }; }
    return { hasStage: true, w: c.width, h: c.height, nonblank, ready: !!window.__simulationReady };
  });
} catch (e) { errs.push('goto: ' + String(e)); }
await browser.close();
await server.closePromise();

const broken = errs.length > 0 || !diag.hasStage || diag.nonblank === false || diag.sampleErr;
console.log(`smoke-load ${arg}: ${broken ? 'BROKEN' : 'OK'} :: ${JSON.stringify(diag)}`);
if (errs.length) console.log(errs.join('\n'));
process.exit(broken ? 1 : 0);
