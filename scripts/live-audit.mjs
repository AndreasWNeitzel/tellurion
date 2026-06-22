#!/usr/bin/env node
// Live audit: render playgrounds and flag freezes (no animation), black renders,
// and pageerrors. Runs a bounded batch (machine-load: no mass runs). Drives the
// per-card quality sweep. Needs `npm run dev` on :5173.
// Usage: node scripts/live-audit.mjs --start 0 --count 12
//        node scripts/live-audit.mjs --only <slug-substring>
import { chromium } from 'playwright';
import crypto from 'node:crypto';
import { readdirSync, existsSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const START = parseInt(arg('start', '0'), 10);
const COUNT = parseInt(arg('count', '12'), 10);
const ONLY = arg('only', null);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    let s; try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) {
      if (['node_modules', 'references', '_template'].includes(name)) continue;
      if (existsSync(join(p, 'index.html'))) out.push(p);
      out.push(...walk(p));
    }
  }
  return out;
}

let dirs = walk('playgrounds').filter((d) => !d.split('/').pop().startsWith('_gl'));
if (ONLY) dirs = dirs.filter((d) => d.includes(ONLY));
else dirs = dirs.slice(START, START + COUNT);

const BASE = 'http://localhost:5173';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const flagged = [];
for (const dir of dirs) {
  const rel = dir.replace('playgrounds/', '');
  // no-preference reduced motion so cards that default to !prefersReducedMotion()
  // actually auto-run; otherwise headless reports reduce and every such card looks
  // frozen (false positive).
  const page = await browser.newPage({ viewport: { width: 1200, height: 1100 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).split('\n')[0]));
  let verdict = [];
  try {
    await page.goto(`${BASE}/playgrounds/${rel}/index.html`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(700);
    const cdp = await page.context().newCDPSession(page);
    const box = await page.locator('canvas').first().boundingBox();
    if (!box) { verdict.push('NO-CANVAS'); }
    else {
      const clip = { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(Math.min(box.width, 640)), height: Math.round(Math.min(box.height, 600)), scale: 1 };
      const hashes = [];
      for (let k = 0; k < 5; k++) { const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', clip, fromSurface: true }); hashes.push(crypto.createHash('md5').update(Buffer.from(data, 'base64')).digest('hex').slice(0, 8)); await page.waitForTimeout(500); }
      const distinct = new Set(hashes).size;
      const bright = await page.evaluate(() => { const c = document.querySelector('canvas'); try { const o = document.createElement('canvas'); o.width = 48; o.height = 48; const g = o.getContext('2d'); g.drawImage(c, 0, 0, 48, 48); const d = g.getImageData(0, 0, 48, 48).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2]; return s / (48 * 48 * 3); } catch { return -1; } });
      if (distinct === 1) verdict.push('FROZEN-or-static');
      if (bright >= 0 && bright < 2.5) verdict.push('NEAR-BLACK(' + bright.toFixed(1) + ')');
    }
  } catch (e) { verdict.push('NAV-FAIL'); }
  if (errs.length) verdict.push('ERR:' + errs[0].slice(0, 50));
  await page.close();
  const status = verdict.length ? verdict.join(' ') : 'ok';
  console.log(rel.padEnd(50), status);
  if (verdict.length) flagged.push(rel + ' :: ' + status);
}
await browser.close();
console.log('\n=== flagged (' + flagged.length + '/' + dirs.length + ') ===');
for (const f of flagged) console.log('  ' + f);
