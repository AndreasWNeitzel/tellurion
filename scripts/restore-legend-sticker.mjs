import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const base = 'playgrounds/_legends';
let fixed = 0;
for (const name of readdirSync(base)) {
  const p = join(base, name, 'index.html');
  if (!existsSync(p)) continue;
  let html = readFileSync(p, 'utf8');
  const before = html;
  // Headline: "TitleLEGEND" -> "Title <span class="legend-badge">LEGEND</span>"
  html = html.replace(
    /(<h1 class="t-title playground-title">)([^<]+?)LEGEND<\/h1>/,
    (_m, open, title) => `${open}${title.trimEnd()} <span class="legend-badge">LEGEND</span></h1>`,
  );
  // Back-button title: "TitleLEGEND" -> "Title Legend" (plain, readable)
  html = html.replace(
    /(<span class="back-title">)([^<]+?)LEGEND<\/span>/,
    (_m, open, title) => `${open}${title.trimEnd()} Legend</span>`,
  );
  if (html !== before) { writeFileSync(p, html); fixed += 1; console.log(`fixed ${name}`); }
  else console.log(`skip  ${name} (already has the sticker)`);
}
console.log(`legend sticker restored on ${fixed} playgrounds`);
