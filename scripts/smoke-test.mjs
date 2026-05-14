#!/usr/bin/env node
// Stricter smoke test:
//   1. Page loads with no pageerror / no console.error.
//   2. Every <button> clicked without triggering an error.
//   3. If btn-pause exists, click toggles its text (Pause <-> Play).
//   4. Every <input type=range> fires an 'input' event without error.
//   5. Every <select> change fires without error.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function* walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (e === 'spec.md') yield p;
  }
}

async function startServer() {
  const server = createServer(async (req, res) => {
    let url = req.url.split('?')[0]; if (url === '/') url = '/index.html';
    try {
      const data = await fs.readFile(path.join(ROOT, url));
      const ext = path.extname(url);
      const ct = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.png': 'image/png' }[ext] || 'text/plain';
      res.writeHead(200, { 'content-type': ct }); res.end(data);
    } catch { res.writeHead(404); res.end('not found'); }
  });
  await new Promise(r => server.listen(0, r));
  return { server, baseUrl: `http://localhost:${server.address().port}` };
}

const targets = [];
for (const p of walk(path.join(ROOT, 'playgrounds'))) {
  const text = readFileSync(p, 'utf8');
  if (!text.includes('status: verified')) continue;
  targets.push(path.relative(ROOT, path.dirname(p)));
}

const { server, baseUrl } = await startServer();
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
const failures = [];
const results = [];
let totalButtons = 0, totalSliders = 0, totalSelects = 0, totalPauseChecks = 0;
try {
  for (const t of targets) {
    const errors = [];
    const consoleErrs = [];
    const onErr = (e) => errors.push(e.message);
    const onConsole = (m) => { if (m.type() === 'error') consoleErrs.push(m.text()); };
    page.on('pageerror', onErr);
    page.on('console', onConsole);
    const url = `${baseUrl}/${t}/index.html`;
    const issues = [];
    let buttonCount = 0, sliderCount = 0, selectCount = 0;
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 5000 });
      await page.waitForTimeout(150);
      // 1) Click every <button>.
      const buttons = await page.$$('button');
      buttonCount = buttons.length;
      totalButtons += buttonCount;
      for (let i = 0; i < buttons.length; i += 1) {
        await buttons[i].scrollIntoViewIfNeeded({ timeout: 500 }).catch(() => {});
        const before = errors.length + consoleErrs.length;
        try { await buttons[i].click({ timeout: 1500, force: true }); await page.waitForTimeout(40); } catch {}
        if (errors.length + consoleErrs.length > before) issues.push(`button[${i}] threw`);
      }
      // 2) Pause/Play toggle on btn-pause.
      const btnPause = await page.$('#btn-pause');
      if (btnPause) {
        totalPauseChecks += 1;
        const t0 = (await btnPause.textContent())?.trim();
        await btnPause.click({ force: true });
        await page.waitForTimeout(40);
        const t1 = (await btnPause.textContent())?.trim();
        if (t0 === t1) issues.push(`btn-pause text did not toggle (was '${t0}')`);
        else if (!(t0?.match(/^(Pause|Play)$/) && t1?.match(/^(Pause|Play)$/))) issues.push(`btn-pause text not in {Pause, Play}: '${t0}' -> '${t1}'`);
        // Click back to original state to leave the page in a stable spot.
        await btnPause.click({ force: true });
        await page.waitForTimeout(40);
      }
      // 3) Every <input type='range'> fires input event without error.
      const sliders = await page.$$('input[type=range]');
      sliderCount = sliders.length;
      totalSliders += sliderCount;
      for (let i = 0; i < sliders.length; i += 1) {
        const before = errors.length + consoleErrs.length;
        await sliders[i].evaluate((el) => {
          const min = parseFloat(el.min), max = parseFloat(el.max);
          const cur = parseFloat(el.value);
          const next = (cur + min < max) ? cur + (max - min) * 0.1 : cur - (max - min) * 0.1;
          el.value = next;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }).catch(() => {});
        await page.waitForTimeout(20);
        if (errors.length + consoleErrs.length > before) issues.push(`slider[${i}] input threw`);
      }
      // 4) Every <select> change without error.
      const selects = await page.$$('select');
      selectCount = selects.length;
      totalSelects += selectCount;
      for (let i = 0; i < selects.length; i += 1) {
        const before = errors.length + consoleErrs.length;
        await selects[i].evaluate((el) => {
          if (el.options.length > 1) {
            el.selectedIndex = (el.selectedIndex + 1) % el.options.length;
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }).catch(() => {});
        await page.waitForTimeout(20);
        if (errors.length + consoleErrs.length > before) issues.push(`select[${i}] change threw`);
      }

      const ok = errors.length === 0 && consoleErrs.length === 0 && issues.length === 0;
      results.push({ slug: t, ok, buttonCount, sliderCount, selectCount, errors, consoleErrs, issues });
      if (!ok) failures.push({ slug: t, errors, consoleErrs, issues });
    } catch (e) {
      results.push({ slug: t, ok: false, errors: [e.message], consoleErrs: [], issues: [] });
      failures.push({ slug: t, errors: [e.message] });
    }
    page.off('pageerror', onErr);
    page.off('console', onConsole);
  }
} finally { await browser.close(); server.close(); }

const lines = [];
lines.push('# Smoke test report\n');
lines.push(`Generated: ${new Date().toISOString()}\n`);
lines.push(`Targets: ${targets.length}.  OK: ${results.filter(r => r.ok).length}.  Failures: ${failures.length}.\n`);
lines.push(`Buttons clicked: ${totalButtons}.  Sliders: ${totalSliders}.  Selects: ${totalSelects}.  Pause toggles verified: ${totalPauseChecks}.\n\n`);
if (failures.length) {
  lines.push('## Failures\n\n');
  for (const f of failures) {
    lines.push(`### ${f.slug}\n`);
    if (f.errors?.length) lines.push(`- pageerror: ${f.errors.join('; ')}\n`);
    if (f.consoleErrs?.length) lines.push(`- console.error: ${f.consoleErrs.join('; ')}\n`);
    if (f.issues?.length) lines.push(`- issues: ${f.issues.join('; ')}\n`);
    lines.push('\n');
  }
} else {
  lines.push('All targets pass every gate (page load + clicks + pause toggle + slider input + select change).\n');
}
await fs.writeFile(path.join(ROOT, 'docs', 'SMOKE_REPORT.md'), lines.join(''));
console.log(`Wrote docs/SMOKE_REPORT.md (${results.filter(r => r.ok).length} OK / ${failures.length} fail / ${targets.length} total)`);
console.log(`Buttons: ${totalButtons}.  Sliders: ${totalSliders}.  Selects: ${totalSelects}.  Pause toggles: ${totalPauseChecks}.`);
if (failures.length) process.exit(1);
