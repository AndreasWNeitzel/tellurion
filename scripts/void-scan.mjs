#!/usr/bin/env node
// Void scan: render each playground and read the canvas pixels to measure the
// mean brightness of the top / middle / bottom thirds. Flags content that is
// concentrated in one band with another band near the bare background, which is
// the "animating but voided" pattern the frame-hash live-audit cannot see
// (e.g. a plot in the top third over a black lower two thirds). Single frame
// per card, so it is lighter than live-audit. Needs `npm run dev` on :5173.
// Usage: node scripts/void-scan.mjs --start 0 --count 30
import { chromium } from 'playwright';
import { readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const START = parseInt(arg('start', '0'), 10);
const COUNT = parseInt(arg('count', '30'), 10);
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
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  let verdict = '';
  try {
    await page.goto(`${BASE}/playgrounds/${rel}/index.html`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1400);   // let the wake / sweep develop a little
    const r = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      if (!c) return null;
      const o = document.createElement('canvas'); o.width = 60; o.height = 90;
      const g = o.getContext('2d');
      try { g.drawImage(c, 0, 0, 60, 90); } catch { return null; }
      const d = g.getImageData(0, 0, 60, 90).data;
      const band = (y0, y1) => { let s = 0, n = 0; for (let y = y0; y < y1; y += 1) for (let x = 0; x < 60; x += 1) { const i = (y * 60 + x) * 4; s += d[i] + d[i + 1] + d[i + 2]; n += 1; } return s / (n * 3); };
      return { top: band(0, 30), mid: band(30, 60), bot: band(60, 90) };
    });
    if (!r) verdict = 'NO-CANVAS';
    else {
      const mx = Math.max(r.top, r.mid, r.bot);
      // a band is "void" if it is much darker than the brightest band while the
      // card clearly has content somewhere (mx bright enough to exclude all-dark
      // cards, where every band is similarly dim and nothing is concentrated).
      const tag = [];
      // A real void is ASYMMETRIC: one extreme band is near-bare-background
      // while content reaches the OTHER extreme. If both top and bottom are dark
      // (content centred, e.g. a 3D hero on black space), it is not a void.
      if (mx > 14) {
        if (r.bot < 0.32 * mx && r.bot < 9 && r.top > 0.5 * mx) tag.push('BOTTOM-VOID');
        if (r.top < 0.32 * mx && r.top < 9 && r.bot > 0.5 * mx) tag.push('TOP-VOID');
      }
      const vals = `top=${r.top.toFixed(1)} mid=${r.mid.toFixed(1)} bot=${r.bot.toFixed(1)}`;
      if (tag.length) { verdict = `${tag.join(',')}  [${vals}]`; flagged.push(`${rel} :: ${verdict}`); }
      else verdict = `ok  [${vals}]`;
    }
  } catch (e) { verdict = 'ERR ' + String(e).split('\n')[0].slice(0, 60); }
  console.log(rel.padEnd(52), verdict);
  await page.close();
}
await browser.close();
console.log(`\n=== void-flagged (${flagged.length}/${dirs.length}) ===`);
for (const f of flagged) console.log('  ' + f);
console.log('=== VOID-SCAN DONE ===');
