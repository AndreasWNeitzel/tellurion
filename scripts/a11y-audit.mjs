#!/usr/bin/env node
// Headless a11y audit using axe-core. Loads axe.min.js from CDN at runtime.
// Usage:
//   node scripts/a11y-audit.mjs                          # audit dist/index.html + all hero playgrounds
//   node scripts/a11y-audit.mjs --playground <slug>      # audit one playground
//   node scripts/a11y-audit.mjs --all                    # audit every verified playground (slow)
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    playground: { type: 'string' },
    all: { type: 'boolean', default: false },
    out: { type: 'string', default: 'docs/A11Y_REPORT.md' },
  },
});

const ROOT = process.cwd();

function* walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (e === 'spec.md') yield p;
  }
}

function readVerifiedSlugs() {
  const out = [];
  for (const p of walk(path.join(ROOT, 'playgrounds'))) {
    const text = readFileSync(p, 'utf8');
    if (text.includes('status: verified')) {
      out.push(path.relative(ROOT, path.dirname(p)));
    }
  }
  return out;
}

async function startServer() {
  const server = createServer(async (req, res) => {
    let url = req.url.split('?')[0]; if (url === '/') url = '/index.html';
    try {
      const fp = path.join(ROOT, url);
      const data = await fs.readFile(fp);
      const ext = path.extname(fp);
      const ct = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.png': 'image/png' }[ext] || 'text/plain';
      res.writeHead(200, { 'content-type': ct }); res.end(data);
    } catch { res.writeHead(404); res.end('not found'); }
  });
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  return { server, baseUrl: `http://localhost:${port}` };
}

async function auditPage(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 10_000 });
  await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/axe-core@4.10.0/axe.min.js' });
  const result = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
    return r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length }));
  });
  return result;
}

const targets = [];
if (values.playground) {
  targets.push(`playgrounds/${values.playground}`);
} else if (values.all) {
  targets.push('.', ...readVerifiedSlugs());
} else {
  targets.push('.');
  for (const s of readVerifiedSlugs()) if (s.includes('_heroes')) targets.push(s);
}

const { server, baseUrl } = await startServer();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const report = [];
let totalViolations = 0;
try {
  for (const t of targets) {
    const u = t === '.' ? `${baseUrl}/index.html` : `${baseUrl}/${t}/index.html`;
    process.stdout.write(`audit ${t} ... `);
    try {
      const v = await auditPage(page, u);
      report.push({ target: t, url: u, violations: v });
      totalViolations += v.length;
      console.log(`${v.length} violation(s)`);
    } catch (e) {
      report.push({ target: t, url: u, error: e.message });
      console.log(`error: ${e.message}`);
    }
  }
} finally { await browser.close(); server.close(); }

// Write markdown report.
const md = [];
md.push(`# A11y audit report\n`);
md.push(`Generated: ${new Date().toISOString()}\n`);
md.push(`Total targets: ${targets.length}.\n`);
md.push(`Total WCAG 2.0 A/AA violations: ${totalViolations}.\n\n`);
for (const r of report) {
  md.push(`## ${r.target}\n`);
  if (r.error) { md.push(`Error: ${r.error}\n\n`); continue; }
  if (!r.violations.length) { md.push(`No violations.\n\n`); continue; }
  md.push(`| Rule | Impact | Nodes | Help |\n|-|-|-|-|\n`);
  for (const v of r.violations) md.push(`| ${v.id} | ${v.impact ?? '-'} | ${v.nodes} | ${v.help} |\n`);
  md.push('\n');
}
await fs.writeFile(values.out, md.join(''));
console.log(`Wrote ${values.out} (${targets.length} targets, ${totalViolations} total violations).`);
