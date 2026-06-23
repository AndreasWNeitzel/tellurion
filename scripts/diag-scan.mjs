#!/usr/bin/env node
// Diagnostics health scan: load each playground, call window.playground.getState()
// and getInvariants(), and flag any field/invariant whose value is NaN, Infinity,
// undefined, the literal string "NaN"/"undefined", or that throws. These feed the
// on-screen rail, so a bad value is a visible defect (mandate: correct text, no
// bugs). Needs `npm run dev` on :5173.
// Usage: node scripts/diag-scan.mjs --start 0 --count 60
import { chromium } from 'playwright';
import { readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const START = parseInt(arg('start', '0'), 10);
const COUNT = parseInt(arg('count', '60'), 10);
const ONLY = arg('only', null);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    let s; try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) {
      if (['node_modules', 'references', '_template'].includes(name)) continue;
      if (existsSync(join(p, 'index.html'))) out.push(p);
      out.push(...walk(p));
    }
  }
  return out;
}

let dirs = walk('playgrounds').filter((d) => !d.split('/').pop().startsWith('_gl'));
if (ONLY) dirs = dirs.filter((d) => d.includes(ONLY));
else dirs = dirs.slice(START, START + COUNT);

const BASE = 'http://localhost:5173';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const flagged = [];
for (const dir of dirs) {
  const rel = dir.replace('playgrounds/', '');
  const page = await browser.newPage({ viewport: { width: 1100, height: 1100 }, reducedMotion: 'no-preference' });
  let verdict = 'ok';
  try {
    await page.goto(`${BASE}/playgrounds/${rel}/index.html`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(900);
    const bad = await page.evaluate(() => {
      const pg = window.playground;
      const out = [];
      const isBad = (v) => {
        if (v === undefined || v === null) return true;
        if (typeof v === 'number') return !Number.isFinite(v);
        if (typeof v === 'string') return /\b(NaN|undefined|Infinity)\b/.test(v);
        return false;
      };
      if (!pg) return ['no-playground-object'];
      try {
        const st = pg.getState ? pg.getState() : null;
        if (st && Array.isArray(st.fields)) for (const f of st.fields) if (isBad(f.value)) out.push(`state.${f.key || f.label}=${f.value}`);
      } catch (e) { out.push('getState-throws:' + String(e).slice(0, 40)); }
      try {
        const inv = pg.getInvariants ? pg.getInvariants() : null;
        if (Array.isArray(inv)) for (const v of inv) if (isBad(v.value)) out.push(`inv.${v.key || v.label}=${v.value}`);
      } catch (e) { out.push('getInvariants-throws:' + String(e).slice(0, 40)); }
      return out;
    });
    if (bad && bad.length) { verdict = bad.join('  '); flagged.push(`${rel} :: ${verdict}`); }
  } catch (e) { verdict = 'ERR ' + String(e).split('\n')[0].slice(0, 50); }
  console.log(rel.padEnd(52), verdict === 'ok' ? 'ok' : 'BAD ' + verdict);
  await page.close();
}
await browser.close();
console.log(`\n=== diag-flagged (${flagged.length}/${dirs.length}) ===`);
for (const f of flagged) console.log('  ' + f);
console.log('=== DIAG-SCAN DONE ===');
