// Long live run: load a playground, sample the readout + canvas hash at
// intervals over ~26 s, flag divergence (non-finite / exploding number
// in the readout) or freeze. For the fluid-painter blow-up report.
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import { startStaticServer } from '../tests/helpers/static-server.mjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const arg = process.argv[2], out = process.argv[3] || '/tmp/longrun';
const base = path.join(ROOT, 'playgrounds');
let pg = null;
for (const y of await fs.readdir(base)) { const c = path.join(base, y, arg); try { if ((await fs.stat(path.join(c, 'index.html'))).isFile()) { pg = c; break; } } catch {} }
const { server, url } = await startStaticServer(ROOT);
const rel = path.relative(ROOT, pg).split(path.sep).join('/');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
await page.goto(`${url}/${rel}/index.html`, { waitUntil: 'load', timeout: 20000 });
const samples = [];
for (let t = 0; t < 7; t += 1) {
  await page.waitForTimeout(3800);
  const s = await page.evaluate(() => {
    const ri = document.getElementById('readout-invariant');
    const c = document.getElementById('stage');
    let hash = 0;
    try { const g = c.getContext('2d'); const d = g.getImageData(0, 0, c.width, Math.min(50, c.height)).data; for (let i = 0; i < d.length; i += 101) hash = (hash * 31 + d[i]) | 0; } catch {}
    return { txt: ri ? ri.textContent : '', hash };
  });
  samples.push(s);
}
await page.screenshot({ path: `${out}.png` });
await browser.close(); await server.closePromise();
// Parse the "fluid mass=NN" number from each readout.
let diverged = false;
for (const s of samples) {
  const m = (s.txt.match(/mass\s*=\s*([-\d.eE+]+|NaN|Infinity)/) || [])[1];
  const v = Number(m);
  if (!Number.isFinite(v) || Math.abs(v) > 1e7) diverged = true;
}
const frozen = samples.every((s) => s.hash === samples[0].hash);
console.log('LONGRUN', arg);
samples.forEach((s, i) => console.log(` t~${(i + 1) * 3.8 | 0}s :: ${s.txt}`));
console.log('errs:', errs.length ? errs.join(' | ') : 'none', '| diverged:', diverged, '| frozen(top-strip):', frozen);
process.exit(diverged ? 1 : 0);
