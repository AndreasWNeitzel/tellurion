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
if (!slug) { console.error('Usage: interaction-probe.mjs --playground <slug> [--click]'); process.exit(2); }

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
  const hash = () => page.evaluate(() => {
    const c = document.getElementById('stage');
    const g = c.getContext('2d') || c.getContext('webgl2') || c.getContext('webgl');
    let s;
    if (g && g.getImageData) { const d = g.getImageData(0, 0, c.width, c.height).data; s = d; }
    else { return c.toDataURL().length + ':' + c.toDataURL().slice(-64); }
    let h = 0; for (let i = 0; i < s.length; i += 997) h = (h * 31 + s[i]) | 0;
    return String(h);
  });
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
    const ok = before !== after;
    console.log(`${ok ? 'OK  ' : 'DEAD'}  ${c.kind}  ${c.id}`);
    if (!ok) fails.push(`${c.kind}:${c.id}`);
  }
  if (doClick) {
    const before = await hash();
    const box = await page.locator('#stage').boundingBox();
    await page.mouse.click(box.x + box.width * 0.42, box.y + box.height * 0.4);
    await page.waitForTimeout(450);
    const after = await hash();
    const ok = before !== after;
    console.log(`${ok ? 'OK  ' : 'DEAD'}  click  #stage`);
    if (!ok) fails.push('click:#stage');
  }
} finally {
  await browser.close();
  await server.closePromise();
}
if (fails.length) { console.error(`PROBE FAIL: dead -> ${fails.join(', ')}`); process.exit(1); }
console.log('PROBE PASS: all controls drive the canvas');
