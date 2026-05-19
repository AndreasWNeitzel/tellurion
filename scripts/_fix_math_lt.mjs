// One-shot: inside $...$ / $$...$$ spans only, replace bare < > with
// KaTeX \lt \gt so the emitted HTML is valid (bare < in $\sigma<0$ is
// parsed by the HTML parser as a tag). Applies to spec.md and
// index.html of the given playground dirs. Idempotent.
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = '/home/aneitzel/projects/portfolio/playgrounds-portfolio';
const rels = process.argv.slice(2);
const RE = /\$\$([\s\S]*?)\$\$|\$([^$\n]*?)\$/g;

function fixMath(text) {
  let n = 0;
  const out = text.replace(RE, (m, dd, sd) => {
    const body = dd !== undefined ? dd : sd;
    const delim = dd !== undefined ? '$$' : '$';
    if (!/[<>]/.test(body)) return m;
    n += 1;
    const fixed = body.replace(/</g, '\\lt ').replace(/>/g, '\\gt ');
    return delim + fixed + delim;
  });
  return { out, n };
}

for (const rel of rels) {
  for (const fname of ['spec.md', 'index.html']) {
    const fp = path.join(ROOT, 'playgrounds', rel, fname);
    let t;
    try { t = await fs.readFile(fp, 'utf8'); } catch { continue; }
    const { out, n } = fixMath(t);
    if (n > 0 && out !== t) { await fs.writeFile(fp, out); console.log(`fixed ${n} math span(s): ${rel}/${fname}`); }
    else console.log(`no change: ${rel}/${fname}`);
  }
}
