#!/usr/bin/env node
// Batch canvas screenshotter for self-review of the whole zoo. One reused
// browser (machine-load: single sequential browser, no parallel fleet), renders
// each card's canvas to a downscaled PNG so many can be eyeballed at once.
// Usage: node scripts/zoo-shot.mjs --start 0 --count 16   (writes /tmp/zoo/NNN-slug.png)
//        node scripts/zoo-shot.mjs --only <slug-substring>
import { chromium } from 'playwright';
import { readdirSync, existsSync, statSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const START = parseInt(arg('start', '0'), 10);
const COUNT = parseInt(arg('count', '16'), 10);
const ONLY = arg('only', null);
const LIST = arg('list', null);
const OUT = arg('out', '/tmp/zoo');
mkdirSync(OUT, { recursive: true });

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
let sliced, baseIndex = 0;
if (LIST) {
  const want = readFileSync(LIST, 'utf8').split('\n').map((s) => s.trim().split('|')[0].trim()).filter(Boolean);
  sliced = want.map((slug) => `playgrounds/${slug}`).filter((p) => existsSync(join(p, 'index.html')));
} else if (ONLY) {
  sliced = dirs.filter((d) => d.includes(ONLY));
} else {
  sliced = dirs.slice(START, START + COUNT);
  baseIndex = START;
}

const BASE = 'http://localhost:5173';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

for (let i = 0; i < sliced.length; i += 1) {
  const dir = sliced[i];
  const rel = dir.replace('playgrounds/', '');
  const slug = rel.replace(/\//g, '__');
  const idx = String(baseIndex + i).padStart(3, '0');
  // deviceScaleFactor < 1 downscales the element screenshot for compact review.
  const page = await browser.newPage({ viewport: { width: 460, height: 1180 }, deviceScaleFactor: 0.42, reducedMotion: 'no-preference' });
  try {
    await page.goto(`${BASE}/playgrounds/${rel}/index.html`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1100);
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (box) {
      // Clipped page screenshot (not locator.screenshot) so continuously
      // animating canvases do not time out on the element-stability wait.
      await page.screenshot({
        path: join(OUT, `${idx}-${slug}.png`),
        clip: { x: box.x, y: box.y, width: box.width, height: box.height },
        timeout: 12000,
      });
      process.stdout.write(`${idx} ${rel}\n`);
    } else {
      process.stdout.write(`${idx} ${rel} NO-CANVAS\n`);
    }
  } catch (e) {
    process.stdout.write(`${idx} ${rel} ERR ${String(e).split('\n')[0]}\n`);
  } finally {
    await page.close();
  }
}
await browser.close();
process.stdout.write('=== ZOO-SHOT DONE ===\n');
