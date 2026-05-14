#!/usr/bin/env node
// gate.mjs <slug>
// Runs the 7 gates (A first-light, B liveness, C cpu/gpu, D camera+interact,
// E physics, F visual, G determinism) against the named hero and writes
// playgrounds/_heroes/<slug>/GATES.md with the result.

import { chromium } from '/home/aneitzel/projects/portfolio/playgrounds-portfolio/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { startStaticServer } from '../tests/helpers/static-server.mjs';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(__dirname, '..');

const slug = process.argv[2];
if (!slug) { console.error('Usage: gate.mjs <slug>'); process.exit(2); }
const pgDir = path.join(ROOT, 'playgrounds/_heroes', slug);
try { await fs.access(pgDir); } catch { console.error('not found:', pgDir); process.exit(2); }

const results = [];
function record(name, pass, msg) {
  results.push({ name, pass, msg });
  console.log(`${pass ? 'OK' : 'FAIL'} ${name}${msg ? `: ${msg}` : ''}`);
}

const { server, url } = await startStaticServer(ROOT);
const browser = await chromium.launch({ headless: true });

async function newPage(extraQuery = '') {
  const ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const target = `${url}/playgrounds/_heroes/${slug}/index.html?seed=0xC0FFEE&deterministic=1${extraQuery}`;
  await page.goto(target);
  return { page, errs, ctx };
}

async function gateA() {
  const { page, errs, ctx } = await newPage('&capture=t-000&captureFraction=0');
  try {
    await page.waitForFunction('window.__simulationReady === true', { timeout: 25_000 });
    const info = await page.evaluate(() => {
      const c = document.getElementById('stage');
      const gl = c?.getContext?.('webgl2');
      const hasWebGL2 = !!(gl && typeof gl.drawArrays === 'function');
      return { hasWebGL2, width: c?.width, height: c?.height };
    });
    if (!info.hasWebGL2) record('A.first-light', false, 'hero canvas is not WebGL2');
    else if (errs.length) record('A.first-light', false, `pageerror: ${errs[0]}`);
    else record('A.first-light', true);
  } catch (e) { record('A.first-light', false, `boot timeout: ${e.message.split('\n')[0]}`); }
  finally { await ctx.close(); }
}

async function gateB() {
  const { page, ctx } = await newPage('&capture=t-000&captureFraction=0');
  try {
    await page.waitForFunction('window.__simulationReady === true', { timeout: 25_000 });
    const f0 = await page.locator('#stage').screenshot();
    await page.waitForTimeout(2000);
    const f1 = await page.locator('#stage').screenshot();
    let diff = 0, total = 0;
    const sz = Math.min(f0.length, f1.length);
    for (let i = 0; i < sz; i += 4) {
      const dr = Math.abs(f0[i] - f1[i]);
      const dg = Math.abs(f0[i + 1] - f1[i + 1]);
      const db = Math.abs(f0[i + 2] - f1[i + 2]);
      if (dr + dg + db > 12) diff += 1;
      total += 1;
    }
    const fracDiff = diff / total;
    if (fracDiff < 0.02) record('B.liveness', false, `frame static (${(fracDiff * 100).toFixed(2)}% changed in 2s)`);
    else {
      const readouts = await page.$$eval('.readout-panel .value', els => els.map(e => e.textContent));
      const stale = readouts.find(t => t === '--' || /NaN/i.test(t) || t === '');
      if (stale !== undefined) record('B.liveness', false, `readout never populated: "${stale}"`);
      else record('B.liveness', true, `${(fracDiff * 100).toFixed(1)}% changed, ${readouts.length} readouts numeric`);
    }
  } catch (e) { record('B.liveness', false, e.message); }
  finally { await ctx.close(); }
}

async function gateC() {
  const { page, ctx } = await newPage('&capture=t-050&captureFraction=0.5');
  try {
    await page.waitForFunction('window.__simulationReady === true', { timeout: 25_000 });
    const check = await page.evaluate(async () => {
      if (typeof window.__cpuVsGpu === 'function') return window.__cpuVsGpu();
      return { skip: true, reason: 'hero does not expose __cpuVsGpu()' };
    });
    if (check.skip) record('C.cpu-gpu', true, `skipped: ${check.reason}`);
    else if (check.pass) record('C.cpu-gpu', true, check.note ?? '');
    else record('C.cpu-gpu', false, `${check.field}: GPU=${check.gpu} CPU=${check.cpu} tol=${check.tol}`);
  } catch (e) { record('C.cpu-gpu', false, e.message); }
  finally { await ctx.close(); }
}

async function gateD() {
  try {
    const pg = await fs.readFile(path.join(pgDir, 'playground.js'), 'utf-8');
    const usesShared = pg.includes('orbit-camera.js') || pg.includes('orbit-camera.mjs');
    if (!usesShared) { record('D.camera', false, 'playground.js must import shared/js/gl/orbit-camera.js'); return; }
  } catch (e) { record('D.camera', false, `cannot read playground.js: ${e.message}`); return; }

  const { page, ctx } = await newPage('');
  try {
    await page.waitForFunction('window.__simulationReady === true', { timeout: 25_000 });
    await page.waitForTimeout(200);
    const before = await page.evaluate(() => window.__camera?.state?.azimuthDeg);
    if (typeof before !== 'number') { record('D.camera', false, 'hero must expose window.__camera'); return; }
    const box = await page.locator('#stage').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 4 });
    await page.mouse.up();
    await page.waitForTimeout(100);
    const after = await page.evaluate(() => window.__camera?.state?.azimuthDeg);
    const delta = Math.abs(((after - before + 540) % 360) - 180) > 175 ? Math.abs(after - before) : Math.abs(after - before);
    if (delta > 5) record('D.camera', true, `azimuth advanced ${(after - before).toFixed(1)} deg on drag`);
    else record('D.camera', false, `drag did not move camera (before=${before}, after=${after})`);
  } catch (e) { record('D.camera', false, e.message); }
  finally { await ctx.close(); }
}

async function gateE() {
  const { page, ctx } = await newPage('&capture=t-100&captureFraction=1.0');
  try {
    await page.waitForFunction('window.__simulationReady === true', { timeout: 25_000 });
    const check = await page.evaluate(async () => {
      if (typeof window.__physicsCheck === 'function') return await window.__physicsCheck();
      return { skip: true, reason: 'hero does not expose __physicsCheck()' };
    });
    if (check.skip) record('E.physics', true, `skipped: ${check.reason}`);
    else if (check.pass) record('E.physics', true, check.msg ?? check.name);
    else record('E.physics', false, `${check.name}: ${check.msg}`);
  } catch (e) { record('E.physics', false, e.message); }
  finally { await ctx.close(); }
}

async function gateF() {
  const { page, ctx } = await newPage('&capture=t-050&captureFraction=0.5');
  try {
    await page.waitForFunction('window.__simulationReady === true', { timeout: 25_000 });
    await page.waitForTimeout(200);
    const probe = await page.evaluate(() => {
      const c = document.getElementById('stage');
      const gl = c.getContext('webgl2');
      if (!gl) return null;
      const w = c.width, h = c.height;
      const sx = Math.floor(w * 0.2), sy = Math.floor(h * 0.2);
      const sw = Math.floor(w * 0.6), sh = Math.floor(h * 0.6);
      const center = new Uint8Array(sw * sh * 4);
      gl.readPixels(sx, sy, sw, sh, gl.RGBA, gl.UNSIGNED_BYTE, center);
      const cx = Math.floor(w * 0.05), cy = Math.floor(h * 0.05);
      const corner = new Uint8Array(cx * cy * 4);
      gl.readPixels(0, 0, cx, cy, gl.RGBA, gl.UNSIGNED_BYTE, corner);
      const colors = new Set();
      let lumLo = 0, lumHi = 0, lumTotal = 0, hot = 0;
      for (let i = 0; i < center.length; i += 4) {
        const r = center[i], g = center[i + 1], b = center[i + 2];
        colors.add(((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4));
        const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        if (L < 0.15) lumLo += 1;
        if (L > 0.85) lumHi += 1;
        if (L > 0.9) hot += 1;
        lumTotal += 1;
      }
      let cornerL = 0, cornerN = 0;
      for (let i = 0; i < corner.length; i += 4) {
        cornerL += (corner[i] + corner[i + 1] + corner[i + 2]) / (3 * 255);
        cornerN += 1;
      }
      return { distinctColors: colors.size, lumLoFrac: lumLo / lumTotal, lumHiFrac: lumHi / lumTotal, hotFrac: hot / lumTotal, cornerMean: cornerN ? cornerL / cornerN : 0 };
    });
    if (!probe) { record('F.visual', false, 'no WebGL2 context'); return; }
    if (probe.distinctColors < 24) record('F.visual', false, `surface flat: only ${probe.distinctColors} distinct colors`);
    else if (probe.cornerMean > 0.08) record('F.visual', false, `corner not dark-cosmic: mean ${probe.cornerMean.toFixed(3)}`);
    else record('F.visual', true, `${probe.distinctColors} colors, corner ${probe.cornerMean.toFixed(3)}, hot ${(probe.hotFrac * 100).toFixed(1)}%`);
  } catch (e) { record('F.visual', false, e.message); }
  finally { await ctx.close(); }
}

async function gateG() {
  async function captureFrame100() {
    const { page, ctx } = await newPage('&capture=t-050&captureFraction=0.5');
    try {
      await page.waitForFunction('window.__simulationReady === true', { timeout: 25_000 });
      await page.waitForTimeout(200);
      return await page.locator('#stage').screenshot();
    } finally { await ctx.close(); }
  }
  try {
    const a = await captureFrame100();
    const b = await captureFrame100();
    let diff = 0, total = 0;
    const sz = Math.min(a.length, b.length);
    for (let i = 0; i < sz; i += 4) {
      const dd = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
      if (dd > 8) diff += 1;
      total += 1;
    }
    const frac = diff / total;
    if (frac > 0.005) record('G.deterministic', false, `${(frac * 100).toFixed(2)}% pixels differ between runs`);
    else record('G.deterministic', true, `${(frac * 100).toFixed(3)}% drift`);
  } catch (e) { record('G.deterministic', false, e.message); }
}

try {
  await gateA(); await gateB(); await gateC(); await gateD(); await gateE(); await gateF(); await gateG();
} finally {
  await browser.close();
  await server.closePromise();
}

const md = [];
md.push(`# Gates: ${slug}`); md.push('');
md.push(`Captured at: ${new Date().toISOString()}`); md.push('');
md.push('| Gate | Status | Detail |');
md.push('|...|...|...|');
for (const r of results) md.push(`| ${r.name} | ${r.pass ? 'PASS' : 'FAIL'} | ${(r.msg ?? '').replace(/\|/g, '\\|')} |`);
await fs.writeFile(path.join(pgDir, 'GATES.md'), md.join('\n') + '\n');
const failed = results.filter(r => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} gates passed.`);
process.exit(failed > 0 ? 1 : 0);
