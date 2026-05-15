import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename, dirname, relative } from 'node:path';

function* walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (e === 'spec.md') yield p;
  }
}

function parseFM(text) {
  const out = {};
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return out;
  const lines = m[1].split('\n');
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const k = line.slice(0, idx).trim();
    let v = line.slice(idx + 1).trim();
    if (v.startsWith('[') && v.endsWith(']')) v = v.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    out[k] = v;
  }
  return out;
}

const cards = [];
for (const path of walk('playgrounds')) {
  const text = readFileSync(path, 'utf8');
  const fm = parseFM(text);
  if (fm.status !== 'verified') continue;
  const dir = dirname(path);
  const slug = basename(dir);
  cards.push({
    slug,
    path: relative('.', dir),
    title: (fm.title || slug).replace(/['"]/g, ''),
    primary_uc: fm.primary_uc || '',
    curriculum_year: fm.curriculum_year || '',
    hook: (fm.hook || '').replace(/^['"]|['"]$/g, ''),
    tags: Array.isArray(fm.tags) ? fm.tags : [],
    difficulty: fm.difficulty || '3',
    tier: fm.tier || 'simple',
    hero_candidate: fm.hero_candidate === 'true',
    renderer: fm.renderer || 'canvas2d',
  });
}

const TAGS = ['mechanics','waves','optics','electromagnetism','thermodynamics','statistical-physics','quantum','atomic-molecular','nuclear-particle','solid-state','fluids-mhd','relativity','cosmology','stellar','galactic','exoplanets','numerics','interactive-drag','click-seed','live-readout','multi-panel','log-scale','animation','toggle-choices'];

const heroes = cards.filter(c => c.hero_candidate).slice(0, 4);

const cardsHTML = cards.map(c => `
  <a class="card" data-tags="${c.tags.join(' ')}" data-title="${c.title.toLowerCase()}" data-uc="${c.primary_uc}" data-year="${c.curriculum_year}" href="${c.path}/index.html">
    <h3>${c.title}</h3>
    <div class="meta">${c.primary_uc} · ${c.curriculum_year}</div>
    <div class="tags">${c.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
  </a>`).join('\n');

const heroHTML = heroes.length ? heroes.map(h => `
  <a class="hero-card" href="${h.path}/index.html">
    <div class="hero-badge">Start here</div>
    <h2>${h.title}</h2>
    <div class="hero-meta">${h.primary_uc}</div>
  </a>`).join('\n') : '<p>Heroes coming soon.</p>';

const tagsRail = TAGS.map(t => `<button class="chip" data-tag="${t}">${t}</button>`).join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Playgrounds Portfolio. Andreas W. Neitzel</title>
<meta property="og:title" content="Playgrounds Portfolio">
<meta property="og:description" content="${cards.length} interactive physics, astronomy, and ML playgrounds.">
<meta name="twitter:card" content="summary">
<link rel="stylesheet" href="shared/css/tokens.css">
<link rel="stylesheet" href="shared/css/base.css">
<style>
body { max-width: 1200px; margin: 0 auto; padding: var(--space-4); font-family: ui-sans-serif, system-ui, sans-serif; background: #0a0a0c; color: var(--fg, #e8e8e8); --fg-muted: #B3B5B8; --fg: #E8E8E6; --accent: #6BB4E0; }
.header { padding: var(--space-4) 0; }
.heroes { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-3); margin-block: var(--space-4); }
.hero-card { display: block; padding: var(--space-3); background: linear-gradient(135deg, #1a1a25, #0f1a25); border: 1px solid #3a3a40; border-radius: 8px; color: var(--fg); text-decoration: none; transition: border-color 200ms; }
.hero-card:hover { border-color: var(--accent, #ffd166); }
.hero-badge { font-size: 10px; color: var(--accent, #ffd166); letter-spacing: 0.1em; text-transform: uppercase; }
.hero-card h2 { font-size: 18px; margin: 4px 0 8px; }
.hero-meta { font-size: 12px; color: var(--fg-muted, #9aa0a6); }
.search { display: flex; gap: var(--space-2); margin-block: var(--space-3); }
.search input { flex: 1; padding: 10px 12px; background: #1a1a1f; border: 1px solid #3a3a40; color: var(--fg); border-radius: 4px; font-size: 14px; }
.tags-rail { display: flex; flex-wrap: wrap; gap: 6px; margin-block: var(--space-3); }
.chip { padding: 4px 10px; background: #1a1a1f; border: 1px solid #3a3a40; color: var(--fg-muted); border-radius: 999px; font-size: 11px; font-family: ui-monospace, monospace; cursor: pointer; }
.chip.active { background: var(--accent, #ffd166); color: #060608; border-color: var(--accent, #ffd166); }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-3); }
.card { display: block; padding: var(--space-3); background: #14141a; border: 1px solid #2a2a30; border-radius: 6px; color: var(--fg); text-decoration: none; transition: border-color 150ms, transform 150ms; }
.card:hover { border-color: var(--accent, #ffd166); transform: translateY(-2px); }
.card h3 { font-size: 14px; margin: 0 0 6px; }
.card .meta { font-size: 11px; color: var(--fg-muted); margin-bottom: 6px; }
.card .tags { display: flex; flex-wrap: wrap; gap: 3px; }
.card .tag { font-size: 9px; padding: 2px 6px; background: #2a2a30; color: var(--fg-muted); border-radius: 3px; font-family: ui-monospace, monospace; }
footer { padding: var(--space-4) 0; color: var(--fg-muted); font-size: 12px; } footer a { color: var(--accent, #ffd166); }
</style>
</head>
<body>
<div class="header">
  <h1>Playgrounds Portfolio</h1>
  <p>${cards.length} interactive simulations across physics, astronomy, statistical mechanics, and machine learning. Built for AI-lab hiring committees and ESA Research Fellowship reviewers; aligned to the UPorto FCUP Bachelor in Physics and MSc in Astronomy and Astrophysics curriculum.</p>
</div>

<section>
  <h2>Start here</h2>
  <div class="heroes">${heroHTML}</div>
</section>

<section>
  <h2>Browse</h2>
  <div class="search">
    <input id="search-input" type="text" placeholder="Filter by title, UC, or year (e.g., 'fourier', 'AST2004', 'bsc-y3s1')">
  </div>
  <div class="tags-rail">${tagsRail}</div>
  <div class="card-grid" id="card-grid">${cardsHTML}</div>
</section>

<footer>
  Maintained by Andreas W. Neitzel · ORCID 0000-0001-6283-907X · IA/CAUP, U. Porto · <a href="https://github.com/AndreasWNeitzel/playgrounds-portfolio">source</a>
</footer>

<script>
(function() {
  const input = document.getElementById('search-input');
  const grid = document.getElementById('card-grid');
  const cards = Array.from(grid.querySelectorAll('.card'));
  const chips = Array.from(document.querySelectorAll('.chip'));
  const active = new Set();
  function refresh() {
    const q = input.value.toLowerCase();
    for (const c of cards) {
      const t = c.dataset.title, uc = (c.dataset.uc || '').toLowerCase(), y = c.dataset.year;
      const tags = new Set((c.dataset.tags || '').split(' '));
      const matchQ = !q || t.includes(q) || uc.includes(q) || y.includes(q);
      const matchTag = active.size === 0 || [...active].every(t => tags.has(t));
      c.style.display = (matchQ && matchTag) ? '' : 'none';
    }
  }
  input.addEventListener('input', refresh);
  chips.forEach(chip => chip.addEventListener('click', () => {
    chip.classList.toggle('active');
    if (active.has(chip.dataset.tag)) active.delete(chip.dataset.tag);
    else active.add(chip.dataset.tag);
    refresh();
  }));
})();
</script>
</body></html>`;

writeFileSync('dist/index.html', html);
writeFileSync('index.html', html);
console.log(`Wrote dist/index.html and index.html (${cards.length} cards, ${heroes.length} heroes).`);
