// Batch golden-frame regeneration for one playground category.
// The v2 layout migration and the QA-pass improvements changed the
// rendered output of nearly every playground, but the committed
// golden frames were never re-baselined, so the visual gate is stale
// portfolio-wide. This recaptures the deterministic reference frames
// for every playground under a given category prefix and promotes
// them to references/golden-frames/. Captures run CONC at a time.
//
// Usage: node scripts/regen-goldens-batch.mjs <category>   e.g. _heroes
import { readdirSync, existsSync, copyFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFile } from 'node:child_process';

const ROOT = '/home/aneitzel/projects/portfolio/playgrounds-portfolio';
const CONC = 3;
const cat = process.argv[2];
if (!cat) { console.error('usage: regen-goldens-batch.mjs <category>'); process.exit(2); }
const catDir = join(ROOT, 'playgrounds', cat);
if (!existsSync(catDir)) { console.error(`no such category: ${cat}`); process.exit(2); }

const FRAMES = ['t-000.png', 't-025.png', 't-050.png', 't-075.png', 't-100.png', 'manifest.json'];
const pgs = readdirSync(catDir).filter(p => {
  const d = join(catDir, p);
  return statSync(d).isDirectory()
    && existsSync(join(d, 'index.html'))
    && existsSync(join(d, 'references', 'golden-frames'));
});

let ok = 0, fail = 0, idx = 0;

function capture(rel) {
  return new Promise((resolve) => {
    execFile('node', ['scripts/capture-reference.mjs', '--playground', rel, '--deterministic'],
      { cwd: ROOT, timeout: 150000 }, (err) => resolve(err));
  });
}

async function worker() {
  while (idx < pgs.length) {
    const pg = pgs[idx++];
    const rel = `${cat}/${pg}`;
    const err = await capture(rel);
    if (err) { fail += 1; console.log(`FAIL ${rel} :: ${String(err.message).split('\n')[0]}`); continue; }
    try {
      const capRoot = join(catDir, pg, 'references', 'captured');
      const latest = readdirSync(capRoot).sort().reverse()[0];
      const src = join(capRoot, latest);
      const dst = join(catDir, pg, 'references', 'golden-frames');
      let copied = 0;
      for (const f of FRAMES) {
        if (existsSync(join(src, f))) { copyFileSync(join(src, f), join(dst, f)); copied += 1; }
      }
      if (copied >= 5) { ok += 1; console.log(`ok   ${rel} (${copied} files)`); }
      else { fail += 1; console.log(`PARTIAL ${rel} (${copied} files)`); }
    } catch (e) {
      fail += 1;
      console.log(`FAIL ${rel} :: ${String(e.message).split('\n')[0]}`);
    }
  }
}

await Promise.all(Array.from({ length: CONC }, () => worker()));
console.log(`\nregenerated ${ok}/${pgs.length} in ${cat}; ${fail} failed`);
