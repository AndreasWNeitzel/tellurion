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
html{background:var(--bg-primary);scrollbar-width:thin;scrollbar-color:#2d4263 #0b0e16}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:#0b0e16}
::-webkit-scrollbar-thumb{background:#2d4263;border-radius:999px}
body{max-width:1240px;margin:0 auto;padding:30px;background:transparent;color:var(--text-primary);
  font-family:var(--f-ui);font-size:15px;font-weight:400;position:relative;z-index:0;line-height:1.6}
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
.header p{color:var(--text-secondary);max-width:560px;font-size:0.9375rem}
h2.sec{font-family:var(--f-ui);font-weight:500;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:var(--text-dimmed);margin:30px 0 14px}
.uc{font-family:var(--f-mono);font-weight:400;font-size:11px;color:var(--text-secondary)}
.heroes{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin:14px 0 6px}
.controls{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:10px 0}
.search{flex:1;min-width:220px}
.search input{width:100%;padding:10px 13px;background:var(--bg-card);border:1px solid var(--border-subtle);
  color:var(--text-primary);border-radius:6px;font-size:14px;font-family:var(--f-ui);outline:none;
  transition:border-color .15s ease}
.search input::placeholder{color:var(--text-secondary)}
.search input:focus{border-color:var(--border-active)}
.sortsel{padding:9px 11px;background:var(--bg-card);border:1px solid var(--border-subtle);
  color:var(--text-secondary);border-radius:6px;font-family:var(--f-mono);font-size:12px}
.tags-rail{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}
.chip{padding:5px 10px;background:#1e2a3a;border:none;color:var(--text-secondary);border-radius:4px;
  font-size:11px;font-family:var(--f-mono);cursor:pointer;transition:background .15s ease,color .15s ease}
.chip:hover{color:var(--text-primary)}
.chip.active{background:var(--accent-blue);color:#fff}
.clearall{display:none;padding:5px 10px;background:transparent;border:1px solid var(--border-subtle);
  color:var(--text-secondary);border-radius:4px;font-size:11px;font-family:var(--f-mono);cursor:pointer}
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
.cimg{position:relative;height:120px;background:var(--bg-card) center/cover no-repeat;overflow:hidden}
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
.cur-group{width:100%;margin:18px 0 8px;display:flex;align-items:center;gap:12px;cursor:pointer}
.cur-group h3{font-family:var(--f-ui);font-weight:500;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:var(--text-dimmed);margin:0;white-space:nowrap}
.cur-group .ln{flex:1;height:1px;background:var(--border-subtle)}
.cur-group .cnt{font-family:var(--f-mono);font-size:11px;color:var(--text-dimmed)}
.cur-group .chev{color:var(--text-secondary);transition:transform .15s}
.cur-group.collapsed .chev{transform:rotate(-90deg)}
.cur-wrap{overflow:hidden;transition:max-height .3s ease;display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:12px}
footer{padding:32px 0 8px;color:var(--text-dimmed);font-size:12px;font-family:var(--f-mono)}
footer a{color:var(--text-secondary);text-decoration:none}
body{opacity:1;transition:opacity .3s ease}
body.leaving{opacity:0}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>
</head>
<body>
<script type="module">
  import { mountStarField } from './shared/js/starfield.js';
  mountStarField();
</script>

<div class="header">
  <h1 class="site-title">Playgrounds Portfolio</h1>
  <p>${cards.length} interactive simulations across physics, astronomy, statistical mechanics, and machine learning, aligned to the University of Porto BSc in Physics and MSc in Astronomy and Astrophysics curriculum.</p>
</div>

<section>
  <h2 class="sec">Featured</h2>
  <div class="heroes">${heroHTML}</div>
</section>

<section>
  <h2 class="sec">Browse</h2>
  <div class="controls">
    <div class="search"><input id="search-input" type="text" placeholder="Search by title, code, year, or subject" aria-label="Search playgrounds"></div>
    <select class="sortsel" id="sortsel" aria-label="Order">
      <option value="az">Order: A to Z</option>
      <option value="curriculum">Order: curriculum (BSc to MSc)</option>
    </select>
  </div>
  <div class="tags-rail" id="tags-rail">${chipRail}<button class="clearall" id="clearall">clear</button></div>
  <div class="card-grid" id="card-grid">${cardsHTML}</div>
</section>

<footer>Andreas W. Neitzel &middot; ORCID 0000-0001-6283-907X &middot; IA/CAUP, University of Porto</footer>

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

  var actx=null;
  function initA(){ if(actx||reduce)return; try{actx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){actx=null;} }
  window.addEventListener('pointerdown',initA);
  window.addEventListener('keydown',initA);
  window.addEventListener('mousemove',initA,{once:true});
  function ping(){
    if(reduce)return;
    if(!actx){ initA(); if(!actx)return; }
    try{
      if(actx.state==='suspended'||actx.state==='interrupted'){ actx.resume(); }
      var n=actx.currentTime;
      var o=actx.createOscillator(),g=actx.createGain();
      o.type='triangle';
      o.frequency.setValueAtTime(1050,n);
      o.frequency.exponentialRampToValueAtTime(680,n+0.045);
      g.gain.setValueAtTime(0.0001,n);
      g.gain.exponentialRampToValueAtTime(0.017,n+0.003);
      g.gain.exponentialRampToValueAtTime(0.0001,n+0.05);
      o.connect(g); g.connect(actx.destination);
      o.start(n); o.stop(n+0.055);
      o.onended=function(){ try{o.disconnect();g.disconnect();}catch(e){} };
    }catch(e){}
  }

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
      arr.forEach(function(c){ c.style.display=''; grid.appendChild(c); });
    }
    clearBtn.classList.toggle('show',Object.keys(active).length>0);
  }
  input.addEventListener('input',render);
  sortsel.addEventListener('change',render);
  chips.forEach(function(ch){
    ch.addEventListener('mouseenter',ping);
    ch.addEventListener('click',function(){
      ch.classList.toggle('active');
      if(active[ch.dataset.tag])delete active[ch.dataset.tag]; else active[ch.dataset.tag]=1;
      render();
    });
  });
  clearBtn.addEventListener('click',function(){ active={}; chips.forEach(function(c){c.classList.remove('active');}); render(); });
  cards.forEach(function(c){
    c.addEventListener('mouseenter',ping);
    c.addEventListener('click',function(e){
      if(reduce)return;
      e.preventDefault(); var href=c.getAttribute('href');
      document.body.classList.add('leaving');
      setTimeout(function(){ location.href=href; },300);
    });
  });
  render();

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
console.log(`Wrote dist/index.html and index.html (${cards.length} cards, ${heroes.length} heroes).`);
