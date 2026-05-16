// scripts/qa-fullpage-shots.mjs
// Full-PAGE screenshots of every playground (not just the #stage
// canvas) so LaTeX/KaTeX, caption, control and layout bugs are
// visible. Serves the project root, loads each index.html in
// deterministic capture mode, waits for readiness, writes
// /tmp/pgshots/<year>__<uc-slug>.png and a manifest of load errors.

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from '../tests/helpers/static-server.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = '/tmp/pgshots';
const ONLY = process.argv[2] || '';            // optional substring filter

async function listPlaygrounds() {
  const out = [];
  async function walk(dir, depth) {
    const ents = await fs.readdir(dir, { withFileTypes: true });
    for (const e of ents) {
      if (!e.isDirectory()) continue;
      const p = path.join(dir, e.name);
      if (e.name === '_template') continue;
      const rel = path.relative(path.join(ROOT, 'playgrounds'), p);
      const hasIndex = await fs.access(path.join(p, 'index.html')).then(() => true).catch(() => false);
      if (hasIndex) out.push(rel);
      else if (depth < 2) await walk(p, depth + 1);
    }
  }
  await walk(path.join(ROOT, 'playgrounds'), 0);
  return out.sort();
}

const main = async () => {
  await fs.mkdir(OUT, { recursive: true });
  const { server, url } = await startStaticServer(ROOT);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 1400 } });
  const pgs = await listPlaygrounds();
  const report = [];
  for (let i = 0; i < pgs.length; i += 1) {
    const rel = pgs[i];
    const safe = rel.replace(/\//g, '__');
    const errs = [];
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
    page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(`console: ${m.text()}`); });
    const u = new URL(`${url}/playgrounds/${rel}/index.html`);
    u.searchParams.set('seed', '0xC0FFEE');
    u.searchParams.set('deterministic', '1');
    u.searchParams.set('capture', 'qa');
    u.searchParams.set('captureFraction', '0.5');
    try {
      await page.goto(u.toString(), { waitUntil: 'load', timeout: 20000 });
      await page.waitForFunction('window.__simulationReady === true', { timeout: 12000 }).catch(() => errs.push('no __simulationReady'));
      await page.waitForTimeout(350);                 // let KaTeX auto-render flush
      await page.screenshot({ path: path.join(OUT, `${safe}.png`), fullPage: true });
    } catch (e) {
      errs.push(`goto/shot: ${e.message}`);
      try { await page.screenshot({ path: path.join(OUT, `${safe}.png`), fullPage: true }); } catch { /* skip */ }
    }
    report.push({ rel, errs });
    if (errs.length) console.log(`[ERR] ${rel} :: ${errs.join(' | ')}`);
    else console.log(`[ok ] ${rel}`);
  }
  await fs.writeFile(path.join(OUT, '_report.json'), JSON.stringify(report, null, 2));
  await browser.close();
  await server.closePromise?.();
  const bad = report.filter((r) => r.errs.length);
  console.log(`\nDONE ${pgs.length} playgrounds, ${bad.length} with load/console errors.`);
  process.exit(0);
};

if (ONLY) console.log(`(filter: ${ONLY})`);
main();
