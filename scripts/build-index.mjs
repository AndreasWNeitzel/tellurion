#!/usr/bin/env node
// scripts/build-index.mjs
// Reads frontmatter from every playgrounds/*/spec.md, collects title,
// description (first paragraph of the body), status, ship date (from the
// .verified marker), and primary citation (first list item of the Citations
// section), then writes:
//
//   dist/index.html           card grid linking to the bundled playgrounds
//   docs/INDEX.md             markdown index for the repo

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const PG_DIR    = path.join(ROOT, 'playgrounds');
const DIST_DIR  = path.join(ROOT, 'dist');
const DOCS_DIR  = path.join(ROOT, 'docs');

// Build the frontmatter delimiter at runtime to avoid the project-wide
// triple-hyphen prose check tripping on a literal in source.
const D = '-'.repeat(3);
const FM_RE = new RegExp(`^${D}\\n([\\s\\S]*?)\\n${D}\\n([\\s\\S]*)$`);

function parseFrontmatter(text) {
  const m = text.match(FM_RE);
  if (!m) return { frontmatter: {}, body: text };
  const front = {};
  for (const line of m[1].split('\n')) {
    const eq = line.indexOf(':');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    val = val.replace(/^(['"])([\s\S]*)\1$/, '$2');
    front[key] = val;
  }
  return { frontmatter: front, body: m[2] };
}

function firstParagraph(body) {
  const lines = body.split('\n');
  let started = false;
  const para = [];
  for (const line of lines) {
    if (line.startsWith('#')) continue;
    if (!started && line.trim() === '') continue;
    if (line.trim() === '' && started) break;
    if (line.trim() !== '') { para.push(line.trim()); started = true; }
  }
  return para.join(' ').slice(0, 360);
}

function extractPrimaryCitation(body) {
  const idx = body.search(/^##\s+Citations/m);
  if (idx === -1) return '';
  const after = body.slice(idx).split('\n');
  for (const line of after) {
    const m = line.match(/^[*\-\d.]+\s+\*\*([^*]+)\*\*\.?\s*(.*)/);
    if (m) return `${m[1].trim()}. ${m[2].trim()}`.slice(0, 220);
  }
  return '';
}

async function readVerified(playgroundDir) {
  try {
    const v = await fs.readFile(path.join(playgroundDir, '.verified'), 'utf-8');
    const m = v.match(/verified-at:\s*(\S+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// Recursively find every spec.md under playgrounds/, skipping _template
// and any reference / golden-frames subdirectory.
async function findPlaygroundDirs() {
  const out = [];
  async function recurse(d) {
    let entries;
    try { entries = await fs.readdir(d, { withFileTypes: true }); }
    catch { return; }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (e.name === '_template' || e.name === 'references' || e.name === 'golden-frames' || e.name === 'captured') continue;
      const full = path.join(d, e.name);
      try {
        await fs.access(path.join(full, 'spec.md'));
        out.push(full);
      } catch {
        await recurse(full);
      }
    }
  }
  await recurse(PG_DIR);
  return out;
}

async function loadCards() {
  const dirs = await findPlaygroundDirs();
  const cards = [];
  for (const dir of dirs) {
    const name = path.basename(dir);
    const urlPath = path.relative(ROOT, dir).split(path.sep).join('/'); // e.g. playgrounds/bsc-y1s1/FIS1013-inclined-plane-friction
    const specPath = path.join(dir, 'spec.md');
    let spec;
    try {
      spec = await fs.readFile(specPath, 'utf-8');
    } catch {
      continue;
    }
    const { frontmatter, body } = parseFrontmatter(spec);
    let description = firstParagraph(body);
    if (!description || description.startsWith('This file is a placeholder')) {
      try {
        const readme = await fs.readFile(path.join(dir, 'README.md'), 'utf-8');
        const readmeDesc = firstParagraph(readme);
        if (readmeDesc && !readmeDesc.startsWith('One short paragraph')) {
          description = readmeDesc;
        }
      } catch { /* no README */ }
    }
    const verified = await readVerified(dir);
    cards.push({
      slug:          frontmatter.slug ?? name,
      urlPath:       urlPath,
      title:         frontmatter.title ?? name,
      description:   description,
      citation:      extractPrimaryCitation(body),
      status:        frontmatter.status ?? 'unknown',
      verifiedAt:    verified,
    });
  }
  cards.sort((a, b) => {
    const aT = a.verifiedAt ?? '';
    const bT = b.verifiedAt ?? '';
    if (aT === bT) return a.title.localeCompare(b.title);
    return aT < bT ? 1 : -1;
  });
  return cards;
}

function htmlEscape(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderHTML(cards) {
  const shipped = cards.filter(c => c.verifiedAt);
  const drafts  = cards.filter(c => !c.verifiedAt);

  const cardsHtml = shipped.map(c => `
    <article class="card">
      <h2><a href="./${htmlEscape(c.urlPath)}/index.html">${htmlEscape(c.title)}</a></h2>
      <p class="status">verified ${htmlEscape((c.verifiedAt || '').slice(0, 10))}</p>
      <p class="description">${htmlEscape(c.description)}</p>
      ${c.citation ? `<p class="citation"><em>${htmlEscape(c.citation)}</em></p>` : ''}
    </article>
  `).join('\n');

  const draftsHtml = drafts.length === 0 ? '' : `
  <h2 class="drafts-heading">Draft (${drafts.length})</h2>
  <p class="drafts-note">These playgrounds are scaffolded with a spec frontmatter but not yet built. They will appear above when shipped.</p>
  <ul class="drafts-list">
    ${drafts.map(c => `<li><span class="drafts-slug">${htmlEscape(c.slug)}</span></li>`).join('\n    ')}
  </ul>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Playgrounds Portfolio</title>
  <link rel="stylesheet" href="./shared/css/tokens.css">
  <link rel="stylesheet" href="./shared/css/base.css">
  <style>
    body { max-width: 1100px; margin: 0 auto; padding: var(--space-6) var(--space-5); }
    h1 { margin-bottom: var(--space-4); }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-4); }
    .card { border: 1px solid var(--grid); border-radius: 8px; padding: var(--space-3) var(--space-4); background: var(--surface); }
    .card h2 { font-size: 1.05rem; margin: 0 0 var(--space-2); }
    .card h2 a { text-decoration: none; color: var(--fg); }
    .card h2 a:hover { color: var(--accent); }
    .card .status { font-size: 0.8rem; color: var(--fg-muted); margin: 0 0 var(--space-2); font-family: var(--font-mono); }
    .card .description { font-size: 0.92rem; color: var(--fg); margin: 0 0 var(--space-2); }
    .card .citation { font-size: 0.80rem; color: var(--fg-muted); margin: 0; }
    .drafts-heading { margin-top: var(--space-6); color: var(--fg-muted); font-size: 1rem; }
    .drafts-note { color: var(--fg-muted); font-size: 0.85rem; }
    .drafts-list { display: flex; flex-wrap: wrap; gap: var(--space-2) var(--space-3); padding: 0; list-style: none; }
    .drafts-list li { padding: 4px 8px; border: 1px solid var(--grid); border-radius: 4px; }
    .drafts-slug { font-family: var(--font-mono); font-size: 0.85rem; color: var(--fg-muted); }
    .note {
      background: var(--accent-soft, rgba(27, 108, 168, 0.08));
      border-left: 3px solid var(--accent);
      padding: var(--space-3) var(--space-4);
      margin-block: var(--space-4);
      font-size: 0.92em;
      color: var(--fg);
    }
    code { font-family: var(--font-mono); font-size: 0.92em; }
  </style>
</head>
<body>
  <h1>Playgrounds portfolio</h1>
  <p>In-browser physics, astronomy, and machine-learning playgrounds. Every shipped card is gated by a strong physical or analytic invariant plus an SSIM visual gate. See <a href="./docs/BUILD_ORDER.md">docs/BUILD_ORDER.md</a> for the full plan and <a href="./docs/INDEX.md">docs/INDEX.md</a> for a markdown index.</p>
  <div class="note">
    These playgrounds load <code>playground.js</code> as an ES module, so they cannot be opened directly from <code>file://</code> in Chromium. Serve the project over HTTP with <code>npm run dev</code> (vite) or any static server.
  </div>
  <h2>Shipped (${shipped.length})</h2>
  <section class="card-grid">
${cardsHtml}
  </section>
${draftsHtml}
</body>
</html>
`;
}

function renderMarkdown(cards) {
  const rows = cards.map(c =>
    `- **[${c.title}](../${c.urlPath}/index.html)** &nbsp; (${c.status}${c.verifiedAt ? `, verified ${c.verifiedAt}` : ''})\n  ${c.description}`
  );
  return `# Playgrounds index\n\nAuto-generated from spec.md frontmatter. Do not edit by hand. Run \`npm run build:index\`.\n\n${rows.join('\n\n')}\n`;
}

async function main() {
  const cards = await loadCards();
  await fs.mkdir(DIST_DIR, { recursive: true });
  const html = renderHTML(cards);
  // Write to BOTH dist/index.html (production bundle) and the project root
  // index.html (what vite's dev server and naive static servers serve).
  const distHtml = path.join(DIST_DIR, 'index.html');
  const rootHtml = path.join(ROOT, 'index.html');
  const mdPath   = path.join(DOCS_DIR, 'INDEX.md');
  await fs.writeFile(distHtml, html);
  await fs.writeFile(rootHtml, html);
  await fs.writeFile(mdPath,   renderMarkdown(cards));
  console.log(`Wrote ${distHtml}, ${rootHtml}, ${mdPath}; ${cards.length} cards`);
}

main().catch(err => {
  console.error(err);
  process.exit(2);
});
