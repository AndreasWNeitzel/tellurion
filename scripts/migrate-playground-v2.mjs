#!/usr/bin/env node
// migrate-playground-v2.mjs
// Codemod for the Playground Layout System v2 migration. Transforms a
// playground in place: restructures index.html to the canonical
// two-zone template, rewrites hardcoded ctx.font sizes to the
// canvas-type role system, ensures a window.playground diagnostics
// interface exists, and tops up spec.md with the required v2 fields.
//
//   node scripts/migrate-playground-v2.mjs --batch 30   migrate the
//        next 30 pending playgrounds from playgrounds/_audit.json
//   node scripts/migrate-playground-v2.mjs --dir <path> migrate one
//
// Each migrated page is loaded in a headless browser; if it throws a
// page error the codemod reverts that playground (git checkout) and
// records it needs-attention, so a batch run never leaves breakage.

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { chromium } from '/home/aneitzel/projects/portfolio/playgrounds-portfolio/node_modules/playwright/index.mjs';
import { startStaticServer } from '../tests/helpers/static-server.mjs';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'playgrounds/_audit.json');

function roleForPx(px) {
  if (px <= 10) return 'tick';
  if (px <= 12) return 'caption';
  if (px <= 14) return 'body';
  if (px <= 17) return 'heading';
  return 'title';
}

// Rewrite hardcoded ctx.font assignments to fontString() calls.
function rewriteFonts(js) {
  const canvasMatch = js.match(/(?:const|let|var)\s+(\w+)\s*=\s*document\.getElementById\(\s*['"]stage['"]\s*\)/);
  const canvasVar = canvasMatch ? canvasMatch[1] : 'document.getElementById("stage")';
  const fontRe = /(\w+)\.font\s*=\s*(['"`])((?:[^'"`\\]|\\.)*?)\2/g;
  let changed = false;
  const out = js.replace(fontRe, (full, obj, q, body) => {
    const pxm = body.match(/(\d+(?:\.\d+)?)\s*px/);
    if (!pxm) return full;
    changed = true;
    const role = roleForPx(parseFloat(pxm[1]));
    const family = /mono/i.test(body) ? ", 'mono'" : '';
    const weight = /bold|[^a-z]700|[^a-z]600/i.test(body) ? (family ? ', 600' : ", 'sans', 600") : '';
    return `${obj}.font = fontString(${canvasVar}, '${role}'${family}${weight})`;
  });
  if (!changed) return js;
  if (/canvas-type\.js/.test(out)) return out;
  const importLine = "import { fontString } from '../../../shared/js/canvas-type.js';";
  const lines = out.split('\n');
  let lastImport = -1;
  for (let i = 0; i < Math.min(lines.length, 60); i += 1) {
    if (/^\s*import\s/.test(lines[i])) lastImport = i;
  }
  if (lastImport >= 0) lines.splice(lastImport + 1, 0, importLine);
  else lines.unshift(importLine);
  return lines.join('\n');
}

function ensureDiagnostics(js) {
  if (/window\.playground\.getState\s*=/.test(js)) return js;
  return js + `

// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
`;
}

function ensureSpecFields(spec) {
  const has = (k) => new RegExp(`(^|\\n)\\s*${k}\\s*:`, 'i').test(spec);
  if (!spec.startsWith('---')) return spec;
  const fmEnd = spec.indexOf('\n---', 4);
  if (fmEnd < 0) return spec;
  let inject = '';
  if (!has('invariants')) {
    inject += 'invariants:\n'
      + '  - key: runs\n    label: simulation advances each frame\n    tolerance: 1\n'
      + '  - key: bounded\n    label: state stays finite\n    tolerance: 1\n'
      + '  - key: deterministic\n    label: fixed seed reproduces the run\n    tolerance: 1\n';
  }
  if (!has('what_to_try')) {
    inject += 'what_to_try:\n'
      + '  - Vary each control and watch the rail readouts respond.\n'
      + '  - Compare the diagnostic plot against the live scene.\n';
  }
  if (!inject) return spec;
  return spec.slice(0, fmEnd) + '\n' + inject.trimEnd() + spec.slice(fmEnd);
}

function buildHtml(p) {
  const headExtras = p.styleBlocks.join('\n')
    + (p.explainerCss ? '\n<link rel="stylesheet" href="../../../shared/css/explainer.css">' : '');
  const bodyScripts = ['<script type="module" src="../../../shared/js/rail.js"></script>',
    '<script type="module" src="../../../shared/js/focus.js"></script>']
    .concat(p.scripts.map((s) => `<script type="module" src="${s}"></script>`))
    .join('\n');
  const intro = p.introHtml || `<p class="t-body">${p.h1}.</p>`;
  const controls = p.controlsHtml
    || '<div class="controls pg-controls" id="controls" role="group" aria-label="Simulation controls"></div>';
  // Legacy elements the playground JS may still write to (readout
  // panels, share-mount). Kept hidden so nothing breaks; the rail is
  // the visible diagnostics surface.
  const legacy = p.legacyHtml
    ? `\n      <div class="v2-legacy" hidden>${p.legacyHtml}</div>`
    : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${p.title}</title>
<link rel="stylesheet" href="../../../shared/css/tokens.css">
<link rel="stylesheet" href="../../../shared/css/base.css">
<link rel="stylesheet" href="../../../shared/css/playground-v2.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/contrib/auto-render.min.js"></script>
<script>document.addEventListener('DOMContentLoaded', () => { function tryRender(){ if (window.renderMathInElement && window.katex) renderMathInElement(document.body, {delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}]}); else setTimeout(tryRender, 50); } tryRender(); });</script>
${headExtras}
</head>
<body>
<main class="playground-layout" data-focus="false">

  <a href="/" class="playground-back" aria-label="Back to catalog">
    <svg class="back-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg>
    <span class="back-title">${p.h1}</span>
  </a>

  <article class="playground-center">

    <header class="playground-header">
      <h1 class="t-title playground-title">${p.h1}</h1>
    </header>

    <section class="playground-intro">
      ${intro}
    </section>

    <div class="playground-canvas-frame">
      <button class="playground-focus-toggle" aria-label="Enter focus mode" aria-pressed="false">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"></path></svg>
      </button>
      ${p.canvasHtml}
    </div>

    <figcaption class="t-small playground-caption">${p.captionHtml}</figcaption>

    <section class="playground-controls">
      ${controls}${legacy}
    </section>

    <section class="playground-what-to-try">
      <h2 class="t-label">WHAT TO TRY</h2>
      <ul>
        <li class="t-body">Vary each control and watch the rail readouts respond.</li>
        <li class="t-body">Compare the diagnostic plot against the live scene.</li>
      </ul>
    </section>

  </article>

  <aside class="playground-rail" aria-label="Diagnostics">
    <section class="rail-state">
      <h2 class="t-label">LIVE READOUTS</h2>
      <table class="rail-state-table"></table>
    </section>
    <section class="rail-invariants">
      <h2 class="t-label">INVARIANTS</h2>
      <ul class="rail-invariants-list"></ul>
    </section>
    <section class="rail-references">
      <h2 class="t-label">REFERENCES</h2>
      <ol class="rail-references-list"></ol>
    </section>
  </aside>

</main>
${bodyScripts}
</body>
</html>
`;
}

async function extractHtml(page, fileUrl) {
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
  return page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const title = (document.title || '').trim();
    const h1El = q('h1');
    const h1 = h1El ? h1El.textContent.trim() : title;
    const canvasEl = q('canvas#stage') || q('canvas');
    if (!canvasEl) throw new Error('no canvas');
    if (q('.playground-layout')) throw new Error('already migrated');
    const intros = [];
    let n = h1El ? h1El.nextElementSibling : null;
    while (n && n.tagName !== 'FIGURE' && n.tagName !== 'CANVAS'
           && !(n.querySelector && n.querySelector('canvas')) && n.id !== 'controls') {
      if (n.tagName === 'P') intros.push(n.outerHTML);
      n = n.nextElementSibling;
    }
    const introHtml = intros
      .map((h) => h.replace(/<p(\s+[^>]*)?>/, '<p class="t-body">'))
      .join('\n      ');
    const figcap = q('figcaption');
    const captionHtml = figcap ? figcap.innerHTML.trim() : `<span class="figure-number">Figure 1.</span> ${h1}.`;
    const controlsEl = q('#controls') || q('.controls');
    const controlsHtml = controlsEl ? controlsEl.outerHTML : '';
    // Legacy elements: readout panels and share-mount, preserved hidden.
    const legacyParts = [];
    document.querySelectorAll('[id^="readout"], #share-mount').forEach((el) => {
      if (el.closest('#controls')) return;             // already inside controls
      legacyParts.push(el.outerHTML);
    });
    const styleBlocks = Array.from(document.querySelectorAll('head style')).map((s) => s.outerHTML);
    const explainerCss = !!document.querySelector('link[href*="explainer.css"]');
    const scripts = Array.from(document.querySelectorAll('script[type="module"][src]'))
      .map((s) => s.getAttribute('src'))
      .filter((s) => s && (s.endsWith('playground.js') || s.includes('explainer.js')));
    return {
      title, h1, canvasHtml: canvasEl.outerHTML, introHtml, captionHtml,
      controlsHtml, legacyHtml: legacyParts.join(''), styleBlocks, explainerCss, scripts,
    };
  });
}

async function migrateFiles(page, dir) {
  const indexPath = path.join(dir, 'index.html');
  const jsPath = path.join(dir, 'playground.js');
  if (!fs.existsSync(indexPath)) throw new Error('no index.html');
  const p = await extractHtml(page, 'file://' + indexPath);
  p.canvasHtml = p.canvasHtml.replace(/<canvas/, '<canvas class="playground-canvas"');
  if (!/id="stage"/.test(p.canvasHtml)) p.canvasHtml = p.canvasHtml.replace('<canvas', '<canvas id="stage"');
  fs.writeFileSync(indexPath, buildHtml(p));
  if (fs.existsSync(jsPath)) {
    let js = fs.readFileSync(jsPath, 'utf8');
    js = ensureDiagnostics(rewriteFonts(js));
    fs.writeFileSync(jsPath, js);
  }
  const specPath = path.join(dir, 'spec.md');
  if (fs.existsSync(specPath)) {
    fs.writeFileSync(specPath, ensureSpecFields(fs.readFileSync(specPath, 'utf8')));
  }
}

async function verifyPage(page, url) {
  const errs = [];
  const onErr = (e) => errs.push(e.message);
  page.on('pageerror', onErr);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
  } catch (e) {
    errs.push('navigation: ' + e.message);
  }
  page.off('pageerror', onErr);
  return errs;
}

async function main() {
  const args = process.argv.slice(2);
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  let targets;
  if (args.includes('--dir')) {
    targets = [path.resolve(ROOT, args[args.indexOf('--dir') + 1])];
  } else if (args.includes('--batch')) {
    const n = parseInt(args[args.indexOf('--batch') + 1], 10) || 10;
    targets = manifest.playgrounds
      .filter((x) => x.status === 'pending'
        && !x.path.includes('_template') && !x.path.includes('_gl-smoketest'))
      .slice(0, n)
      .map((x) => path.join(ROOT, x.path));
  } else {
    console.error('Usage: --batch N | --dir <path>');
    process.exit(2);
  }

  const { server, url } = await startStaticServer(ROOT);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const done = [], attention = [];
  for (const dir of targets) {
    const id = path.basename(dir);
    const rel = path.relative(ROOT, dir);
    try {
      await migrateFiles(page, dir);
      const errs = await verifyPage(page, `${url}/${rel}/index.html`);
      if (errs.length) throw new Error(errs[0].slice(0, 120));
      const entry = manifest.playgrounds.find((x) => x.id === id);
      if (entry) entry.status = 'migrated';
      done.push(id);
      console.log('migrated', id);
    } catch (e) {
      try { execSync(`git checkout -- "${rel}"`, { cwd: ROOT }); } catch { /* nothing to revert */ }
      const entry = manifest.playgrounds.find((x) => x.id === id);
      if (entry && e.message !== 'already migrated') entry.status = 'needs-attention';
      attention.push(`${id}: ${e.message}`);
      console.log('NEEDS-ATTENTION', id, '-', e.message);
    }
  }
  await browser.close();
  await server.closePromise();

  manifest.generated = new Date().toISOString();
  manifest.status_counts = manifest.playgrounds.reduce((a, x) => {
    a[x.status] = (a[x.status] || 0) + 1; return a;
  }, {});
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\n${done.length} migrated, ${attention.length} needs-attention`);
  console.log('status:', JSON.stringify(manifest.status_counts));
}

main();
