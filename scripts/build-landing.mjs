import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
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
  const m = text.match(/^-{3}\n([\s\S]*?)\n-{3}/);
  if (!m) return out;
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const k = line.slice(0, idx).trim();
    let v = line.slice(idx + 1).trim();
    if (v.startsWith('[') && v.endsWith(']')) v = v.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    out[k] = v;
  }
  return out;
}

function curOf(cy) {
  const s = (cy || '').toLowerCase();
  let m = s.match(/^bsc-y(\d)s(\d)/);
  if (m) return { level: 'BSc', badge: 'BSc · Y' + m[1], order: 100 + (+m[1]) * 10 + (+m[2]), group: 'BSc Year ' + m[1] + ', Semester ' + m[2] };
  m = s.match(/^bsc-y(\d)/);
  if (m) return { level: 'BSc', badge: 'BSc · Y' + m[1], order: 100 + (+m[1]) * 10, group: 'BSc Year ' + m[1] };
  m = s.match(/^msc-y(\d)/);
  if (m) return { level: 'MSc', badge: 'MSc · Y' + m[1], order: 300 + (+m[1]) * 10, group: 'MSc Year ' + m[1] };
  // Legacy Licenciatura tag, e.g. "L:F-3Y-1S" = BSc Physics Year 3
  // Semester 1. Many specs still carry this form; without it they all
  // collapsed into one wrong "Advanced" bucket and the order broke.
  m = s.match(/^l:f-(\d)y-(\d)s/);
  if (m) return { level: 'BSc', badge: 'BSc · Y' + m[1], order: 100 + (+m[1]) * 10 + (+m[2]), group: 'BSc Year ' + m[1] + ', Semester ' + m[2] };
  m = s.match(/^l:f-(\d)y/);
  if (m) return { level: 'BSc', badge: 'BSc · Y' + m[1], order: 100 + (+m[1]) * 10, group: 'BSc Year ' + m[1] };
  if (s === 'hero') return { level: 'BSc', badge: 'Featured', order: 90, group: 'Featured' };
  return { level: 'ADV', badge: 'Advanced', order: 900, group: 'Advanced / Cross-curricular' };
}

// Outward links. Per the standing directive this site ships zero
// github references (the code is private, destined for a paid
// domain), so these are neutral placeholders to be pointed at the
// real domain later. No github.com / github.io strings anywhere.
const RESEARCH_URL = '#';
const LINKEDIN_URL = '#';
const CONTACT_EMAIL = 'andreaswneitzel@astro.up.pt';
const BETA_TESTERS = [
  // { name: "...", institution: "..." }
];
let PKG_VERSION = '0.1.0';
try { PKG_VERSION = JSON.parse(readFileSync('package.json', 'utf8')).version || PKG_VERSION; } catch { /* keep default */ }
const BUILD_DATE = new Date().toISOString().slice(0, 10);
const BUILD_YEAR = new Date().getFullYear();

const cards = [];
for (const path of walk('playgrounds')) {
  const text = readFileSync(path, 'utf8');
  const fm = parseFM(text);
  if (fm.status !== 'verified') continue;
  const dir = dirname(path);
  const slug = basename(dir);
  const tags = Array.isArray(fm.tags) ? fm.tags : [];
  const cur = curOf(fm.curriculum_year || '');
  cards.push({
    slug, path: relative('.', dir),
    title: (fm.title || slug).replace(/['"]/g, ''),
    primary_uc: fm.primary_uc || '', curriculum_year: fm.curriculum_year || '',
    tags, level: cur.level, badge: cur.badge, order: cur.order, group: cur.group,
    hero_candidate: fm.hero_candidate === 'true',
    tier: fm.tier || '',
    hook: (fm.hook || '').replace(/^['"]|['"]$/g, ''),
    one_paragraph: (fm.one_paragraph || '').replace(/^['"]|['"]$/g, ''),
  });
}
cards.sort((a, b) => a.title.localeCompare(b.title));

const TAGS = ['mechanics', 'quantum', 'electromagnetism', 'optics', 'statistical-physics', 'fluids-mhd', 'solid-state', 'cosmology', 'relativity', 'stellar', 'medical-physics', 'numerics'];
const heroPool = cards.filter(c => c.tier === 'hero');

// Map an arbitrary first-tag to one of the 12 canonical categories
// (specs carry a free tags[] list, not a primary_tag field).
function canonTag(raw) {
  const t = (raw || '').toLowerCase();
  const has = (s) => t.indexOf(s) >= 0;
  if (has('quantum') || has('atomic') || has('nuclear') || has('particle')) return 'quantum';
  if (has('electromag') || t === 'em' || has('charge') || has('circuit')) return 'electromagnetism';
  if (has('optic') || has('wave-optics') || has('photon') || has('interfer') || has('diffrac')) return 'optics';
  if (has('fluid') || has('mhd') || has('plasma') || has('aero')) return 'fluids-mhd';
  if (has('statistical') || has('thermo') || has('entropy') || has('stat-mech')) return has('thermo') ? 'thermodynamics' : 'statistical-physics';
  if (has('solid') || has('condensed') || has('crystal') || has('band')) return 'solid-state';
  if (has('cosmolog') || has('bbn') || has('inflation') || has('universe')) return 'cosmology';
  if (has('relativ') || has('black-hole') || has('gravitational-wave') || has('lensing')) return 'relativity';
  if (has('stellar') || has('astro') || has('orbit') || has('kepler') || has('seismo')) return 'stellar';
  if (has('medical') || has('imaging') || has('tomograph')) return 'medical-physics';
  if (has('numeric') || has('algorithm') || has('comput') || has('ml') || has('optimi')) return 'numerics';
  if (has('mechan') || has('dynamic') || has('pendulum') || has('rigid') || has('oscill')) return 'mechanics';
  return 'numerics';
}
const TAG_COLORVAR = {
  mechanics: 'mechanics', quantum: 'quantum', electromagnetism: 'electromagnetism',
  optics: 'optics', 'statistical-physics': 'statistical', thermodynamics: 'statistical',
  'fluids-mhd': 'fluids', 'solid-state': 'solid-state', cosmology: 'cosmology',
  stellar: 'stellar', relativity: 'relativity', 'medical-physics': 'medical', numerics: 'numerics',
};
const TAG_THUMB = {
  mechanics: 'thumb-mechanics.jpg', quantum: 'thumb-quantum.jpg',
  electromagnetism: 'thumb-electromagnetism.jpg', optics: 'thumb-optics.jpg',
  'fluids-mhd': 'thumb-fluids.jpg', 'statistical-physics': 'thumb-statistical-physics.jpg',
  thermodynamics: 'thumb-thermodynamics.jpg', 'solid-state': 'thumb-condensed-matter.jpg',
  cosmology: 'thumb-cosmology.jpg', stellar: 'thumb-stellar.jpg',
  relativity: 'thumb-relativity.jpg', 'medical-physics': 'thumb-medical-physics.jpg',
  numerics: 'thumb-numerics.jpg',
};
const shortBadge = (b) => (b === 'Advanced' || b === 'Featured') ? 'Adv' : b;
for (const c of cards) {
  c.ptag = canonTag(c.tags[0]);
  c.tagcolor = `var(--tag-${TAG_COLORVAR[c.ptag] || 'numerics'})`;
  // Per-playground card override: assets/thumbs/card-<slug>.jpg takes
  // precedence over the category banner. Generated by build-card-thumbs.mjs
  // from images/playground_cards/* via the CARD_OVERRIDE table.
  const override = `card-${c.slug}.jpg`;
  if (existsSync(join('assets', 'thumbs', override))) {
    c.thumb = override;
  } else {
    const tf = TAG_THUMB[c.ptag] || '';
    c.thumb = (tf && existsSync(join('assets', 'thumbs', tf))) ? tf : '';
  }
}

function cardHTML(c, featured = false) {
  const thumb = c.thumb ? `assets/thumbs/${c.thumb}` : '';
  const star = c.tier === 'hero' ? '<span class="cstar" aria-label="hero-tier">&#9733;</span>' : '';
  return `
  <a class="card${featured ? ' card-f' : ''}" data-title="${c.title.toLowerCase()}" data-uc="${(c.primary_uc || '').toLowerCase()}" data-year="${c.curriculum_year}" data-tags="${c.tags.join(' ')}" data-order="${c.order}" data-group="${c.group}" style="--tagc:${c.tagcolor}" href="${c.path}/index.html">
    <div class="cimg"${thumb ? ` data-thumb="${thumb}"` : ''}><div class="cph"></div>${star}<span class="lvl">${shortBadge(c.badge)}</span></div>
    <div class="cbody">
      <h3 class="ctitle">${c.title}</h3>
      <span class="cuc">${c.primary_uc}</span>
      <div class="ctags">${c.tags.slice(0, 4).map(t => `<span class="ctag">${t}</span>`).join('')}</div>
    </div>
  </a>`;
}

// Horizontal spotlight card: thumbnail on the left, title / UC /
// description excerpt / tags on the right, gold star, accent left
// edge. One per day, the first of the daily rotation.
function spotlightCardHTML(c) {
  const thumb = c.thumb ? `assets/thumbs/${c.thumb}` : '';
  const desc = (c.one_paragraph || c.hook || '').slice(0, 240);
  const bg = thumb
    ? `background-image:linear-gradient(135deg,rgba(7,9,15,0) 0%,rgba(7,9,15,0) 60%,rgba(7,9,15,0.4) 100%),url('${thumb}')`
    : '';
  return `
  <article class="spotlight-card" style="--tagc:${c.tagcolor}">
    <a class="spotlight-link" href="${c.path}/index.html" data-title="${c.title.toLowerCase()}" data-uc="${(c.primary_uc || '').toLowerCase()}" data-tags="${c.tags.join(' ')}">
      <div class="spotlight-image" style="${bg}"><span class="star-marker">&#9733;</span></div>
      <div class="spotlight-body">
        <h3 class="spotlight-title t-title">${c.title}</h3>
        <p class="spotlight-uc t-mono">${c.primary_uc || ''}</p>
        <p class="spotlight-desc t-body">${desc}</p>
        <div class="spotlight-tags">${c.tags.slice(0, 4).map(t => `<span class="ctag">${t}</span>`).join('')}</div>
      </div>
    </a>
  </article>`;
}

const cardsHTML = cards.map(c => cardHTML(c)).join('');
const chipRail = TAGS.map(t => `<button class="chip" data-tag="${t}">${t}</button>`).join('');

// Daily-rotated spotlight. An FNV-1a hash of (build date, slug) orders
// the hero-tier pool deterministically, so the spotlight card and the
// three featured cards are stable for a given day and rotate the next.
function fnv1a(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const rotated = heroPool
  .map(c => ({ c, k: fnv1a(`${BUILD_DATE}|${c.slug}`) }))
  .sort((a, b) => a.k - b.k)
  .map(o => o.c);
const spotlight = rotated[0] || null;
const featured4 = rotated.slice(1, 5);
const spotlightHTML = spotlight
  ? `${spotlightCardHTML(spotlight)}<div class="featured-row">${featured4.map(c => cardHTML(c)).join('')}</div>`
  : '<p class="t-small" style="color:var(--text-dimmed)">Featured coming soon.</p>';

// Hero stats line. Each number is computed from the catalogue; a stat
// that cannot be computed (count 0) is dropped together with its
// divider rather than shown as "0" or "N/A".
const nHeroTier = cards.filter(c => c.tier === 'hero').length;
const nCategories = new Set(cards.map(c => c.ptag).filter(Boolean)).size;
const nYears = new Set(cards.map(c => c.badge).filter(b => /Y\d/.test(b))).size;
const heroStats = [
  [cards.length, 'simulations'],
  [nHeroTier, 'hero-tier'],
  [nCategories, 'categories'],
  [nYears, 'curricular years'],
].filter(([n]) => n > 0);
const heroStatsHTML = heroStats.map(([n, label], i) => {
  const divider = i > 0 ? '<span class="hero-stat-divider">&middot;</span>' : '';
  const numAttr = i === 0 ? ` id="statn" data-target="${n}"` : '';
  return `${divider}<span class="hero-stat"><span class="hero-stat-num"${numAttr}>${n}</span>`
    + `<span class="hero-stat-label">${label}</span></span>`;
}).join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Playgrounds Portfolio. Andreas W. Neitzel</title>
<meta property="og:title" content="Playgrounds Portfolio">
<meta property="og:description" content="${cards.length} interactive physics, astronomy, and machine-learning playgrounds.">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root{
  /* Backgrounds */
  --bg-void:#07090f; --bg-surface:#0c0f1a; --bg-card:#0f1220;
  --bg-card-hover:#141728; --bg-frosted:rgba(12,15,26,0.85);
  /* Borders */
  --border-dim:rgba(255,255,255,0.06); --border-subtle:rgba(255,255,255,0.10);
  --border-active:rgba(255,255,255,0.18);
  /* Text */
  --text-primary:#e8eaf0; --text-secondary:#8892a4; --text-dimmed:#3d4758;
  --text-code:#6b7fa3;
  /* Accents */
  --accent:#4f7ef7; --accent-dim:rgba(79,126,247,0.12);
  --accent-gold:#c9a84c; --accent-gold-dim:rgba(201,168,76,0.12);
  /* Semantic tag colors (left micro-border only) */
  --tag-mechanics:#f59e0b; --tag-quantum:#22d3ee; --tag-electromagnetism:#a78bfa;
  --tag-optics:#34d399; --tag-statistical:#fb923c; --tag-fluids:#2dd4bf;
  --tag-solid-state:#818cf8; --tag-cosmology:#7c3aed; --tag-stellar:#fbbf24;
  --tag-relativity:#f472b6; --tag-medical:#fb7185; --tag-numerics:#94a3b8;
  /* Transitions */
  --t-fast:120ms ease; --t-normal:200ms ease; --t-slow:350ms cubic-bezier(0.4,0,0.2,1);
  /* Typography families */
  --f-ui:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;
  --f-mono:'IBM Plex Mono',ui-monospace,monospace;
  /* Back-compat aliases (removed as components migrate to the spec tokens) */
  --bg-primary:var(--bg-void); --accent-blue:var(--accent);
}
*{box-sizing:border-box}
html{background:var(--bg-void);scrollbar-width:thin;scrollbar-color:var(--border-subtle) transparent}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border-subtle);border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:var(--border-active)}
body{max-width:1280px;margin:0 auto;padding:0 24px 0;background:transparent;color:var(--text-primary);
  font-family:var(--f-ui);font-size:15px;font-weight:400;position:relative;z-index:0;line-height:1.6}
html{scroll-behavior:smooth;scroll-padding-top:72px}
.landing-hero{padding:104px 0 32px;max-width:880px}
.landing-hero h1{margin:0}
.hero-subtitle{color:var(--text-secondary);max-width:640px;margin:16px 0 0;line-height:1.6}
.hero-stats{color:var(--text-secondary);font-family:var(--f-mono);margin-top:16px;display:flex;gap:12px;align-items:baseline;flex-wrap:wrap}
.hero-stat-num{color:var(--text-primary);font-weight:500;font-variant-numeric:tabular-nums}
.hero-stat-label{color:var(--text-secondary);margin-left:4px}
.hero-stat-divider{color:var(--text-dimmed)}
/* Section rhythm: the hero and the featured row are the "this is the
   site" zone; a thin rule marks the transition into the browsable
   catalog. */
.landing-featured{padding:32px 0 48px}
.landing-catalog{padding:16px 0 64px}
.landing-catalog::before{content:'';display:block;height:1px;background:var(--border-dim);margin-bottom:48px}
/* Catalog section: search, order, filters scoped here so it is clear
   they control the grid below and not the curated featured row. */
.catalog-header{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:20px}
.catalog-count{color:var(--text-secondary)}
.catalog-count strong{color:var(--text-primary);font-weight:600;font-variant-numeric:tabular-nums}
.catalog-controls{margin-bottom:24px}
.catalog-empty{padding:80px 24px;text-align:center;border:1px dashed var(--border-dim);border-radius:8px}
.catalog-empty p{margin:0 0 6px}
.catalog-empty-reset{margin-top:24px;background:transparent;border:1px solid var(--border-subtle);
  color:var(--text-secondary);padding:8px 20px;border-radius:6px;cursor:pointer;font-family:var(--f-ui)}
.catalog-empty-reset:hover{border-color:var(--border-active);color:var(--text-primary)}
.catalog-search-row{display:flex;gap:12px;align-items:center;margin-bottom:12px;flex-wrap:wrap}
.catalog-filter-chips{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.search-clear{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:18px;height:18px;
  display:flex;align-items:center;justify-content:center;background:transparent;border:none;cursor:pointer;
  color:var(--text-secondary);font-size:16px;line-height:1;border-radius:50%}
.search-clear:hover{color:var(--text-primary)}
/* Navigation bar (site-structure spec). Fixed, frosted, persistent. */
.nav{position:fixed;top:0;left:0;right:0;height:56px;z-index:200;background:var(--bg-frosted);
  -webkit-backdrop-filter:blur(16px) saturate(1.4);backdrop-filter:blur(16px) saturate(1.4);
  border-bottom:1px solid var(--border-dim);transition:border-color 300ms ease}
.nav.depth{border-bottom-color:var(--border-subtle)}
.nav-in{max-width:1280px;height:56px;margin:0 auto;padding:0 24px;display:flex;align-items:center;
  justify-content:space-between;gap:24px}
.nav-mono{font-family:var(--f-mono);font-weight:500;font-size:14px;letter-spacing:0.08em;
  color:var(--text-primary);padding:6px 10px;border:1px solid var(--border-subtle);border-radius:4px;
  text-decoration:none;transition:border-color var(--t-fast)}
.nav-mono:hover{border-color:var(--border-active)}
.nav-links{display:flex;gap:32px}
.nav-links a{position:relative;padding:19px 0;font-size:13px;font-weight:500;letter-spacing:0.01em;
  color:var(--text-secondary);text-decoration:none;transition:color var(--t-fast)}
.nav-links a:hover,.nav-links a.active{color:var(--text-primary)}
.nav-links a::after{content:'';position:absolute;left:0;bottom:0;height:2px;width:100%;
  background:var(--accent);transform:scaleX(0);transform-origin:center;transition:transform 250ms ease}
.nav-links a.active::after{transform:scaleX(1)}
.nav-icons{display:flex;gap:20px;align-items:center}
.nav-icons a{color:var(--text-dimmed);display:flex;transition:color var(--t-fast)}
.nav-icons a:hover{color:var(--text-secondary)}
.nav-icons svg{width:18px;height:18px}
.nav-burger{display:none;background:none;border:none;color:var(--text-secondary);font-size:20px;cursor:pointer;padding:4px 8px}
.nav-mobile{display:none;position:fixed;top:56px;left:0;right:0;z-index:199;background:var(--bg-surface);
  border-bottom:1px solid var(--border-dim);padding:20px 24px;flex-direction:column;gap:20px}
.nav-mobile.open{display:flex}
.nav-mobile a{color:var(--text-secondary);text-decoration:none;font-size:15px;font-weight:500}
@media(max-width:768px){.nav-links{display:none}.nav-burger{display:block}}
/* Type scale (spec Section 2, do not deviate) */
.t-display{font-size:clamp(2rem,5vw,3.2rem);font-weight:700;letter-spacing:-0.03em;line-height:1.1}
.t-title{font-size:1.5rem;font-weight:600;letter-spacing:-0.02em}
.t-heading{font-size:1.125rem;font-weight:600;letter-spacing:-0.01em}
.t-body{font-size:0.9375rem;font-weight:400}
.t-small{font-size:0.8125rem;font-weight:400}
.t-label{font-size:0.6875rem;font-weight:500;letter-spacing:0.12em;text-transform:uppercase}
.t-mono{font-family:var(--f-mono);font-size:0.8125rem}
#ambient{position:fixed;inset:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;display:block}
.sec{font-size:0.6875rem;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-secondary);margin:48px 0 16px}
.uc{font-family:var(--f-mono);font-weight:400;font-size:0.8125rem;color:var(--text-secondary)}
/* Featured: one horizontal daily-rotated spotlight card above a row
   of four standard cards. */
.featured-header{display:flex;align-items:baseline;justify-content:space-between;gap:16px}
.featured-meta{color:var(--text-secondary);font-family:var(--f-mono)}
.spotlight-card{background:var(--bg-card);border:1px solid var(--border-dim);border-left:4px solid var(--accent);
  border-radius:8px;overflow:hidden;margin-bottom:16px;
  transition:background var(--t-normal),border-color var(--t-normal),transform var(--t-normal),box-shadow var(--t-normal)}
.spotlight-card:hover{background:var(--bg-card-hover);border-color:var(--border-subtle);
  transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.4)}
.spotlight-link{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);min-height:280px;text-decoration:none}
.spotlight-image{position:relative;background-size:cover;background-position:center;background-color:var(--bg-card-hover)}
.spotlight-image .star-marker{position:absolute;top:16px;left:16px;color:var(--accent-gold);
  background:rgba(7,9,15,0.6);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);
  width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px}
.spotlight-body{padding:32px 28px;display:flex;flex-direction:column;gap:8px;justify-content:center}
.spotlight-title{color:var(--text-primary);line-height:1.25;margin:0}
.spotlight-uc{color:var(--text-secondary);margin:0}
.spotlight-desc{color:var(--text-secondary);line-height:1.6;margin-top:12px;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.spotlight-tags{margin-top:16px;display:flex;flex-wrap:wrap;gap:6px}
.featured-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
@media(max-width:1280px){.featured-row{grid-template-columns:repeat(3,minmax(0,1fr))}.featured-row>:nth-child(4){display:none}}
@media(max-width:900px){.featured-row{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:768px){.spotlight-link{grid-template-columns:1fr;grid-template-rows:180px auto}}
@media(max-width:600px){.featured-row{grid-template-columns:1fr}}
.search{position:relative;flex:1;max-width:640px;min-width:240px}
.search svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--text-secondary);pointer-events:none}
.search input{width:100%;padding:10px 34px 10px 40px;background:var(--bg-surface);border:1px solid var(--border-dim);
  color:var(--text-primary);border-radius:6px;font-size:0.9375rem;font-family:var(--f-ui);outline:none;transition:border-color var(--t-fast)}
.search input::placeholder{color:var(--text-secondary)}
.search input:focus{border-color:var(--border-active)}
.sortsel{padding:9px 12px;background:var(--bg-surface);border:1px solid var(--border-dim);
  color:var(--text-secondary);border-radius:6px;font-family:var(--f-ui);font-size:0.8125rem;outline:none;transition:border-color var(--t-fast)}
.sortsel:focus{border-color:var(--border-active)}
.chip{padding:4px 12px;background:transparent;border:1px solid var(--border-dim);color:var(--text-secondary);
  border-radius:20px;font-size:0.8125rem;font-family:var(--f-ui);cursor:pointer;transition:all var(--t-fast)}
.chip:hover{border-color:var(--border-subtle)}
.chip.active{background:var(--accent-dim);border-color:var(--accent);color:var(--text-primary)}
.clearall{display:none;background:transparent;border:none;color:var(--text-secondary);
  font-size:0.8125rem;font-family:var(--f-ui);cursor:pointer;padding:4px 6px}
.clearall:hover{text-decoration:underline}
.clearall.show{display:inline-block}
.curriculum-toggle{background:transparent;border:1px solid var(--border-subtle);color:var(--text-secondary);
  padding:6px 12px;border-radius:4px;cursor:pointer;font-family:var(--f-ui);transition:border-color var(--t-fast),color var(--t-fast)}
.curriculum-toggle:hover{border-color:var(--border-active);color:var(--text-primary)}
.curriculum-toggle[aria-pressed="true"]{background:var(--accent-dim);border-color:var(--accent);color:var(--text-primary)}
.card-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:8px}
@media(max-width:900px){.card-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.card-grid{grid-template-columns:1fr}}
.card-grid.curr{display:block}
.card{position:relative;display:flex;flex-direction:column;min-height:200px;background:var(--bg-card);
  border:1px solid var(--border-dim);border-radius:8px;color:var(--text-primary);text-decoration:none;
  overflow:hidden;transition:background 150ms ease,border-color 150ms ease,transform 150ms ease,box-shadow 150ms ease}
.card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--tagc);border-radius:3px 0 0 3px;z-index:2}
.card:hover{background:var(--bg-card-hover);border-color:var(--border-subtle);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.4)}
.cimg{position:relative;height:120px;background:var(--bg-card) center/cover no-repeat;overflow:hidden;transition:transform 300ms ease}
.card:hover .cimg{transform:scale(1.04)}
/* D1 staggered entry, D2 filter transition, D4 featured entrance */
.card.preanim{opacity:0;transform:translateY(12px)}
.card.inview{opacity:1;transform:translateY(0);transition:opacity 400ms ease-out,transform 400ms ease-out}
.card.fhide{opacity:0!important;transform:scale(0.97)!important;transition:opacity 200ms ease,transform 200ms ease}
.cimg::after{content:'';position:absolute;inset:0;background:linear-gradient(to bottom,rgba(7,9,15,0.2) 0%,rgba(7,9,15,0.6) 70%,rgba(7,9,15,0.95) 100%)}
.cph{position:absolute;left:30%;top:36%;width:40%;height:28%;background:#fff;opacity:0.07}
.lvl{position:absolute;top:8px;right:8px;z-index:3;font-family:var(--f-mono);font-size:10px;font-weight:500;
  background:rgba(7,9,15,0.7);color:var(--text-secondary);padding:3px 7px;border-radius:4px}
.cstar{position:absolute;top:10px;left:10px;z-index:3;color:var(--accent-gold);font-size:14px;line-height:1;
  background:rgba(7,9,15,0.6);padding:4px;border-radius:50%;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
.cbody{padding:14px 16px 16px;display:flex;flex-direction:column}
.ctitle{font-size:1.125rem;font-weight:600;letter-spacing:-0.01em;margin:0;color:var(--text-primary);
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cuc{margin:4px 0 10px;font-family:var(--f-mono);font-size:0.8125rem;color:var(--text-secondary)}
.ctags{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;max-height:24px;overflow:hidden}
.ctag{font-size:0.8125rem;padding:2px 8px;background:rgba(255,255,255,0.05);color:var(--text-secondary);border-radius:4px}
.cur-group{width:100%;margin:28px 0 10px;display:flex;align-items:center;gap:12px;cursor:pointer}
.cur-group h3{font-size:0.6875rem;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-secondary);margin:0;white-space:nowrap}
.cur-group .ln{flex:1;height:1px;background:var(--border-dim)}
.cur-group .cnt{font-family:var(--f-mono);font-size:11px;color:var(--text-dimmed)}
.cur-group .chev{color:var(--text-dimmed);font-size:0.8125rem;width:12px;transition:transform var(--t-fast)}
.cur-group.collapsed .chev{transform:rotate(-90deg)}
.cur-wrap{overflow:hidden;transition:max-height .3s ease;display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:12px}
@media(max-width:600px){.sitefoot{flex-direction:column;height:auto;gap:6px;padding:20px 0;text-align:center}}
/* Page transitions (Section 9): fades only, no slide/zoom. The star
   field canvas is parented to <html> so it never fades. */
.page-transition{position:fixed;inset:0;background:var(--bg-void);opacity:0;
  pointer-events:none;z-index:9000;transition:opacity 200ms ease}
.page-transition.show{opacity:1}
.card.sel{transform:scale(1.03);opacity:0;transition:transform 200ms ease,opacity 200ms ease;z-index:5}
.card.justback{border-color:var(--border-active)!important;transition:border-color 200ms ease}
.pgprog{position:fixed;top:0;left:0;height:1px;width:0;background:var(--accent);
  z-index:9999;opacity:0;transition:width 600ms linear,opacity 200ms ease}
.pgprog.run{opacity:1}
.scrollprog{position:fixed;top:0;left:0;width:100%;height:2px;background:var(--border-subtle);
  z-index:150;opacity:0;transition:opacity 250ms ease;pointer-events:none}
.scrollprog.on{opacity:1}
.scrollprog .sp-fill{height:100%;width:0;background:var(--accent)}
.ambtoggle{position:fixed;right:16px;bottom:14px;z-index:150;width:24px;height:24px;
  display:flex;align-items:center;justify-content:center;background:transparent;border:none;
  color:var(--text-dimmed);font-size:16px;cursor:pointer;line-height:1;font-family:var(--f-ui)}
.ambtoggle:hover{color:var(--text-secondary)}
.ambtoggle .dot{position:absolute;top:2px;right:2px;width:4px;height:4px;border-radius:50%;
  background:var(--accent);display:none}
.ambtoggle.on .dot{display:block}
.cur-group:not(.seen) .ln{transform:scaleX(0)}
.cur-group:not(.seen) h3{opacity:0}
.cur-group .ln{transform-origin:left;transition:transform 600ms ease-out}
.cur-group h3{transition:opacity 600ms ease-out}
.content-fade{opacity:1;transition:opacity 200ms ease}
.content-fade.out{opacity:0}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}
  .page-transition{opacity:1!important;display:none}}
/* About + Credits + footer (site-structure spec) */
/* Explicit guard: every section/wrapper stays transparent so the
   fixed star-field canvas (z-index:-1 on <html>) shows through at
   all scroll positions. Only <html>, the nav, cards, the back
   button and the footer carry a background. */
section,.card-grid,.about-grid,.credits-grid{background:transparent}
.about{padding:96px 0 80px}
.about .lab,.credits .lab{font-size:0.6875rem;font-weight:500;letter-spacing:0.12em;
  text-transform:uppercase;color:var(--text-secondary);margin:0 0 48px}
.about-grid{display:flex;gap:56px;align-items:flex-start}
.about-l{width:240px;flex:none}
.about-photo{width:200px;height:200px;border-radius:6px;border:1px solid var(--border-subtle);
  background:rgba(255,255,255,0.07) center/cover no-repeat}
.about-contact{display:flex;flex-direction:column;gap:10px;margin-top:20px}
.about-contact a{display:flex;align-items:center;gap:8px;font-family:var(--f-mono);font-size:0.8125rem;
  color:var(--text-secondary);text-decoration:none}
.about-contact a:hover{color:var(--text-primary)}
.about-contact svg{width:13px;height:13px;color:var(--text-dimmed);flex:none}
.about-r{flex:1;min-width:0}
.about-name{font-size:1.75rem;font-weight:700;letter-spacing:-0.02em;color:var(--text-primary);margin:0}
.about-title{font-size:0.9375rem;color:var(--text-secondary);margin:6px 0 0}
.about-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.about-chips span{background:var(--accent-dim);border:1px solid rgba(79,126,247,0.2);color:var(--accent);
  font-size:0.8125rem;padding:3px 10px;border-radius:4px}
.about-bio{margin-top:24px;max-width:600px;color:var(--text-secondary);font-size:0.9375rem;line-height:1.7}
.about-bio p{margin:0 0 14px}
.about-cols{display:flex;gap:36px;flex-wrap:wrap;margin-top:36px}
.about-col h4{font-size:0.6875rem;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;
  color:var(--text-dimmed);margin:0 0 8px}
.about-col ul{list-style:none;margin:0;padding:0}
.about-col li{font-size:0.8125rem;color:var(--text-secondary);line-height:2}
.about-stack{margin-top:32px}
.about-stack .lab{margin:0 0 12px}
.about-stack .tags{display:flex;flex-wrap:wrap;gap:8px}
.about-stack .tags span{font-family:var(--f-mono);font-size:11px;color:var(--text-secondary);
  background:rgba(255,255,255,0.04);border:1px solid var(--border-subtle);padding:3px 9px;border-radius:4px}
.credits{padding:80px 0;border-top:1px solid var(--border-dim)}
.credits-grid{display:flex;gap:80px;flex-wrap:wrap}
.credits-col{flex:1;min-width:280px}
.credits-col h3{font-size:1.125rem;font-weight:600;letter-spacing:-0.01em;color:var(--text-primary);margin:0 0 20px}
.credits-col .sub{font-size:0.8125rem;color:var(--text-secondary);margin:6px 0 24px}
.crow{display:flex;border-bottom:1px solid var(--border-dim);padding:12px 0}
.crow .ck{width:200px;flex:none;font-family:var(--f-mono);font-size:0.8125rem;color:var(--text-secondary)}
.crow .cv{font-size:0.8125rem;color:var(--text-primary)}
.credits-note{margin-top:20px;max-width:440px;font-size:0.8125rem;color:var(--text-secondary);font-style:italic}
.credits-empty{font-size:0.8125rem;color:var(--text-secondary);font-style:italic}
.credits-ver{margin-top:32px;padding-top:32px;border-top:1px solid var(--border-dim);
  font-family:var(--f-mono);font-size:0.8125rem;color:var(--text-secondary)}
.sitefoot{height:64px;background:var(--bg-void);border-top:1px solid var(--border-dim);
  display:flex;align-items:center;justify-content:space-between;
  font-family:var(--f-mono);font-size:0.8125rem;color:var(--text-dimmed);margin-top:40px}
/* Hidden only once the entrance JS has armed the section (group 6),
   so the no-JS / pre-JS page shows About fully. */
.about.prep .about-anim{opacity:0;transform:translateY(8px)}
.about.prep .about-anim.in{opacity:1;transform:translateY(0);transition:opacity 400ms ease-out,transform 400ms ease-out}
.about.prep .about-photo{opacity:0;transform:scale(0.95)}
.about.prep .about-photo.in{opacity:1;transform:scale(1);transition:opacity 500ms ease-out,transform 500ms ease-out}
@media(max-width:760px){.about-grid{flex-direction:column}.about-l{width:100%;display:flex;
  flex-direction:column;align-items:center}.credits-grid{flex-direction:column;gap:40px}}
</style>
</head>
<body>
<nav class="nav" id="nav">
  <div class="nav-in">
    <a class="nav-mono" href="index.html" aria-label="Home">AN</a>
    <div class="nav-links">
      <a href="#browse">Simulations</a>
      <a href="#about">About</a>
      <a href="#credits">Credits</a>
      <a href="${RESEARCH_URL}"${RESEARCH_URL.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>Research</a>
    </div>
    <div class="nav-icons">
      <a href="${LINKEDIN_URL}"${LINKEDIN_URL.startsWith('http') ? ' target="_blank" rel="noopener"' : ''} aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0V8zm7.5 0H12v2.2h.07c.63-1.2 2.17-2.47 4.46-2.47C21.4 7.73 24 10.1 24 14.8V24h-5v-8.2c0-1.96-.04-4.48-2.73-4.48-2.73 0-3.15 2.13-3.15 4.33V24h-5V8z"/></svg></a>
    </div>
    <button class="nav-burger" id="nav-burger" type="button" aria-label="Menu" aria-expanded="false">&#9776;</button>
  </div>
</nav>
<div class="nav-mobile" id="nav-mobile">
  <a href="#browse">Simulations</a>
  <a href="#about">About</a>
  <a href="#credits">Credits</a>
  <a href="${RESEARCH_URL}"${RESEARCH_URL.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>Research</a>
</div>
<div class="page-transition show" id="ptrans" aria-hidden="true"></div>
<div class="pgprog" id="pgprog" aria-hidden="true"></div>
<div class="scrollprog" id="scrollprog" aria-hidden="true"><div class="sp-fill" id="sp-fill"></div></div>
<script type="module">
  import { mountStarField } from './shared/js/starfield.js';
  import { getAudioSystem } from './shared/js/audio.js';
  import { mountCursor } from './shared/js/cursor.js';
  mountStarField();
  window.__audio = getAudioSystem();
  mountCursor();
</script>

<section class="landing-hero">
  <h1 class="t-display">Playgrounds Portfolio</h1>
  <p class="hero-subtitle t-body">Interactive simulations across physics, astronomy, statistical mechanics, and machine learning, aligned to the University of Porto BSc in Physics and MSc in Astronomy and Astrophysics curriculum.</p>
  <div class="hero-stats t-small">${heroStatsHTML}</div>
</section>

<section class="landing-featured">
  <header class="featured-header">
    <h2 class="sec">Featured today</h2>
    <span class="t-small featured-meta">Rotates daily &middot; ${heroPool.length} hero-tier playgrounds in the catalog</span>
  </header>
  ${spotlightHTML}
</section>

<section id="browse" class="landing-catalog">
  <header class="catalog-header">
    <h2 class="sec">Catalog</h2>
    <span class="catalog-count t-small" id="browse-count">Showing <strong>${cards.length}</strong> simulations</span>
  </header>
  <div class="catalog-controls">
    <div class="catalog-search-row">
      <div class="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><line x1="16.5" y1="16.5" x2="21" y2="21"></line></svg>
        <input id="search-input" type="text" placeholder="Search the catalog..." aria-label="Search the catalog">
        <button class="search-clear" id="search-clear" type="button" aria-label="Clear search" hidden>&times;</button>
      </div>
      <select class="sortsel" id="sortsel" aria-label="Order">
        <option value="az">A &rarr; Z</option>
        <option value="za">Z &rarr; A</option>
      </select>
      <button class="curriculum-toggle t-small" id="cur-toggle" type="button" aria-pressed="false">Group by curriculum</button>
    </div>
    <div class="catalog-filter-chips" id="tags-rail">${chipRail}<button class="clearall" id="clearall">Clear</button></div>
  </div>
  <div class="card-grid" id="card-grid">${cardsHTML}</div>
  <div class="catalog-empty" id="catalog-empty" hidden>
    <p class="t-body" style="color:var(--text-secondary)">No simulations match your search.</p>
    <p class="t-small" style="color:var(--text-dimmed)">Try removing a filter or clearing the search.</p>
    <button class="catalog-empty-reset t-small" id="catalog-empty-reset" type="button">Clear all</button>
  </div>
</section>

<section class="about" id="about">
  <div class="lab">About</div>
  <div class="about-grid">
    <div class="about-l">
      <div class="about-photo"${existsSync(join('assets', 'profile.jpg')) ? ' style="background-image:url(assets/profile.jpg)"' : ''}></div>
      <div class="about-contact">
        <a href="mailto:${CONTACT_EMAIL}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 7l9 6 9-6"></path></svg>${CONTACT_EMAIL}</a>
        <a href="${LINKEDIN_URL}"${LINKEDIN_URL.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0V8zm7.5 0H12v2.2h.07c.63-1.2 2.17-2.47 4.46-2.47C21.4 7.73 24 10.1 24 14.8V24h-5v-8.2c0-1.96-.04-4.48-2.73-4.48-2.73 0-3.15 2.13-3.15 4.33V24h-5V8z"/></svg>LinkedIn</a>
      </div>
    </div>
    <div class="about-r">
      <h2 class="about-name about-anim">Andreas W. Neitzel</h2>
      <p class="about-title about-anim">PhD Candidate in Astrophysics &middot; University of Porto</p>
      <div class="about-chips about-anim">
        <span>IA / CAUP</span><span>FCT Doctoral Fellow</span><span>ESA Ariel Consortium</span><span>ArqueoGal Co-I</span>
      </div>
      <div class="about-bio about-anim">
        <p>I am a fourth-year PhD candidate at the Instituto de Astrof&iacute;sica e Ci&ecirc;ncias do Espa&ccedil;o (IA/CAUP) and the University of Porto, working at the intersection of asteroseismology, Galactic archaeology, and machine learning. My research uses stellar oscillations to reconstruct the formation history of the Milky Way.</p>
        <p>This website is a personal project in science communication: ${cards.length}+ physics simulations spanning the undergraduate and graduate physics curriculum, built from scratch as a public educational resource.</p>
      </div>
      <div class="about-cols">
        <div class="about-col about-anim"><h4>Physics</h4><ul><li>Asteroseismology</li><li>Galactic Archaeology</li><li>Statistical Mechanics</li><li>General Relativity</li><li>Quantum Mechanics</li><li>Stellar Structure</li></ul></div>
        <div class="about-col about-anim"><h4>Engineering</h4><ul><li>Canvas2D / SVG Rendering</li><li>Custom Physics Engines</li><li>Symplectic Integrators</li><li>Lattice Boltzmann (LBM)</li><li>Crank-Nicolson PDE Solver</li><li>Web Audio API</li><li>Python / NumPy / PyTorch</li><li>Node.js Build Pipelines</li></ul></div>
        <div class="about-col about-anim"><h4>Design</h4><ul><li>Systems Design</li><li>Data Visualization</li><li>Scientific Communication</li><li>UI / UX Architecture</li><li>Typography Systems</li><li>Motion Design</li></ul></div>
      </div>
      <div class="about-stack about-anim">
        <div class="lab">Built with</div>
        <div class="tags"><span>Vanilla JavaScript</span><span>Canvas2D</span><span>SVG</span><span>Web Audio API</span><span>KaTeX</span><span>HTML5 / CSS3</span><span>Node.js</span><span>No Frameworks</span></div>
      </div>
    </div>
  </div>
</section>

<section class="credits" id="credits">
  <div class="lab">Credits</div>
  <div class="credits-grid">
    <div class="credits-col">
      <h3>Authorship</h3>
      ${[
        ['Physics Simulations', 'Andreas W. Neitzel'],
        ['Physics Engines', 'Andreas W. Neitzel'],
        ['Numerical Methods', 'Andreas W. Neitzel'],
        ['Canvas2D / SVG Rendering', 'Andreas W. Neitzel'],
        ['Visual Design', 'Andreas W. Neitzel'],
        ['Website Architecture', 'Andreas W. Neitzel'],
        ['Curriculum Mapping', 'Andreas W. Neitzel'],
      ].map(([k, v]) => `<div class="crow"><div class="ck">${k}</div><div class="cv">${v}</div></div>`).join('')}
      <p class="credits-note">Assisted with Claude Code (Anthropic).</p>
    </div>
    <div class="credits-col">
      <h3>Special Thanks</h3>
      <p class="sub">Beta testers who helped refine these simulations</p>
      ${BETA_TESTERS.length
        ? BETA_TESTERS.map((t) => `<div class="crow"><div class="cv">${t.name}${t.institution ? ` &middot; <span style="color:var(--text-dimmed)">${t.institution}</span>` : ''}</div></div>`).join('')
        : '<p class="credits-empty">Beta testers will be listed here.</p>'}
    </div>
  </div>
  <div class="credits-ver">v${PKG_VERSION} &middot; Built ${BUILD_DATE} &middot; ${cards.length} simulations</div>
</section>

<button class="ambtoggle" id="ambtoggle" type="button" aria-label="Toggle ambient sound">&#9834;<span class="dot"></span></button>
<footer class="sitefoot"><span>&copy; ${BUILD_YEAR} Andreas W. Neitzel</span><span>Physics &middot; Astrophysics &middot; University of Porto</span></footer>

<script>
(function(){
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var input=document.getElementById('search-input');
  var grid=document.getElementById('card-grid');
  var sortsel=document.getElementById('sortsel');
  var clearBtn=document.getElementById('clearall');
  var searchClear=document.getElementById('search-clear');
  var emptyEl=document.getElementById('catalog-empty');
  var countEl=document.getElementById('browse-count');
  var curToggle=document.getElementById('cur-toggle');
  var chips=[].slice.call(document.querySelectorAll('.chip'));
  var cards=[].slice.call(grid.querySelectorAll('.card'));
  var active={};
  var curMode=false;
  // D1: hide cards before first paint (JS-only) so the staggered
  // entry has no visible -> hidden flash. No-JS users see them.
  if(!reduce && 'IntersectionObserver' in window){ cards.forEach(function(c){ c.classList.add('preanim'); }); }

  // All sound goes through the shared AudioSystem (shared/js/audio.js,
  // loaded as a module above and exposed as window.__audio). It owns
  // the mobile / reduced-motion / no-Web-Audio guards and the 30ms
  // chaos guard, so these are thin call-throughs.
  function aud(){ return window.__audio || null; }
  function ping(){ var a=aud(); if(a)a.hoverCard(); }

  function visible(c){
    var q=input.value.toLowerCase();
    var t=c.dataset.title,uc=c.dataset.uc,y=(c.dataset.year||'').toLowerCase();
    var tags=(c.dataset.tags||'').split(' ');
    var mq=!q||t.indexOf(q)>=0||uc.indexOf(q)>=0||y.indexOf(q)>=0||tags.join(' ').indexOf(q)>=0;
    var keys=Object.keys(active);
    var mt=keys.length===0||keys.every(function(k){return tags.indexOf(k)>=0;});
    return mq&&mt;
  }
  function clearGroups(){ [].slice.call(grid.querySelectorAll('.cur-group,.cur-wrap')).forEach(function(e){e.remove();}); }
  function render(){
    clearGroups();
    var vis=cards.filter(visible);
    cards.forEach(function(c){c.style.display='none';});
    if(curMode){
      grid.classList.add('curr');
      var groups={};
      vis.forEach(function(c){ var key=(+c.dataset.order)+'|'+c.dataset.group; (groups[key]=groups[key]||[]).push(c); });
      Object.keys(groups).sort(function(a,b){return (+a.split('|')[0])-(+b.split('|')[0]);}).forEach(function(key){
        var label=key.split('|')[1], list=groups[key];
        var hd=document.createElement('div'); hd.className='cur-group';
        hd.innerHTML='<span class="chev">\\u25be</span><h3>'+label+'</h3><span class="ln"></span><span class="cnt">'+list.length+'</span>';
        var wrap=document.createElement('div'); wrap.className='cur-wrap';
        list.forEach(function(c){ c.style.display=''; wrap.appendChild(c); });
        grid.appendChild(hd); grid.appendChild(wrap);
        wrap.style.maxHeight=wrap.scrollHeight+'px';
        hd.addEventListener('click',function(){
          var col=hd.classList.toggle('collapsed');
          wrap.style.maxHeight=col?'0px':wrap.scrollHeight+'px';
        });
      });
    } else {
      grid.classList.remove('curr');
      var arr=vis.slice();
      arr.sort(function(a,b){return a.dataset.title.localeCompare(b.dataset.title);});
      if(sortsel.value==='za')arr.reverse();
      arr.forEach(function(c){ c.style.display=''; grid.appendChild(c); });
    }
    var activeTags=Object.keys(active);
    var filtered=activeTags.length>0||input.value.trim()!=='';
    var byline=activeTags.length>0?(', filtered by '+activeTags.join(' &middot; ')):'';
    countEl.innerHTML=filtered
      ?('Showing <strong>'+vis.length+'</strong> of <strong>'+cards.length+'</strong>'+byline)
      :('Showing <strong>'+cards.length+'</strong> simulations');
    clearBtn.classList.toggle('show',activeTags.length>0);
    if(searchClear)searchClear.hidden=input.value.length===0;
    if(emptyEl){ var none=vis.length===0; emptyEl.hidden=!none; grid.hidden=none; }
    wireGroups();
  }
  function resetAll(){
    input.value=''; active={};
    chips.forEach(function(c){c.classList.remove('active');});
    if(searchClear)searchClear.hidden=true;
    render();
  }
  // E2: curriculum section headers animate in (rule extends 0->100%,
  // text fades) once per session, on scroll into view.
  var seenG;
  try{ seenG=new Set(JSON.parse(sessionStorage.getItem('pg:seenG')||'[]')); }catch(e){ seenG=new Set(); }
  var cgObs=('IntersectionObserver' in window)&&!reduce?new IntersectionObserver(function(es){
    es.forEach(function(en){ if(!en.isIntersecting)return; var g=en.target; cgObs.unobserve(g);
      g.classList.add('seen'); var lab=g.getAttribute('data-lab'); if(lab){ seenG.add(lab);
        try{ sessionStorage.setItem('pg:seenG',JSON.stringify([].slice.call(seenG))); }catch(e){} } });
  },{threshold:0.5}):null;
  function wireGroups(){
    [].slice.call(grid.querySelectorAll('.cur-group')).forEach(function(g){
      var lab=g.querySelector('h3')?g.querySelector('h3').textContent:''; g.setAttribute('data-lab',lab);
      if(reduce||!cgObs||seenG.has(lab)){ g.classList.add('seen'); }
      else { cgObs.observe(g); }
    });
  }
  input.addEventListener('input',render);
  if(searchClear)searchClear.addEventListener('click',function(){
    input.value=''; searchClear.hidden=true; input.focus(); render();
  });
  sortsel.addEventListener('change',render);
  curToggle.addEventListener('click',function(){
    curMode=!curMode;
    curToggle.setAttribute('aria-pressed',String(curMode));
    var a=aud(); if(a){ curMode?a.filterActivate():a.filterDeactivate(); }
    render();
  });
  chips.forEach(function(ch){
    ch.addEventListener('mouseenter',ping);
    ch.addEventListener('click',function(){
      var on=!ch.classList.contains('active');
      ch.classList.toggle('active');
      if(active[ch.dataset.tag])delete active[ch.dataset.tag]; else active[ch.dataset.tag]=1;
      var a=aud(); if(a){ on?a.filterActivate():a.filterDeactivate(); }
      render();
    });
  });
  clearBtn.addEventListener('click',function(){ active={}; chips.forEach(function(c){c.classList.remove('active');}); render(); });
  var emptyReset=document.getElementById('catalog-empty-reset');
  if(emptyReset)emptyReset.addEventListener('click',resetAll);
  var ptrans=document.getElementById('ptrans');
  var pgprog=document.getElementById('pgprog');
  // Fade the overlay out on arrival (landing fades in). Reduced motion
  // hides the overlay via CSS, so this is a no-op there.
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ if(ptrans)ptrans.classList.remove('show'); }); });
  // B2: a just-returned card briefly brightens its border.
  try{
    var lastSel=sessionStorage.getItem('pg:lastSel');
    if(lastSel){ sessionStorage.removeItem('pg:lastSel');
      var jb=cards.filter(function(c){return c.getAttribute('href')===lastSel;})[0];
      if(jb&&!reduce){ setTimeout(function(){ jb.classList.add('justback');
        setTimeout(function(){ jb.classList.remove('justback'); },800); },400); }
    }
  }catch(e){}
  cards.forEach(function(c){
    c.addEventListener('mouseenter',ping);
    c.addEventListener('click',function(e){
      var href=c.getAttribute('href');
      if(reduce)return;                               // instant nav, no transition
      e.preventDefault();
      var a=aud(); if(a)a.selectPlayground();          // B1 select woosh
      if(window.__starfield)window.__starfield.accelerate('in');
      c.classList.add('sel');                          // clicked card scales 1.03 + fades
      if(ptrans)ptrans.classList.add('show');          // rest fades to void
      try{ sessionStorage.setItem('pg:lastSel',href); }catch(er){}
      if(pgprog){ pgprog.classList.add('run');
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ pgprog.style.width='100%'; }); }); }
      setTimeout(function(){ location.href=href; },650);   // min 600ms progress
    });
  });
  render();

  // D1: staggered card entry. Cards start hidden (.preanim, JS-only so
  // no-JS still shows them) and fade+rise in when scrolled into view,
  // staggered by index*35ms (cap 400ms). D2: on filter change shown
  // cards re-fade via .inview; hide stays instant to avoid reflow jank.
  if(!reduce && 'IntersectionObserver' in window){
    var seen=new WeakSet(), b=0, lastT=0;
    var eio=new IntersectionObserver(function(ents){
      var now=performance.now(); if(now-lastT>120)b=0; lastT=now;
      ents.forEach(function(en){
        if(!en.isIntersecting)return;
        var c=en.target; if(seen.has(c))return; seen.add(c); eio.unobserve(c);
        var d=Math.min(400,(b++)*35);
        setTimeout(function(){ c.classList.remove('preanim'); c.classList.add('inview'); },d);
      });
    },{threshold:0.1});
    cards.forEach(function(c){ eio.observe(c); });
  } else { cards.forEach(function(c){ c.classList.add('inview'); }); }

  // D5: stat counter 0 -> N over 1200ms ease-out, integer only.
  var stn=document.getElementById('statn');
  if(stn && !reduce){
    var target=parseInt(stn.getAttribute('data-target'),10)||0, t0=0;
    var step=function(ts){ if(!t0)t0=ts; var k=Math.min(1,(ts-t0)/1200);
      var e=1-Math.pow(1-k,3);
      stn.textContent=String(Math.round(target*e));
      if(k<1)requestAnimationFrame(step); };
    stn.textContent='0'; requestAnimationFrame(step);
  }

  // E1: top scroll-progress bar. Fades in past 100px, out at the top.
  var sprog=document.getElementById('scrollprog'), spf=document.getElementById('sp-fill');
  if(sprog&&spf){
    var onScroll=function(){
      var y=window.scrollY||window.pageYOffset||0;
      var h=document.documentElement.scrollHeight-window.innerHeight;
      spf.style.width=(h>0?Math.min(100,Math.max(0,y/h*100)):0)+'%';
      sprog.classList.toggle('on',y>100);
    };
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',onScroll); onScroll();
  }

  // Nav: brighten the border past 80px; mobile burger dropdown.
  var navEl=document.getElementById('nav');
  if(navEl){
    var navScroll=function(){ navEl.classList.toggle('depth',(window.scrollY||0)>80); };
    window.addEventListener('scroll',navScroll,{passive:true}); navScroll();
  }
  var burger=document.getElementById('nav-burger'), navMob=document.getElementById('nav-mobile');
  if(burger&&navMob){
    burger.addEventListener('click',function(){
      var open=navMob.classList.toggle('open');
      burger.setAttribute('aria-expanded',String(open));
    });
    [].slice.call(navMob.querySelectorAll('a')).forEach(function(a){
      a.addEventListener('click',function(){ navMob.classList.remove('open'); burger.setAttribute('aria-expanded','false'); });
    });
  }

  // Section 5: active nav link follows the section in view. The root
  // is shrunk to a thin band near the top of the viewport so a very
  // tall section (the 333-card catalog) is detected just like a short
  // one; intersectionRatio thresholds cannot do this.
  if('IntersectionObserver' in window){
    var navLinkFor={};
    [].slice.call(document.querySelectorAll('.nav-links a')).forEach(function(a){
      var h=a.getAttribute('href'); if(h&&h.charAt(0)==='#')navLinkFor[h.slice(1)]=a;
    });
    var secIds=['browse','about','credits'];
    var navObs=new IntersectionObserver(function(es){
      es.forEach(function(en){
        if(!en.isIntersecting)return;
        var link=navLinkFor[en.target.id]; if(!link)return;
        Object.keys(navLinkFor).forEach(function(k){ navLinkFor[k].classList.remove('active'); });
        link.classList.add('active');
      });
    },{rootMargin:'-45% 0px -50% 0px',threshold:0});
    secIds.forEach(function(id){ var s=document.getElementById(id); if(s)navObs.observe(s); });
  }

  // Section 6: About enters once. Hidden state armed only now (the
  // .about.prep gate) so the no-JS page already shows it.
  var aboutSec=document.getElementById('about');
  if(aboutSec && !reduce && 'IntersectionObserver' in window){
    aboutSec.classList.add('prep');
    var aPhoto=aboutSec.querySelector('.about-photo');
    var aAnims=[].slice.call(aboutSec.querySelectorAll('.about-anim'));
    var aDone=false;
    var aObs=new IntersectionObserver(function(es){
      es.forEach(function(en){
        if(aDone||en.intersectionRatio<0.15)return; aDone=true; aObs.disconnect();
        if(aPhoto)setTimeout(function(){ aPhoto.classList.add('in'); },0);
        aAnims.forEach(function(el,i){ setTimeout(function(){ el.classList.add('in'); },100+i*80); });
      });
    },{threshold:0.15});
    aObs.observe(aboutSec);
  }

  // G: ambient-sound toggle, off by default, state in sessionStorage.
  var ambBtn=document.getElementById('ambtoggle');
  if(ambBtn){
    var savedOn=false; try{ savedOn=sessionStorage.getItem('pg:amb')==='1'; }catch(e){}
    ambBtn.classList.toggle('on',savedOn);
    ambBtn.addEventListener('click',function(){
      var a=aud(); if(!a){ return; }
      var on=a.toggleAmbient();
      ambBtn.classList.toggle('on',on);
      try{ sessionStorage.setItem('pg:amb',on?'1':'0'); }catch(e){}
    });
  }

  // Lazy-load category thumbnails (Section 5). Until the files exist
  // in assets/thumbs/ every card keeps the white-box placeholder; a
  // 404 falls back silently to it.
  var imgZones=[].slice.call(document.querySelectorAll('.cimg[data-thumb]'));
  if('IntersectionObserver' in window && imgZones.length){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting)return;
        var z=en.target; io.unobserve(z);
        var src=z.getAttribute('data-thumb'); if(!src)return;
        var im=new Image();
        im.onload=function(){ z.style.backgroundImage='url("'+src+'")'; var ph=z.querySelector('.cph'); if(ph)ph.style.display='none'; };
        im.onerror=function(){};
        im.src=src;
      });
    },{rootMargin:'200px'});
    imgZones.forEach(function(z){ io.observe(z); });
  }
})();
</script>
</body></html>`;

try { mkdirSync('dist', { recursive: true }); } catch {}
writeFileSync('dist/index.html', html);
writeFileSync('index.html', html);

// Runtime catalogue for the in-playground "Related" strip (Section 14).
// The playground chrome fetches this; it is capture-suppressed there,
// so it never affects the deterministic golden frames.
const catalogue = cards.map(c => ({
  slug: c.slug, title: c.title, uc: c.primary_uc || '',
  tag: c.ptag, tagc: c.tagcolor, path: c.path, badge: shortBadge(c.badge),
  // Include the resolved card-thumb path so the Related strip can
  // render proper thumbnails instead of empty placeholders.
  thumb: c.thumb || '',
}));
mkdirSync('shared', { recursive: true });
writeFileSync('shared/playgrounds-catalogue.json', JSON.stringify(catalogue));
console.log(`Wrote dist/index.html, index.html, shared/playgrounds-catalogue.json (${cards.length} cards, ${heroPool.length} hero-tier).`);
