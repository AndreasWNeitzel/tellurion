import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import { startStaticServer } from '../tests/helpers/static-server.mjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const arg = process.argv[2], out = process.argv[3] || '/tmp/probe';
const base = path.join(ROOT, 'playgrounds');
let pgDir = null;
for (const y of await fs.readdir(base)) { const c = path.join(base, y, arg); try { if ((await fs.stat(path.join(c, 'index.html'))).isFile()) { pgDir = c; break; } } catch {} }
const { server, url } = await startStaticServer(ROOT);
const rel = path.relative(ROOT, pgDir).split(path.sep).join('/');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 820 } });
const errs = [];
page.on('console', (m) => errs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => errs.push('PAGEERR ' + (e && e.stack ? e.stack.split('\n').slice(0,4).join(' | ') : String(e))));
// install a rAF counter BEFORE any script runs
await page.addInitScript(() => {
  window.__raf = 0;
  const o = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => { window.__raf += 1; return o(cb); };
});
await page.goto(`${url}/${rel}/index.html`, { waitUntil: 'load', timeout: 20000 });
await page.waitForTimeout(700);
const a = await page.evaluate(() => ({ raf: window.__raf, hash: (() => { const c = document.getElementById('stage'); try { const g = c.getContext('2d'); const d = g.getImageData(0,0,c.width,Math.min(60,c.height)).data; let h=0; for (let i=0;i<d.length;i+=97) h=(h*31+d[i])|0; return h; } catch(e){ return 'ERR:'+e; } })() }));
await page.locator('#stage').screenshot({ path: `${out}-A.png` }).catch(()=>{});
await page.waitForTimeout(4000);
const b = await page.evaluate(() => ({ raf: window.__raf, hash: (() => { const c = document.getElementById('stage'); try { const g = c.getContext('2d'); const d = g.getImageData(0,0,c.width,Math.min(60,c.height)).data; let h=0; for (let i=0;i<d.length;i+=97) h=(h*31+d[i])|0; return h; } catch(e){ return 'ERR:'+e; } })() }));
await page.locator('#stage').screenshot({ path: `${out}-B.png` }).catch(()=>{});
console.log('PROBE', arg);
console.log(' t=0.7s raf=', a.raf, 'hash=', a.hash);
console.log(' t=4.7s raf=', b.raf, 'hash=', b.hash, b.raf===a.raf?'(rAF FROZEN)':'(rAF running)', b.hash===a.hash?'(canvas STATIC)':'(canvas changing)');
console.log('ERRORS', errs.length ? '\n'+errs.join('\n') : 'none');
await browser.close(); await server.closePromise();
