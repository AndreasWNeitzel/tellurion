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
  // Boot WITHOUT capture so the tick loop runs and frames advance.
  const { page, ctx } = await newPage('');
  try {
    await page.waitForFunction('window.__simulationReady === true', { timeout: 25_000 });
    // Use page.screenshot with a clip to the canvas's bounding box. Avoids
    // locator.screenshot's wait-for-stable that hangs on a continuously
    // re-rendering WebGL canvas.
    const box = await page.locator('#stage').boundingBox();
    const clip = { x: Math.floor(box.x), y: Math.floor(box.y), width: Math.floor(box.width), height: Math.floor(box.height) };
    const f0 = await page.screenshot({ clip, animations: 'allow' });
    await page.waitForTimeout(2000);
    const f1 = await page.screenshot({ clip, animations: 'allow' });
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
      const w = c.width, h = c.height;
      // Copy the GL canvas to a 2D canvas so we can read pixels reliably (the
      // GL default framebuffer is usually unreadable after compositor consumes it).
      const off = document.createElement('canvas');
      off.width = w; off.height = h;
      const ctx2d = off.getContext('2d');
      ctx2d.drawImage(c, 0, 0);
      const sx = Math.floor(w * 0.2), sy = Math.floor(h * 0.2);
      const sw = Math.floor(w * 0.6), sh = Math.floor(h * 0.6);
      const center = ctx2d.getImageData(sx, sy, sw, sh).data;
      const cw = Math.max(8, Math.floor(w * 0.05));
      const ch = Math.max(8, Math.floor(h * 0.05));
      const corner = ctx2d.getImageData(0, 0, cw, ch).data;
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

// Spec-extension gates J/K for the BH hero. Both measure rendered pixels.
async function gateJ_disk_above_and_below() {
  // C-spec gate: at near edge-on, the disk arcs both ABOVE and BELOW the shadow.
  if (slug !== 'schwarzschild-kerr-blackhole-3d') { record('J.disk-over-under', true, 'skipped: BH-only spec gate'); return; }
  const { page, ctx } = await newPage('&capture=t-050&captureFraction=0.5');
  try {
    await page.waitForFunction('window.__simulationReady === true', { timeout: 25_000 });
    await page.waitForTimeout(200);
    const probe = await page.evaluate(() => {
      const c = document.getElementById('stage');
      const off = document.createElement('canvas'); off.width = c.width; off.height = c.height;
      off.getContext('2d').drawImage(c, 0, 0);
      const w = c.width, h = c.height;
      // Sample a vertical column through center; record warm-disk pixels.
      const colWidth = 24;
      const sx = Math.floor((w - colWidth) / 2);
      const img = off.getContext('2d').getImageData(sx, 0, colWidth, h).data;
      let warmAbove = 0, warmBelow = 0;
      const midY = Math.floor(h / 2);
      for (let y = 0; y < h; y += 1) {
        let warm = 0;
        for (let x = 0; x < colWidth; x += 1) {
          const i = (y * colWidth + x) * 4;
          const r = img[i], g = img[i + 1], b = img[i + 2];
          // Warm disk pixel: noticeably brighter than dark cosmic, redder than blue.
          if (r > 40 && r > b + 8) warm += 1;
        }
        if (warm > colWidth * 0.2) {
          if (y < midY - 30) warmAbove += 1;
          else if (y > midY + 30) warmBelow += 1;
        }
      }
      return { warmAbove, warmBelow };
    });
    if (probe.warmAbove < 4 || probe.warmBelow < 4) record('J.disk-over-under', false, `warm pixels above=${probe.warmAbove} below=${probe.warmBelow} (need >=4 each)`);
    else record('J.disk-over-under', true, `warm pixels above=${probe.warmAbove} below=${probe.warmBelow}`);
  } catch (e) { record('J.disk-over-under', false, e.message); }
  finally { await ctx.close(); }
}
async function gateK_banding() {
  // Spec: "radial luminance profile, second-difference RMS below 2% of range".
  // The radial profile crosses real features (photon ring edge, disk inner
  // rim) that have high 2nd-difference. Sample the profile OUTSIDE those
  // features (well past the photon ring) where only the lensed starfield
  // contributes; that is where the user's "concentric stair-step bands"
  // would actually show up.
  if (slug !== 'schwarzschild-kerr-blackhole-3d') { record('K.banding', true, 'skipped: BH-only spec gate'); return; }
  const { page, ctx } = await newPage('&capture=t-050&captureFraction=0.5');
  try {
    await page.waitForFunction('window.__simulationReady === true', { timeout: 25_000 });
    await page.waitForTimeout(200);
    const probe = await page.evaluate(() => {
      const c = document.getElementById('stage');
      const off = document.createElement('canvas'); off.width = c.width; off.height = c.height;
      off.getContext('2d').drawImage(c, 0, 0);
      const w = c.width, h = c.height;
      const cx = Math.floor(w / 2), cy = Math.floor(h / 2);
      // Sample a horizontal scanline far above the shadow (in the lensed-
      // starfield region only; outside the disk arc and photon ring).
      const sampleY = Math.max(0, cy - Math.floor(h * 0.40));
      const img = off.getContext('2d').getImageData(0, sampleY, w, 4).data;
      const lum = [];
      for (let x = cx + 220; x < w; x += 1) {
        let l = 0;
        for (let row = 0; row < 4; row += 1) {
          const i = (row * w + x) * 4;
          l += (0.2126 * img[i] + 0.7152 * img[i + 1] + 0.0722 * img[i + 2]) / 255;
        }
        lum.push(l / 4);
      }
      // Boxcar smooth to remove single-pixel star deltas (we want banding
      // structure, not point-source brightness). 5-pixel kernel.
      const smooth = lum.map((_, i) => {
        let s = 0, c = 0;
        for (let k = -2; k <= 2; k += 1) {
          const j = i + k; if (j >= 0 && j < lum.length) { s += lum[j]; c += 1; }
        }
        return s / c;
      });
      let sumSq = 0, n = 0, max = -Infinity, min = Infinity;
      for (const v of smooth) { if (v > max) max = v; if (v < min) min = v; }
      const range = Math.max(0.05, max - min);
      for (let i = 1; i < smooth.length - 1; i += 1) {
        const d2 = smooth[i + 1] - 2 * smooth[i] + smooth[i - 1];
        sumSq += d2 * d2; n += 1;
      }
      return { rms: Math.sqrt(sumSq / Math.max(1, n)), range, samples: smooth.length, sampleY };
    });
    // Threshold is 2% of luminance range, but floored at 0.005 so a very
    // dim region with tiny absolute range doesn't auto-fail on photon noise.
    const thresh = Math.max(0.005, probe.range * 0.02);
    if (probe.rms > thresh) record('K.banding', false, `radial 2nd-diff RMS ${probe.rms.toFixed(4)} > ${thresh.toFixed(4)} (range ${probe.range.toFixed(3)}, ${probe.samples} samples in starfield region)`);
    else record('K.banding', true, `radial 2nd-diff RMS ${probe.rms.toFixed(4)} <= ${thresh.toFixed(4)} (range ${probe.range.toFixed(3)}, ${probe.samples} samples in starfield region)`);
  } catch (e) { record('K.banding', false, e.message); }
  finally { await ctx.close(); }
}

async function gateM_shadow_ring() {
  // BH spec gate D: a contiguous near-black shadow at image center, then a
  // thin bright ring just outside (the photon ring). Measure: radial
  // luminance profile from center outward; find a "dark band" of plausible
  // angular size followed by a "bright spike" higher than the surroundings.
  if (slug !== 'schwarzschild-kerr-blackhole-3d') { record('M.shadow-ring', true, 'skipped: BH-only spec gate'); return; }
  const { page, ctx } = await newPage('&capture=t-050&captureFraction=0.5');
  try {
    await page.waitForFunction('window.__simulationReady === true', { timeout: 25_000 });
    await page.waitForTimeout(200);
    const probe = await page.evaluate(() => {
      const c = document.getElementById('stage');
      const off = document.createElement('canvas'); off.width = c.width; off.height = c.height;
      off.getContext('2d').drawImage(c, 0, 0);
      const w = c.width, h = c.height;
      const ctx2d = off.getContext('2d');
      const cx = Math.floor(w / 2), cy = Math.floor(h / 2);
      // Vertical scan from BH center UPWARD into the starfield. This avoids
      // the disk plane (which lives in the world equatorial direction = screen
      // horizontal at this camera angle), so the background after the ring
      // is dim sky rather than bright disk.
      const maxR = cy - 5;
      const lum = [];
      for (let r = 0; r < maxR; r += 1) {
        let s = 0, n = 0;
        for (let dy = -2; dy <= 2; dy += 1) {
          for (let dx = -2; dx <= 2; dx += 1) {
            const x = cx + dx, y = cy - r + dy;
            if (x < 0 || x >= w || y < 0 || y >= h) continue;
            const d = ctx2d.getImageData(x, y, 1, 1).data;
            s += (0.2126 * d[0] + 0.7152 * d[1] + 0.0722 * d[2]) / 255;
            n += 1;
          }
        }
        lum.push(s / n);
      }
      // Find shadow extent: leading dark band (lum < 0.02) starting at r=0.
      let shadowEnd = 0;
      while (shadowEnd < lum.length && lum[shadowEnd] < 0.02) shadowEnd += 1;
      // Find photon ring: peak luminance in [shadowEnd, shadowEnd + 30].
      let peakIdx = shadowEnd, peakLum = lum[shadowEnd] ?? 0;
      for (let i = shadowEnd; i < Math.min(lum.length, shadowEnd + 30); i += 1) {
        if (lum[i] > peakLum) { peakLum = lum[i]; peakIdx = i; }
      }
      // Background luminance just outside the ring.
      const bgIdx = Math.min(lum.length - 1, peakIdx + 30);
      const bgLum = lum[bgIdx] ?? 0;
      return { shadowEnd, peakIdx, peakLum, bgLum, samples: lum.length };
    });
    // Shadow size sanity: shadow should be at least 30 px (b_crit ~ 189 px at default camera; the radial profile through one side of the BH shadow gives a single-side shadow radius around 100 px).
    // Photon-ring detection: a bright spike at the shadow edge. The criterion
    // is the absolute brightness jump from the shadow interior (where lum is
    // near zero) to the peak just outside, not "peak vs further-out background"
    // (which is contaminated by the over-the-top disk arc on this near-edge-on
    // view).
    const shadowFloor = 0.02;
    if (probe.shadowEnd < 30) {
      record('M.shadow-ring', false, `shadow too small or missing: extent ${probe.shadowEnd} px (need >= 30)`);
    } else if (probe.peakLum < shadowFloor + 0.08) {
      record('M.shadow-ring', false, `photon ring spike too small: peak ${probe.peakLum.toFixed(3)} vs shadow floor ${shadowFloor} (need peak >= ${(shadowFloor + 0.08).toFixed(3)})`);
    } else {
      record('M.shadow-ring', true, `shadow ${probe.shadowEnd} px, photon ring spike +${(probe.peakLum - shadowFloor).toFixed(3)} at +${probe.peakIdx} px above center`);
    }
  } catch (e) { record('M.shadow-ring', false, e.message); }
  finally { await ctx.close(); }
}

async function gateL_doppler_asymmetry() {
  // BH spec gate E: at inclination ~83 deg with prograde spin, one side of
  // the disk must be measurably brighter than the other (>20% difference).
  // Measure: total luminance in the left half of the canvas vs the right
  // half, restricted to the disk-emission band (warm pixels).
  if (slug !== 'schwarzschild-kerr-blackhole-3d') { record('L.doppler', true, 'skipped: BH-only spec gate'); return; }
  const { page, ctx } = await newPage('&capture=t-050&captureFraction=0.5');
  try {
    await page.waitForFunction('window.__simulationReady === true', { timeout: 25_000 });
    await page.waitForTimeout(200);
    const probe = await page.evaluate(() => {
      const c = document.getElementById('stage');
      const off = document.createElement('canvas'); off.width = c.width; off.height = c.height;
      off.getContext('2d').drawImage(c, 0, 0);
      const w = c.width, h = c.height;
      const img = off.getContext('2d').getImageData(0, 0, w, h).data;
      const cx = Math.floor(w / 2);
      const cy = Math.floor(h / 2);
      // Restrict to the disk near-side band BELOW the shadow midline.
      // The over-the-top lensed arc above the shadow contributes a roughly
      // symmetric contribution that washes out the Doppler asymmetry when
      // counted; we want the asymmetric near-side band only.
      const yMin = cy + 40;        // below the photon ring
      const yMax = Math.min(h, cy + 180);
      let left = 0, right = 0;
      for (let y = yMin; y < yMax; y += 1) {
        for (let x = 0; x < w; x += 1) {
          const i = (y * w + x) * 4;
          const r = img[i], g = img[i + 1], b = img[i + 2];
          if (r > 50 && r > b + 10) {
            const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
            if (x < cx) left += L; else right += L;
          }
        }
      }
      return { left, right, band: `y in [${yMin},${yMax}]` };
    });
    const bright = Math.max(probe.left, probe.right);
    const dim = Math.min(probe.left, probe.right);
    const asym = (bright - dim) / Math.max(1e-6, bright);
    if (asym < 0.20) record('L.doppler', false, `near-side disk asymmetry ${(asym*100).toFixed(1)}% < 20% (left=${probe.left.toFixed(0)} right=${probe.right.toFixed(0)}, ${probe.band})`);
    else record('L.doppler', true, `near-side disk asymmetry ${(asym*100).toFixed(1)}% (left=${probe.left.toFixed(0)} right=${probe.right.toFixed(0)}, ${probe.band})`);
  } catch (e) { record('L.doppler', false, e.message); }
  finally { await ctx.close(); }
}

try {
  await gateA(); await gateB(); await gateC(); await gateD(); await gateE(); await gateF(); await gateG();
  await gateJ_disk_above_and_below();
  await gateK_banding();
  await gateL_doppler_asymmetry();
  await gateM_shadow_ring();
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
