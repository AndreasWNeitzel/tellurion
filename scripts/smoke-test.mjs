#!/usr/bin/env node
// Headless smoke test: visit every verified playground's index.html, check for page
// errors and basic interactivity. Writes docs/SMOKE_REPORT.md and exits nonzero on
// any console error or page error.
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
try {
  for (const t of targets) {
    const errors = [];
    const consoleErrs = [];
    const onErr = (e) => errors.push(e.message);
    const onConsole = (m) => { if (m.type() === 'error') consoleErrs.push(m.text()); };
    page.on('pageerror', onErr);
    page.on('console', onConsole);
    const url = `${baseUrl}/${t}/index.html`;
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 5000 });
      // Give it 200ms to run any rAF callbacks.
      await page.waitForTimeout(200);
      const bodyText = await page.evaluate(() => document.body.textContent.length);
      results.push({ slug: t, ok: errors.length === 0 && consoleErrs.length === 0, errors, consoleErrs, bodyLen: bodyText });
      if (errors.length || consoleErrs.length) failures.push({ slug: t, errors, consoleErrs });
    } catch (e) {
      results.push({ slug: t, ok: false, errors: [e.message], consoleErrs: [] });
      failures.push({ slug: t, errors: [e.message] });
    }
    page.off('pageerror', onErr);
    page.off('console', onConsole);
  }
} finally { await browser.close(); server.close(); }

const lines = [];
lines.push('# Smoke test report\n');
lines.push(`Generated: ${new Date().toISOString()}\n`);
lines.push(`Targets: ${targets.length}.  OK: ${results.filter(r => r.ok).length}.  Failures: ${failures.length}.\n\n`);
if (failures.length) {
  lines.push('## Failures\n\n');
  for (const f of failures) {
    lines.push(`### ${f.slug}\n`);
    if (f.errors?.length) lines.push(`- pageerror: ${f.errors.join('; ')}\n`);
    if (f.consoleErrs?.length) lines.push(`- console.error: ${f.consoleErrs.join('; ')}\n`);
    lines.push('\n');
  }
} else {
  lines.push('All targets loaded cleanly with no page errors or console errors.\n');
}
await fs.writeFile(path.join(ROOT, 'docs', 'SMOKE_REPORT.md'), lines.join(''));
console.log(`Wrote docs/SMOKE_REPORT.md (${results.filter(r => r.ok).length} OK / ${failures.length} fail / ${targets.length} total).`);
if (failures.length) process.exit(1);
