// text-clip-scan: find playgrounds that draw canvas text off the edges of the
// 820x1040 stage (anchor beyond the canvas, or left-aligned text overflowing
// the right edge). Wraps fillText/strokeText and maps each call through the
// live transform to device pixels, so rotated axis labels are handled.
//
// Usage: node scripts/text-clip-scan.mjs [--only <substr>] [--start N] [--count N]
import { chromium } from 'playwright';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const START = parseInt(arg('start', '0'), 10);
const COUNT = parseInt(arg('count', '40'), 10);
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

const initScript = `
window.__clips = [];
(function () {
  function wrap(name) {
    const orig = CanvasRenderingContext2D.prototype[name];
    CanvasRenderingContext2D.prototype[name] = function (text, x, y) {
      try {
        const cw = this.canvas.width, ch = this.canvas.height;
        const m = this.getTransform();
        const dx = m.a * x + m.c * y + m.e;
        const dy = m.b * x + m.d * y + m.f;
        const rotated = Math.abs(m.b) > 1e-6 || Math.abs(m.c) > 1e-6;
        let bad = null;
        if (dy > ch + 1) bad = 'BELOW';
        else if (dy < -10) bad = 'ABOVE';
        else if (dx > cw + 1) bad = 'RIGHT';
        else if (dx < -2) bad = 'LEFT';
        else if (!rotated && String(text).length) {
          const tw = this.measureText(text).width;
          const al = this.textAlign;
          let right = dx;
          if (al === 'left' || al === 'start') right = dx + tw;
          else if (al === 'center') right = dx + tw / 2;
          let left = dx;
          if (al === 'right' || al === 'end') left = dx - tw;
          else if (al === 'center') left = dx - tw / 2;
          if (right > cw + 2) bad = 'RIGHT-OVF';
          else if (left < -2) bad = 'LEFT-OVF';
        }
        if (bad && this.canvas.id === 'stage') {
          window.__clips.push({ t: String(text).slice(0, 24), x: Math.round(dx), y: Math.round(dy), w: cw, h: ch, why: bad });
        }
      } catch (e) { /* ignore */ }
      return orig.apply(this, arguments);
    };
  }
  wrap('fillText'); wrap('strokeText');
})();
`;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const flagged = [];
for (const dir of dirs) {
  const rel = dir.replace('playgrounds/', '');
  const page = await browser.newPage({ viewport: { width: 900, height: 1180 }, reducedMotion: 'no-preference' });
  await page.addInitScript(initScript);
  try {
    await page.goto('http://localhost:5173/' + dir + '/index.html', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2600);                       // let any orbit/sweep move labels around
    const clips = await page.evaluate(() => window.__clips || []);
    // dedupe by text+why, keep the worst few
    const seen = new Set(); const uniq = [];
    for (const c of clips) { const k = c.why + '|' + c.t; if (!seen.has(k)) { seen.add(k); uniq.push(c); } }
    if (uniq.length) {
      flagged.push(rel + ' :: ' + uniq.slice(0, 6).map((c) => `${c.why}"${c.t}"@(${c.x},${c.y})`).join('  '));
      console.log(rel.padEnd(52), uniq.length, 'clipped');
    } else {
      console.log(rel.padEnd(52), 'ok');
    }
  } catch (e) {
    console.log(rel.padEnd(52), 'NAV-FAIL', String(e.message).slice(0, 40));
  }
  await page.close();
}
console.log('\n=== text-clip-flagged (' + flagged.length + '/' + dirs.length + ') ===');
for (const f of flagged) console.log('  ' + f);
console.log('=== TEXT-CLIP-SCAN DONE ===');
await browser.close();
