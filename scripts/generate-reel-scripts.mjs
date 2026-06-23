#!/usr/bin/env node
// Generate a vertical short-form (Reel) narration script, REEL.md, for every
// playground, grounded in that playground's real spec.md and index.html so the
// content is specific, not templated filler. First-person voice, no em-dash, no
// emoji, single-author. Run: node scripts/generate-reel-scripts.mjs [--force]
//   [--only <slug-substring>]
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'playgrounds';
const FORCE = process.argv.includes('--force');
// --upgrade rewrites only existing boilerplate REEL.md files (those carrying
// the old codemod marker), leaving hand-written bespoke scripts untouched.
const UPGRADE = process.argv.includes('--upgrade');
const onlyIdx = process.argv.indexOf('--only');
const ONLY = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : null;
// Discriminators present only in the old codemod scripts (the new template
// removes these generic beat-4 lines), so a regenerated file no longer matches.
const BOILERPLATE_MARKERS = ['watch the rail readouts respond', 'Compare the diagnostic plot against the live scene'];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    let s; try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) {
      if (name === '_template' || name === 'node_modules' || name === 'references') continue;
      if (existsSync(join(p, 'index.html'))) out.push(p);
      out.push(...walk(p));
    }
  }
  return out;
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
}

// Spoken-language cleanup. Frontmatter prose is already math-light, but this
// strips any residual LaTeX (so a voiceover never reads "\delta(s_i, s_j)"):
// inline math delimiters, backslash commands, sub/superscript braces, and the
// combining marks KaTeX leaves behind when its source and render are merged.
function cleanMath(s) {
  if (!s) return '';
  return s
    .replace(/\$\$?([^$]*)\$\$?/g, '$1')          // drop $...$ delimiters, keep inside
    .replace(/\\[a-zA-Z]+\s?/g, '')               // \delta \propto \, etc.
    .replace(/[\^_]\{([^}]*)\}/g, ' $1')           // x_{i} -> x i
    .replace(/[\^_]([A-Za-z0-9])/g, ' $1')         // x_i -> x i
    .replace(/[{}\\]/g, '')                        // stray braces/backslashes
    .replace(/[̀-ͯ -⁯]/g, '')  // combining marks, sub/superscript glyphs
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
function firstSentence(s) { const m = s.match(/^(.*?[.!?])(\s|$)/); return (m ? m[1] : s).trim(); }
function sentences(s, n) {
  const parts = s.match(/[^.!?]+[.!?]+/g) || [s];
  return parts.slice(0, n).map((x) => x.trim()).join(' ');
}

function parseFrontmatter(md) {
  const fm = {};
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { fm, body: md };
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^['"]|['"]$/g, '').trim();
  }
  return { fm, body: md.slice(m[0].length) };
}

function extract(dir) {
  const html = existsSync(join(dir, 'index.html')) ? readFileSync(join(dir, 'index.html'), 'utf8') : '';
  const spec = existsSync(join(dir, 'spec.md')) ? readFileSync(join(dir, 'spec.md'), 'utf8') : '';
  const { fm } = parseFrontmatter(spec);
  const titleM = html.match(/class="[^"]*playground-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/);
  const title = titleM ? stripTags(titleM[1]) : (fm.title || dir.split('/').pop());
  // Prefer the authored frontmatter prose (math-light) over the KaTeX-rendered
  // HTML intro, whose stripped form mashes the rendered math with its source.
  const introM = html.match(/class="playground-intro"[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
  let intro = cleanMath(fm.one_paragraph || (introM ? stripTags(introM[1]) : ''));
  // peel off a trailing "Reference: ..." so it is not spoken as narration.
  const refSplit = intro.match(/^([\s\S]*?)\s*(?:Reference|Source)[:\s]+([\s\S]+)$/i);
  let source = fm.primary_citation || '';
  if (refSplit) { intro = refSplit[1].trim(); source = refSplit[2].trim(); }
  const tryM = html.match(/playground-what-to-try[\s\S]*?<ul>([\s\S]*?)<\/ul>/);
  const GENERIC_TRY = [/watch the rail readouts respond/i, /compare the diagnostic plot against the live scene/i, /vary each control/i];
  const tries = (tryM ? [...tryM[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((x) => cleanMath(stripTags(x[1]))) : [])
    .filter((t) => t && !GENERIC_TRY.some((re) => re.test(t)));
  const capM = html.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/);
  const caption = capM ? stripTags(capM[1]) : (fm.caption || '');
  if (!refSplit) source = (caption.match(/(?:Source|Reference)[:\s]+([^.]+\.)/i) || [])[1] || source;
  return { title, intro, tries, caption, source, hook: cleanMath(fm.hook || '') };
}

function buildReel(slug, e) {
  const hook = e.hook ? firstSentence(e.hook) : `Here is ${e.title.toLowerCase()}, made interactive.`;
  const reveal = e.intro ? firstSentence(e.intro) : '';
  const mechanism = e.intro ? sentences(e.intro.replace(firstSentence(e.intro), '').trim(), 2) : '';
  const tryIt = e.tries[0] || 'Drag a control and watch the whole picture change, not just a number on the side.';
  const tryIt2 = e.tries[1] || 'Push it to an extreme and see where the physics breaks down.';
  const payoff = e.hook && e.hook.includes(';') ? e.hook.split(';').slice(1).join(';').trim().replace(/^['"]|['"]$/g, '') : (e.intro ? sentences(e.intro, 99).split('. ').slice(-1)[0] : '');
  const cap = (s, n = 42) => s.length > n ? s.slice(0, n - 1).trim() + '…' : s;
  return `# Reel script: ${e.title}

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: ${hook}
Caption: ${cap(hook)}

## Beat 2, the reveal (3 to 10s)
VO: ${reveal || 'Watch what the simulation is actually doing.'}
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: ${mechanism || 'The animation is driven by the real equations, not a canned loop.'}
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: ${tryIt}${tryIt2 ? '\nVO: ' + tryIt2 : ''}
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: ${payoff || 'That is the whole idea in one picture.'}
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- ${cap(hook)}
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

${e.source ? '## Source\n' + e.source : ''}
`;
}

const dirs = walk(ROOT).filter((d) => !ONLY || d.includes(ONLY));
let written = 0, skipped = 0;
for (const dir of dirs) {
  const slug = dir.split('/').pop();
  if (slug.startsWith('_')) continue;
  const out = join(dir, 'REEL.md');
  if (existsSync(out)) {
    if (UPGRADE) {
      const cur = readFileSync(out, 'utf8');
      if (!BOILERPLATE_MARKERS.some((m) => cur.includes(m))) { skipped++; continue; }
    } else if (!FORCE) { skipped++; continue; }
  }
  try {
    const e = extract(dir);
    writeFileSync(out, buildReel(slug, e));
    written++;
  } catch (err) {
    console.error('FAIL', slug, String(err).split('\n')[0]);
  }
}
console.log(`reel scripts: wrote ${written}, skipped ${skipped} (existing), total dirs ${dirs.length}`);
