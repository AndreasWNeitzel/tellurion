#!/usr/bin/env node
// scripts/audit-all.mjs
// Load each playground via Playwright headless and audit:
//   - JS console errors
//   - Failed network requests
//   - KaTeX rendering errors
//   - Canvas pixel-change activity over full canvas (animation actually running)
//   - Page-load status

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from '../tests/helpers/static-server.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const { server, url: baseUrl } = await startStaticServer(ROOT);

// Walk playgrounds/ recursively so the curriculum-aligned tree is supported.
async function findPlaygroundDirs(d) {
  const out = [];
  async function recurse(dir) {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); }
    catch { return; }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (e.name === '_template' || e.name === 'references' || e.name === 'golden-frames' || e.name === 'captured') continue;
      const full = path.join(dir, e.name);
      try {
        await fs.access(path.join(full, 'index.html'));
        out.push(full);
      } catch {
        await recurse(full);
      }
    }
  }
  await recurse(d);
  return out;
}
const playgroundDirs = await findPlaygroundDirs(path.join(ROOT, 'playgrounds'));
playgroundDirs.sort();
const playgrounds = playgroundDirs.map(d => path.relative(path.join(ROOT, 'playgrounds'), d));

console.log(`Auditing ${playgrounds.length} playgrounds...\n`);

const browser = await chromium.launch();
const results = [];

async function canvasFingerprint(page) {
  return page.evaluate(() => {
    const c = document.getElementById('stage');
    if (!c) return null;
    const ctx = c.getContext('2d');
    const img = ctx.getImageData(0, 0, c.width, c.height);
    let s1 = 0, s2 = 0;
    for (let i = 0; i < img.data.length; i += 64) {
      s1 = (s1 + img.data[i]) & 0xffffff;
      s2 = (s2 + img.data[i + 1] * 31 + img.data[i + 2] * 17 + img.data[i + 3] * 13) & 0xffffff;
    }
    return s1 * 1e8 + s2;
  });
}

for (const slug of playgrounds) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const consoleErrors = [];
  const networkFailures = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
  page.on('requestfailed', (req) => networkFailures.push(`${req.url()}: ${req.failure()?.errorText}`));

  const targetUrl = `${baseUrl}/playgrounds/${slug}/index.html`;
  let status = 'unknown';
  let canvasChange = 0;
  let katexCount = 0;
  let katexErr = 0;
  let canvasExists = false;
  let pixelsChanged = 0;

  try {
    const resp = await page.goto(targetUrl, { waitUntil: 'load', timeout: 12_000 });
    status = resp ? `${resp.status()}` : 'no-response';
    await page.waitForTimeout(800);

    // Take multiple fingerprints over 3 seconds
    const fps = [];
    for (let i = 0; i < 6; i += 1) {
      const fp = await canvasFingerprint(page);
      fps.push(fp);
      await page.waitForTimeout(500);
    }
    canvasExists = fps[0] !== null;
    if (canvasExists) {
      const uniq = new Set(fps).size;
      canvasChange = uniq >= 2 ? 1 : 0;
      pixelsChanged = uniq;
    } else {
      canvasChange = -1;
    }

    const katex = await page.evaluate(() => ({
      ok: document.querySelectorAll('.katex').length,
      err: document.querySelectorAll('.katex-error').length,
      errMsgs: Array.from(document.querySelectorAll('.katex-error')).slice(0, 3).map(e => e.title || e.textContent || '').slice(0, 200),
    }));
    katexCount = katex.ok;
    katexErr = katex.err;
  } catch (e) {
    status = `load-error: ${e.message.slice(0, 80)}`;
  }

  results.push({ slug, status, consoleErrors: consoleErrors.slice(0, 3), networkFailures: networkFailures.slice(0, 2), canvasChange, katexCount, katexErr, pixelsChanged });
  await ctx.close();
}

await browser.close();
await server.closePromise();

console.log('slug | status | console | net | anim_uniq | katex');
console.log('=====');
for (const r of results) {
  const animTag = r.canvasChange === 1 ? `OK(${r.pixelsChanged})` : r.canvasChange === 0 ? `NO(${r.pixelsChanged})` : 'NA';
  const errTag = r.consoleErrors.length > 0 ? `E:${r.consoleErrors.length}` : '   ';
  const netTag = r.networkFailures.length > 0 ? `N:${r.networkFailures.length}` : '   ';
  const katexTag = r.katexErr > 0 ? `BAD(${r.katexErr})` : `${r.katexCount}`;
  console.log(`${r.slug} | ${r.status} | ${errTag} | ${netTag} | ${animTag} | ${katexTag}`);
}

console.log('\nPROBLEMS:\n');
for (const r of results) {
  const hasIssue = r.status !== '200' || r.consoleErrors.length > 0 || r.networkFailures.length > 0 || r.canvasChange === 0 || r.katexErr > 0;
  if (!hasIssue) continue;
  console.log(`>> ${r.slug} (status=${r.status}, anim_uniq=${r.pixelsChanged}, katex_err=${r.katexErr})`);
  for (const e of r.consoleErrors) console.log(`    console: ${e.slice(0, 200)}`);
  for (const n of r.networkFailures) console.log(`    network: ${n}`);
}

process.exit(0);
