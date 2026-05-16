// scripts/interaction-probe.mjs --playground <slug> [--click]
// Drives every range slider and select on a playground, plus an optional
// canvas click, and asserts the #stage canvas pixels actually change.
// Closes the gap the SSIM visual gate leaves: that gate only inspects a
// scripted bootSync frame and never exercises live event handlers, so a
// dead slider or dead click passes it. A control that produces no canvas
// change is reported as DEAD and fails the probe.

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { startStaticServer } from '../tests/helpers/static-server.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const slug = args[args.indexOf('--playground') + 1];
const doClick = args.includes('--click');
const doDrag = args.includes('--drag');
if (!slug) { console.error('Usage: interaction-probe.mjs --playground <slug> [--click] [--drag]'); process.exit(2); }

function resolveDir(s) {
  const direct = path.join(ROOT, 'playgrounds', s);
  if (fs.existsSync(direct)) return direct;
  const base = path.join(ROOT, 'playgrounds');
  for (const yr of fs.readdirSync(base)) {
    const yd = path.join(base, yr);
    if (!fs.statSync(yd).isDirectory()) continue;
    for (const d of fs.readdirSync(yd)) {
      if (d === s || d.endsWith('-' + s)) return path.join(yd, d);
    }
  }
  return null;
}
const pgDir = resolveDir(slug);
if (!pgDir) { console.error(`not found: ${slug}`); process.exit(2); }
const URL_PATH = path.relative(ROOT, pgDir).split(path.sep).join('/');

const { server, url: baseUrl } = await startStaticServer(ROOT);
const browser = await chromium.launch();
const page = await browser.newPage();
const fails = [];
try {
  await page.goto(`${baseUrl}/${URL_PATH}/index.html`);
  await page.waitForFunction(() => window.__simulationReady === true || document.getElementById('stage'), null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);
  // Snapshot actual canvas pixels and compare by the FRACTION of pixels
  // that change. A working control drives the main visualisation and
  // changes a large fraction; a dead control changes nothing; a control
  // that only updates a readout digit changes a tiny fraction. The last
  // case is the real defect ("slider does nothing" perceptually) that a
  // lenient any-change test and the SSIM gate both miss.
  const snap = () => page.evaluate(() => {
    const c = document.getElementById('stage');
    let g = c.getContext('2d');
    if (g && g.getImageData) { const d = g.getImageData(0, 0, c.width, c.height).data; return Array.from(d.filter((_, i) => i % 41 === 0)); }
    // WebGL: fall back to a PNG data URL split into chars.
    return c.toDataURL('image/png');
  });
  const changedFrac = (a, b) => {
    if (typeof a === 'string' || typeof b === 'string') {
      if (a === b) return 0;
      const n = Math.min(a.length, b.length); let d = Math.abs(a.length - b.length);
      for (let i = 0; i < n; i += 1) if (a[i] !== b[i]) d += 1;
      return d / Math.max(1, Math.max(a.length, b.length));
    }
    const n = Math.min(a.length, b.length); let d = 0;
    for (let i = 0; i < n; i += 1) if (Math.abs(a[i] - b[i]) > 8) d += 1;
    return d / Math.max(1, n);
  };
  const hash = snap;
  const noiseNow = async () => { const a = await hash(); await page.waitForTimeout(450); const b = await hash(); return changedFrac(a, b); };
  const clickPause = () => page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(e =>
      /pause/i.test(e.id || '') || /pause/i.test(e.getAttribute('aria-label') || '') || /pause/i.test(e.textContent || ''));
    if (b) { b.click(); return true; } return false;
  });
  // Only pause if the page is actually animating, and only KEEP it
  // paused if clicking the pause control reduced the motion. On a
  // static-by-default playground whose pause button reads "Play",
  // clicking it would START the animation, so unconditionally clicking
  // it (the earlier behaviour) produced a false WEAK. Verify, revert if
  // it made things worse.
  let noise = await noiseNow();
  if (noise > 0.005) {
    const had = await clickPause();
    if (had) {
      await page.waitForTimeout(250);
      const n2 = await noiseNow();
      if (n2 <= noise) noise = n2; else { await clickPause(); await page.waitForTimeout(150); noise = await noiseNow(); }
    }
  }
  // OK if the control changes the canvas well above the per-frame
  // animation noise floor. 2.5x (with a 0.4% absolute floor) cleanly
  // separates every observed broken case (readout-only 0.01-0.12%) from
  // every fixed one (line/field response 0.7-22%), including animated
  // playgrounds where the noise floor is non-trivial.
  const okThresh = Math.max(0.004, noise * 2.5);
  console.log(`noise floor ${(noise * 100).toFixed(3)}%, OK threshold ${(okThresh * 100).toFixed(2)}%`);
  const controls = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('input[type=range]')) out.push({ id: el.id || el.getAttribute('aria-label'), kind: 'range', min: +el.min, max: +el.max, step: el.step });
    for (const el of document.querySelectorAll('select')) out.push({ id: el.id || el.getAttribute('aria-label'), kind: 'select' });
    return out;
  });
  for (const c of controls) {
    const before = await hash();
    await page.evaluate(({ id, kind, min, max }) => {
      const el = document.getElementById(id) || [...document.querySelectorAll('[aria-label]')].find(e => e.getAttribute('aria-label') === id);
      if (!el) return;
      if (kind === 'range') {
        const cur = parseFloat(el.value);
        const target = (cur - min) < (max - cur) ? max : min;   // jump to the far end
        el.value = String(target);
      } else {
        const opts = [...el.options]; const other = opts.find(o => o.value !== el.value); if (other) el.value = other.value;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, c);
    await page.waitForTimeout(450);
    const after = await hash();
    const f = changedFrac(before, after);
    let verdict = f >= okThresh ? 'OK  ' : (f > Math.max(noise * 1.5, 0.0008) ? 'WEAK' : 'DEAD');
    // Rate-control retry: a speed slider has no effect while paused, so
    // it fails the quiescent test. Resume animation and check it changes
    // the EVOLUTION RATE: the per-window change at the high setting must
    // clearly exceed that at the low setting.
    if (verdict !== 'OK  ' && c.kind === 'range') {
      await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find(e =>
          /play|resume|pause/i.test(e.id || '') || /play|resume|pause/i.test(e.getAttribute('aria-label') || '') || /play|resume|pause/i.test(e.textContent || ''));
        if (b) b.click();
      });
      const rate = async (val) => {
        await page.evaluate(({ id, val }) => {
          const el = document.getElementById(id) || [...document.querySelectorAll('[aria-label]')].find(e => e.getAttribute('aria-label') === id);
          if (!el) return; el.value = String(val);
          el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
        }, { id: c.id, val });
        await page.waitForTimeout(200);
        const s0 = await hash(); await page.waitForTimeout(650); const s1 = await hash();
        return changedFrac(s0, s1);
      };
      const rHi = await rate(c.max);
      const rLo = await rate(c.min);
      if (rHi > Math.max(0.004, rLo * 1.6) || (rHi - rLo) > okThresh) verdict = 'OK  ';
      console.log(`     rate-retry ${c.id}: hi=${(rHi * 100).toFixed(2)}% lo=${(rLo * 100).toFixed(2)}%`);
    }
    console.log(`${verdict}  ${c.kind}  ${c.id}  (${(f * 100).toFixed(2)}% changed)`);
    if (verdict !== 'OK  ') fails.push(`${c.kind}:${c.id}[${verdict.trim()}]`);
  }
  if (doClick) {
    const before = await hash();
    const box = await page.locator('#stage').boundingBox();
    await page.mouse.click(box.x + box.width * 0.42, box.y + box.height * 0.4);
    await page.waitForTimeout(450);
    const after = await hash();
    const f = changedFrac(before, after);
    const verdict = f >= okThresh ? 'OK  ' : (f > Math.max(noise * 1.5, 0.0008) ? 'WEAK' : 'DEAD');
    console.log(`${verdict}  click  #stage  (${(f * 100).toFixed(2)}% changed)`);
    if (verdict !== 'OK  ') fails.push(`click:#stage[${verdict.trim()}]`);
  }
  if (doDrag) {
    // Orbit-camera drag: a real pointer press-move-release on the canvas
    // must rotate the 3D scene. A HUD overlay with pointer-events:auto
    // sitting over the canvas swallows the press and the view never
    // moves; that exact regression is what this catches. Drag from a
    // point well clear of any top-left readout panel.
    const box = await page.locator('#stage').boundingBox();
    const x0 = box.x + box.width * 0.6, y0 = box.y + box.height * 0.62;
    const before = await hash();
    await page.mouse.move(x0, y0);
    await page.mouse.down();
    await page.mouse.move(x0 - box.width * 0.28, y0 - box.height * 0.16, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(450);
    const after = await hash();
    const f = changedFrac(before, after);
    // A camera rotation repaints almost the whole frame; require it to
    // clear the same animation-noise threshold the other probes use.
    const verdict = f >= okThresh ? 'OK  ' : (f > Math.max(noise * 1.5, 0.0008) ? 'WEAK' : 'DEAD');
    console.log(`${verdict}  drag  #stage  (${(f * 100).toFixed(2)}% changed)`);
    if (verdict !== 'OK  ') fails.push(`drag:#stage[${verdict.trim()}]`);
  }
} finally {
  await browser.close();
  await server.closePromise();
}
if (fails.length) { console.error(`PROBE FAIL: dead -> ${fails.join(', ')}`); process.exit(1); }
console.log('PROBE PASS: all controls drive the canvas');
