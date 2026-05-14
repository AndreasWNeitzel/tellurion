#!/usr/bin/env node
// scripts/capture-reference.mjs --playground <slug> [--deterministic] [--seed 0xC0FFEE]
// Captures the five canonical frames for a playground using Playwright Chromium.
// Serves the project over http://127.0.0.1 because Chromium blocks ES-module imports from file://.

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { startStaticServer } from '../tests/helpers/static-server.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');

const { values } = parseArgs({
  options: {
    playground:    { type: 'string' },
    deterministic: { type: 'boolean', default: true },
    seed:          { type: 'string',  default: '0xC0FFEE' },
    out:           { type: 'string' }
  }
});

if (!values.playground) {
  console.error('Usage: capture-reference.mjs --playground <slug>');
  process.exit(1);
}

// Resolve the playground directory under the curriculum-aligned tree.
// Accepts either a bare slug (post-rename: <uc>-<slug> or pre-rename: <slug>)
// or a relative path like "bsc-y1s1/FIS1013-inclined-plane-friction".
async function resolvePlaygroundDir(arg) {
  const direct = path.join(ROOT, 'playgrounds', arg);
  try { await fs.access(path.join(direct, 'index.html')); return direct; } catch {}
  // Search recursively for a directory matching the slug or ending with -<slug>.
  const base = path.join(ROOT, 'playgrounds');
  async function recurse(d) {
    let entries;
    try { entries = await fs.readdir(d, { withFileTypes: true }); }
    catch { return null; }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const full = path.join(d, e.name);
      if (e.name === arg || e.name.endsWith(`-${arg}`)) {
        try { await fs.access(path.join(full, 'index.html')); return full; } catch {}
      }
      const r = await recurse(full);
      if (r) return r;
    }
    return null;
  }
  return recurse(base);
}

const pgDir = await resolvePlaygroundDir(values.playground);
if (!pgDir) {
  console.error(`Playground not found: ${values.playground}`);
  process.exit(1);
}

const ts      = new Date().toISOString().replace(/[:.]/g, '-');
const outDir  = values.out ?? path.join(pgDir, 'references', 'captured', ts);
await fs.mkdir(outDir, { recursive: true });

const FRAMES = [
  { name: 't-000', fraction: 0.00 },
  { name: 't-025', fraction: 0.25 },
  { name: 't-050', fraction: 0.50 },
  { name: 't-075', fraction: 0.75 },
  { name: 't-100', fraction: 1.00 }
];

const { server, url: baseUrl } = await startStaticServer(ROOT);
const browser = await chromium.launch({ headless: true });
const ctx     = await browser.newContext({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 2 });
const page    = await ctx.newPage();

try {
  const urlPath = path.relative(ROOT, pgDir).split(path.sep).join('/');
  const baseHref = `${baseUrl}/${urlPath}/index.html`;
  for (const frame of FRAMES) {
    const url = new URL(baseHref);
    url.searchParams.set('seed', values.seed);
    if (values.deterministic) url.searchParams.set('deterministic', '1');
    url.searchParams.set('capture', frame.name);
    url.searchParams.set('captureFraction', String(frame.fraction));
    await page.goto(url.toString());
    await page.waitForFunction('window.__simulationReady === true', { timeout: 30_000 });
    await page.waitForTimeout(50);                    // one render frame settle
    const target = page.locator('#stage');
    const buf    = await target.screenshot();
    await fs.writeFile(path.join(outDir, `${frame.name}.png`), buf);
    // Collect performance timings: 30 frame samples of rAF callback duration.
    const perf = await page.evaluate(async () => {
      const samples = [];
      await new Promise((resolve) => {
        let n = 0;
        function step() {
          const t0 = performance.now();
          requestAnimationFrame(() => {
            const t1 = performance.now();
            samples.push(t1 - t0);
            n += 1;
            if (n < 30) step(); else resolve();
          });
        }
        step();
      });
      samples.sort((a, b) => a - b);
      const median = samples[Math.floor(samples.length / 2)];
      const p95 = samples[Math.floor(samples.length * 0.95)];
      const heap = performance.memory ? performance.memory.usedJSHeapSize : null;
      // GPU timing via EXT_disjoint_timer_query_webgl2 (best-effort; null if unavailable).
      let gpu = null;
      try {
        const canvas = document.getElementById('stage');
        if (canvas) {
          const gl = canvas.getContext('webgl2');
          if (gl) { const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2'); if (ext) gpu = 'supported'; }
        }
      } catch (e) {}
      return { samples, median, p95, heap, gpu };
    });
    await fs.writeFile(path.join(outDir, `${frame.name}.perf.json`), JSON.stringify(perf, null, 2));
    console.log(`captured ${frame.name} (rAF median ${perf.median?.toFixed?.(2) ?? 'n/a'} ms, p95 ${perf.p95?.toFixed?.(2) ?? 'n/a'} ms)`);
  }
} finally {
  await browser.close();
  await server.closePromise();
}

const manifest = {
  playground: values.playground,
  seed: values.seed,
  deterministic: values.deterministic,
  capturedAt: ts,
  frames: FRAMES.map(f => f.name)
};
await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Done -> ${outDir}`);
