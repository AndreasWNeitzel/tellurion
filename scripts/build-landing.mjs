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
  });
}
cards.sort((a, b) => a.title.localeCompare(b.title));

const TAGS = ['mechanics', 'quantum', 'electromagnetism', 'optics', 'statistical-physics', 'fluids-mhd', 'solid-state', 'cosmology', 'relativity', 'stellar', 'medical-physics', 'numerics'];
const heroes = cards.filter(c => c.hero_candidate).slice(0, 4);

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
  const tf = TAG_THUMB[c.ptag] || '';
  // Only reference a thumbnail that actually exists, so cards stay on
  // the clean placeholder (no 404 console noise) until the files land.
  c.thumb = (tf && existsSync(join('assets', 'thumbs', tf))) ? tf : '';
}

function cardHTML(c, featured = false) {
  const thumb = c.thumb ? `assets/thumbs/${c.thumb}` : '';
  const star = featured ? '<span class="cstar">&#9733;</span>' : '';
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

const cardsHTML = cards.map(c => cardHTML(c)).join('');
const heroHTML = heroes.length ? heroes.map(h => cardHTML(h, true)).join('') : '<p class="t-small" style="color:var(--text-dimmed)">Featured coming soon.</p>';
const chipRail = TAGS.map(t => `<button class="chip" data-tag="${t}">${t}</button>`).join('');

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
.header{padding-top:118px}
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
.nav-links a{font-size:13px;font-weight:500;letter-spacing:0.01em;color:var(--text-secondary);
  text-decoration:none;transition:color var(--t-fast)}
.nav-links a:hover,.nav-links a.active{color:var(--text-primary)}
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
.site-title{font-size:clamp(2rem,5vw,3.2rem);font-weight:700;letter-spacing:-0.03em;line-height:1.1;margin:0 0 16px;color:var(--text-primary)}
.header p{color:var(--text-secondary);max-width:560px;font-size:0.9375rem;margin:0}
.sec{font-size:0.6875rem;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-dimmed);margin:48px 0 16px}
.uc{font-family:var(--f-mono);font-weight:400;font-size:0.8125rem;color:var(--text-code)}
/* Featured: 4-up horizontal scroll row, no wrapping (Section 7) */
.heroes{display:flex;gap:12px;overflow-x:auto;overflow-y:hidden;padding-bottom:6px;scroll-snap-type:x proximity}
.heroes .card-f{flex:0 0 calc((100% - 36px)/4);min-width:240px;min-height:220px;scroll-snap-align:start}
.heroes .card-f .cimg{height:140px}
@media(max-width:900px){.heroes .card-f{flex:0 0 70%}}
.controls{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:10px 0 14px}
.search{position:relative;flex:1;max-width:640px;min-width:240px}
.search svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--text-dimmed);pointer-events:none}
.search input{width:100%;padding:10px 14px 10px 40px;background:var(--bg-surface);border:1px solid var(--border-dim);
  color:var(--text-primary);border-radius:6px;font-size:0.9375rem;font-family:var(--f-ui);outline:none;transition:border-color var(--t-fast)}
.search input::placeholder{color:var(--text-dimmed)}
.search input:focus{border-color:var(--border-active)}
.sortsel{padding:9px 12px;background:var(--bg-surface);border:1px solid var(--border-dim);
  color:var(--text-secondary);border-radius:6px;font-family:var(--f-ui);font-size:0.8125rem;outline:none;transition:border-color var(--t-fast)}
.sortsel:focus{border-color:var(--border-active)}
.tags-rail{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px;align-items:center}
.chip{padding:4px 12px;background:transparent;border:1px solid var(--border-dim);color:var(--text-secondary);
  border-radius:20px;font-size:0.8125rem;font-family:var(--f-ui);cursor:pointer;transition:all var(--t-fast)}
.chip:hover{border-color:var(--border-subtle)}
.chip.active{background:var(--accent-dim);border-color:var(--accent);color:var(--text-primary)}
.clearall{display:none;background:transparent;border:none;color:var(--text-dimmed);
  font-size:0.8125rem;font-family:var(--f-ui);cursor:pointer;padding:4px 6px}
.clearall:hover{text-decoration:underline}
.clearall.show{display:inline-block}
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
.heroes .card-f.fpre{opacity:0;transform:translateX(-10px)}
.heroes .card-f.fin{opacity:1;transform:translateX(0);transition:opacity 500ms ease-out,transform 500ms ease-out}
.cimg::after{content:'';position:absolute;inset:0;background:linear-gradient(to bottom,rgba(7,9,15,0.2) 0%,rgba(7,9,15,0.6) 70%,rgba(7,9,15,0.95) 100%)}
.cph{position:absolute;left:30%;top:36%;width:40%;height:28%;background:#fff;opacity:0.07}
.lvl{position:absolute;top:8px;right:8px;z-index:3;font-family:var(--f-mono);font-size:10px;font-weight:500;
  background:rgba(7,9,15,0.7);color:var(--text-secondary);padding:3px 7px;border-radius:4px}
.cstar{position:absolute;top:10px;left:10px;z-index:3;color:var(--accent-gold);font-size:12px}
.cbody{padding:14px 16px 16px;display:flex;flex-direction:column}
.ctitle{font-size:1.125rem;font-weight:600;letter-spacing:-0.01em;margin:0;color:var(--text-primary);
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cuc{margin-top:4px;font-family:var(--f-mono);font-size:0.8125rem;color:var(--text-code)}
.ctags{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;max-height:24px;overflow:hidden}
.ctag{font-size:0.8125rem;padding:2px 8px;background:rgba(255,255,255,0.05);color:var(--text-secondary);border-radius:4px}
.cur-group{width:100%;margin:28px 0 10px;display:flex;align-items:center;gap:12px;cursor:pointer}
.cur-group h3{font-size:0.6875rem;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-dimmed);margin:0;white-space:nowrap}
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
.about{padding:100px 0 80px}
.about .lab,.credits .lab{font-size:0.6875rem;font-weight:500;letter-spacing:0.12em;
  text-transform:uppercase;color:var(--text-dimmed);margin:0 0 48px}
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
.about-stack .tags span{font-family:var(--f-mono);font-size:11px;color:var(--text-dimmed);
  background:rgba(255,255,255,0.04);border:1px solid var(--border-dim);padding:3px 9px;border-radius:4px}
.credits{padding:80px 0;border-top:1px solid var(--border-dim)}
.credits-grid{display:flex;gap:80px;flex-wrap:wrap}
.credits-col{flex:1;min-width:280px}
.credits-col h3{font-size:1.125rem;font-weight:600;letter-spacing:-0.01em;color:var(--text-primary);margin:0 0 20px}
.credits-col .sub{font-size:0.8125rem;color:var(--text-secondary);margin:6px 0 24px}
.crow{display:flex;border-bottom:1px solid var(--border-dim);padding:12px 0}
.crow .ck{width:200px;flex:none;font-family:var(--f-mono);font-size:0.8125rem;color:var(--text-dimmed)}
.crow .cv{font-size:0.8125rem;color:var(--text-secondary)}
.credits-note{margin-top:20px;max-width:440px;font-size:0.8125rem;color:var(--text-dimmed);font-style:italic}
.credits-empty{font-size:0.8125rem;color:var(--text-dimmed);font-style:italic}
.credits-ver{margin-top:32px;padding-top:32px;border-top:1px solid var(--border-dim);
  font-family:var(--f-mono);font-size:0.8125rem;color:var(--text-dimmed)}
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

<div class="header">
  <h1 class="site-title">Playgrounds Portfolio</h1>
  <p><span id="statn" data-target="${cards.length}">${cards.length}</span> interactive simulations across physics, astronomy, statistical mechanics, and machine learning, aligned to the University of Porto BSc in Physics and MSc in Astronomy and Astrophysics curriculum.</p>
</div>

<section>
  <h2 class="sec">Featured</h2>
  <div class="heroes">${heroHTML}</div>
</section>

<section id="browse">
  <h2 class="sec">Browse</h2>
  <div class="controls">
    <div class="search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><line x1="16.5" y1="16.5" x2="21" y2="21"></line></svg>
      <input id="search-input" type="text" placeholder="Search simulations..." aria-label="Search simulations">
    </div>
    <select class="sortsel" id="sortsel" aria-label="Order">
      <option value="az">A &rarr; Z</option>
      <option value="za">Z &rarr; A</option>
      <option value="curriculum">Curriculum order</option>
    </select>
  </div>
  <div class="tags-rail" id="tags-rail">${chipRail}<button class="clearall" id="clearall">Clear</button></div>
  <div class="card-grid" id="card-grid">${cardsHTML}</div>
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
  var chips=[].slice.call(document.querySelectorAll('.chip'));
  var cards=[].slice.call(grid.querySelectorAll('.card'));
  var active={};
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
    var mode=sortsel.value, vis=cards.filter(visible);
    cards.forEach(function(c){c.style.display='none';});
    if(mode==='curriculum'){
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
      if(mode==='za')arr.reverse();
      arr.forEach(function(c){ c.style.display=''; grid.appendChild(c); });
    }
    clearBtn.classList.toggle('show',Object.keys(active).length>0);
    wireGroups();
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
  sortsel.addEventListener('change',render);
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

  // D4: featured row enters once per session, left to right.
  try{
    var fseen=sessionStorage.getItem('pg:fseen');
    var fcards=[].slice.call(document.querySelectorAll('.heroes .card-f'));
    if(!reduce && !fseen && fcards.length){
      fcards.forEach(function(f,i){ f.classList.add('fpre');
        setTimeout(function(){ f.classList.add('fin'); f.classList.remove('fpre'); },120*i); });
      sessionStorage.setItem('pg:fseen','1');
    }
  }catch(e){}

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
}));
mkdirSync('shared', { recursive: true });
writeFileSync('shared/playgrounds-catalogue.json', JSON.stringify(catalogue));
console.log(`Wrote dist/index.html, index.html, shared/playgrounds-catalogue.json (${cards.length} cards, ${heroes.length} heroes).`);
