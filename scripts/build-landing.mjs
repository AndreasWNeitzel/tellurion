import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
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

// Subject accent colours (user spec).
const SUBJECTS = [
  ['mechanics', '#f5a742'], ['quantum', '#3fd0e0'], ['electromagnetism', '#9a6cff'],
  ['optics', '#34d399'], ['cosmology', '#7c4dff'], ['statistical-physics', '#ff8c42'],
  ['fluids-mhd', '#2dd4bf'], ['medical-physics', '#fb7185'], ['solid-state', '#6366f1'],
];
function subjectOf(tags, uc) {
  const ts = tags.map(t => t.toLowerCase());
  for (const [k, c] of SUBJECTS) if (ts.includes(k)) return [k, c];
  const has = (s) => ts.some(t => t.includes(s));
  if (has('medical') || /(-MP|MFM)/.test(uc)) return ['medical-physics', '#fb7185'];
  if (has('thermo') || has('statistical')) return ['statistical-physics', '#ff8c42'];
  if (has('fluid') || has('mhd')) return ['fluids-mhd', '#2dd4bf'];
  if (has('optic') || has('wave')) return ['optics', '#34d399'];
  if (has('quantum') || has('atomic') || has('nuclear')) return ['quantum', '#3fd0e0'];
  if (has('electro') || has('magnet')) return ['electromagnetism', '#9a6cff'];
  if (has('relativ') || has('cosmo') || has('stellar') || has('galactic') || has('exoplanet')) return ['cosmology', '#7c4dff'];
  if (has('mechanic')) return ['mechanics', '#f5a742'];
  return ['physics', '#4f9cf9'];
}
function curOf(cy) {
  const s = (cy || '').toLowerCase();
  let m = s.match(/^bsc-y(\d)s(\d)/);
  if (m) return { level: 'BSc', badge: 'BSc Y' + m[1], order: 100 + (+m[1]) * 10 + (+m[2]), group: 'BSc Year ' + m[1] + ', Semester ' + m[2] };
  m = s.match(/^bsc-y(\d)/);
  if (m) return { level: 'BSc', badge: 'BSc Y' + m[1], order: 100 + (+m[1]) * 10, group: 'BSc Year ' + m[1] };
  m = s.match(/^msc-y(\d)/);
  if (m) return { level: 'MSc', badge: 'MSc Y' + m[1], order: 300 + (+m[1]) * 10, group: 'MSc Year ' + m[1] };
  return { level: 'ADV', badge: 'Adv', order: 900, group: 'Advanced / Cross-curricular' };
}

const cards = [];
for (const path of walk('playgrounds')) {
  const text = readFileSync(path, 'utf8');
  const fm = parseFM(text);
  if (fm.status !== 'verified') continue;
  const dir = dirname(path);
  const slug = basename(dir);
  const tags = Array.isArray(fm.tags) ? fm.tags : [];
  const uc = fm.primary_uc || '';
  const [subj, accent] = subjectOf(tags, uc);
  const cur = curOf(fm.curriculum_year || '');
  cards.push({
    slug, path: relative('.', dir),
    title: (fm.title || slug).replace(/['"]/g, ''),
    primary_uc: uc, curriculum_year: fm.curriculum_year || '',
    tags, subj, accent, level: cur.level, badge: cur.badge, order: cur.order, group: cur.group,
    hero_candidate: fm.hero_candidate === 'true',
  });
}
cards.sort((a, b) => a.title.localeCompare(b.title));

const TAGS = ['mechanics', 'quantum', 'electromagnetism', 'optics', 'statistical-physics', 'fluids-mhd', 'solid-state', 'cosmology', 'relativity', 'stellar', 'medical-physics', 'numerics'];
const heroes = cards.filter(c => c.hero_candidate).slice(0, 4);

const cardsHTML = cards.map(c => `
  <a class="card" data-title="${c.title.toLowerCase()}" data-uc="${(c.primary_uc || '').toLowerCase()}" data-year="${c.curriculum_year}" data-subj="${c.subj}" data-tags="${c.tags.join(' ')}" data-order="${c.order}" data-group="${c.group}" data-level="${c.level}" style="--accent:${c.accent}" href="${c.path}/index.html">
    <span class="ybadge ${c.level === 'MSc' ? 'msc' : 'bsc'}">${c.badge}</span>
    <h3>${c.title}</h3>
    <div class="meta"><span class="uc">${c.primary_uc}</span> ${c.subj}</div>
    <div class="tags">${c.tags.slice(0, 4).map(t => `<span class="tag">${t}</span>`).join('')}</div>
  </a>`).join('');

const heroHTML = heroes.length ? heroes.map(h => `
  <a class="hero-card" style="--accent:${h.accent}" href="${h.path}/index.html">
    <div class="hero-badge">Featured</div>
    <h2>${h.title}</h2>
    <div class="hero-meta">${h.primary_uc} · ${h.badge}</div>
  </a>`).join('') : '<p>Featured coming soon.</p>';

const chipRail = TAGS.map(t => `<button class="chip" data-tag="${t}">${t}</button>`).join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Playgrounds Portfolio. Andreas W. Neitzel</title>
<meta property="og:title" content="Playgrounds Portfolio">
<meta property="og:description" content="${cards.length} interactive physics, astronomy, and ML playgrounds.">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Space+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
:root{
  --space-void:#05060f; --nebula-deep:#0a0d1e; --pulsar-blue:#4f9cf9;
  --neutron-gold:#f5c842; --nova-white:#e8eaf6; --photon-dim:#6b7280;
  --corona-glow:rgba(79,156,249,0.15);
  --f-head:'Orbitron',ui-sans-serif,sans-serif;
  --f-body:'Space Grotesk',ui-sans-serif,system-ui,sans-serif;
  --f-mono:'JetBrains Mono',ui-monospace,monospace;
}
*{box-sizing:border-box}
html{background:var(--space-void);scrollbar-width:thin;scrollbar-color:var(--pulsar-blue) #0b0e1c}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:#0b0e1c}
::-webkit-scrollbar-thumb{background:var(--pulsar-blue);border-radius:999px}
body{max-width:1240px;margin:0 auto;padding:28px;background:transparent;color:var(--nova-white);
  font-family:var(--f-body);position:relative;z-index:0;line-height:1.5}
#ambient{position:fixed;inset:0;width:100vw;height:100vh;z-index:-2;pointer-events:none;display:block}
h1{font-family:var(--f-head);font-weight:700;font-size:30px;letter-spacing:0.04em;margin:0 0 8px}
h2{font-family:var(--f-head);font-weight:500;font-size:16px;letter-spacing:0.12em;text-transform:uppercase;color:var(--photon-dim);margin:28px 0 14px}
.header p{color:var(--photon-dim);max-width:70ch}
.uc{font-family:var(--f-mono);color:var(--neutron-gold)}
.heroes{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin:14px 0 8px}
.hero-card{display:block;padding:16px;background:linear-gradient(135deg,var(--nebula-deep),#0c1124);
  border:1px solid #1d2540;border-left:3px solid var(--accent);border-radius:10px;color:var(--nova-white);
  text-decoration:none;transition:transform .18s,box-shadow .18s,border-color .18s}
.hero-card:hover{transform:translateY(-2px);box-shadow:0 0 0 1px var(--accent),0 8px 30px var(--corona-glow)}
.hero-badge{font-family:var(--f-head);font-size:10px;letter-spacing:0.16em;color:var(--accent);text-transform:uppercase}
.hero-card h2{font-family:var(--f-head);font-size:16px;letter-spacing:0.02em;text-transform:none;color:var(--nova-white);margin:6px 0 6px}
.hero-meta{font-family:var(--f-mono);font-size:11px;color:var(--photon-dim)}
.controls{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:10px 0}
.search{flex:1;min-width:220px;position:relative}
.search input{width:100%;padding:11px 14px;background:#0b0f1f;border:1px solid #1d2540;color:var(--nova-white);
  border-radius:8px;font-size:14px;font-family:var(--f-body);transition:box-shadow .25s,border-color .25s;outline:none}
.search input:focus{border-color:var(--pulsar-blue);box-shadow:0 0 0 3px var(--corona-glow),0 0 18px var(--corona-glow)}
.sortsel{padding:10px 12px;background:#0b0f1f;border:1px solid #1d2540;color:var(--nova-white);
  border-radius:8px;font-family:var(--f-mono);font-size:12px}
.tags-rail{display:flex;flex-wrap:wrap;gap:6px;overflow:hidden;transition:max-height .3s ease;max-height:200px}
.chip{padding:5px 11px;background:#0b0f1f;border:1px solid #1d2540;color:var(--photon-dim);border-radius:999px;
  font-size:11px;font-family:var(--f-mono);cursor:pointer;transition:background .2s,color .2s,border-color .2s}
.chip:hover{border-color:var(--pulsar-blue)}
.chip.active{background:var(--pulsar-blue);color:var(--space-void);border-color:var(--pulsar-blue);font-weight:600}
.clearall{display:none;padding:5px 11px;background:transparent;border:1px solid #2a3350;color:var(--photon-dim);
  border-radius:999px;font-size:11px;font-family:var(--f-mono);cursor:pointer}
.clearall.show{display:inline-block}
.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px;margin-top:8px}
.card{position:relative;display:block;padding:15px 15px 13px;background:var(--nebula-deep);
  border:1px solid #161c33;border-left:1px solid var(--accent);border-radius:8px;color:var(--nova-white);
  text-decoration:none;transition:transform .16s,border-left-width .16s,background .16s,box-shadow .16s}
.card:hover{transform:translateY(-2px);border-left-width:3px;background:#0c1126;
  box-shadow:0 6px 26px var(--corona-glow)}
.card h3{font-family:var(--f-body);font-weight:600;font-size:14px;margin:2px 0 6px;padding-right:54px}
.card .meta{font-size:11px;color:var(--photon-dim);margin-bottom:8px}
.card .tags{display:flex;flex-wrap:wrap;gap:3px}
.card .tag{font-size:9px;padding:2px 6px;background:#10162b;color:var(--photon-dim);border-radius:3px;font-family:var(--f-mono)}
.ybadge{position:absolute;top:11px;right:11px;font-family:var(--f-mono);font-size:9px;font-weight:600;
  padding:2px 7px;border-radius:999px;letter-spacing:0.04em}
.ybadge.bsc{background:rgba(79,156,249,0.16);color:var(--pulsar-blue);border:1px solid rgba(79,156,249,0.4)}
.ybadge.msc{background:rgba(245,200,66,0.14);color:var(--neutron-gold);border:1px solid rgba(245,200,66,0.4)}
.cur-group{margin:22px 0 4px;display:flex;align-items:center;gap:12px;cursor:pointer}
.cur-group h3{font-family:var(--f-head);font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:var(--nova-white);margin:0;white-space:nowrap}
.cur-group .ln{flex:1;height:1px;background:linear-gradient(90deg,#26305a,transparent)}
.cur-group .cnt{font-family:var(--f-mono);font-size:11px;color:var(--photon-dim)}
.cur-group .chev{color:var(--pulsar-blue);transition:transform .2s}
.cur-group.collapsed .chev{transform:rotate(-90deg)}
.cur-wrap{overflow:hidden;transition:max-height .35s ease}
footer{padding:30px 0 8px;color:var(--photon-dim);font-size:12px;font-family:var(--f-mono)}
footer a{color:var(--pulsar-blue);text-decoration:none}
body{opacity:1;transition:opacity .32s ease}
body.leaving{opacity:0}
@media (prefers-reduced-motion:reduce){
  *{transition:none!important;animation:none!important}
}
</style>
</head>
<body>
<canvas id="ambient" aria-hidden="true"></canvas>
<script>
(function(){
  var c=document.getElementById('ambient'); if(!c) return;
  var x=c.getContext('2d'); if(!x) return;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W=0,H=0,DPR=1,layers=[],neb=[],last=0,mxv=0,tmx=0;
  function rng(s){return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
  function build(){
    var r=rng(0xACE1);
    W=window.innerWidth; H=window.innerHeight; DPR=Math.min(2,window.devicePixelRatio||1);
    c.width=W*DPR; c.height=H*DPR; x.setTransform(DPR,0,0,DPR,0,0);
    var depths=[[0.10,1.5,0.9],[0.05,1.0,0.6],[0.02,0.7,0.4]];
    layers=depths.map(function(d){
      var n=Math.max(28,Math.round(W*H/16000*d[2]/0.4)), a=[];
      for(var i=0;i<n;i++)a.push({x:r()*W,y:r()*(H+600),rr:d[1]*(0.5+r()),ph:r()*6.2832});
      return {par:d[0],br:d[2],s:a};
    });
    var cols=[[60,90,180],[120,70,170],[40,120,150],[150,95,140]];
    neb=[]; for(var k=0;k<4;k++)neb.push({x:r()*W,y:r()*H,R:280+r()*360,c:cols[k],vx:(r()-0.5)*0.05,vy:(r()-0.5)*0.05,ph:r()*6.2832});
  }
  function draw(t){
    x.fillStyle='#05060f'; x.fillRect(0,0,W,H);
    for(var b of neb){
      var nx=b.x+(reduce?0:Math.sin(t*0.00004+b.ph)*40), ny=b.y+(reduce?0:Math.cos(t*0.00003+b.ph)*30);
      var a=0.10+(reduce?0:0.03*Math.sin(t*0.0002+b.ph));
      var g=x.createRadialGradient(nx,ny,0,nx,ny,b.R);
      g.addColorStop(0,'rgba('+b.c[0]+','+b.c[1]+','+b.c[2]+','+Math.max(0,a).toFixed(3)+')');
      g.addColorStop(1,'rgba('+b.c[0]+','+b.c[1]+','+b.c[2]+',0)');
      x.fillStyle=g; x.fillRect(0,0,W,H);
      if(!reduce){ b.x+=b.vx; b.y+=b.vy; if(b.x<-b.R)b.x=W+b.R; if(b.x>W+b.R)b.x=-b.R; if(b.y<-b.R)b.y=H+b.R; if(b.y>H+b.R)b.y=-b.R; }
    }
    mxv+=(tmx-mxv)*0.05;
    var sc=window.scrollY||window.pageYOffset||0;
    for(var L of layers){
      var oy=-sc*L.par, om=Math.max(-8,Math.min(8,mxv*L.par));
      for(var s of L.s){
        var px=s.x+om, py=((s.y+oy)%(H+600)+(H+600))%(H+600)-300;
        if(py<-4||py>H+4)continue;
        var tw=reduce?0.75:0.55+0.45*Math.sin(t*0.0018*L.br+s.ph);
        x.globalAlpha=Math.max(0,Math.min(1,tw))*L.br;
        x.fillStyle='#dfe6ff'; x.beginPath(); x.arc(px,py,s.rr,0,6.2832); x.fill();
      }
    }
    x.globalAlpha=1;
  }
  function frame(t){ if(t-last>33){last=t;draw(t);} if(!reduce) requestAnimationFrame(frame); }
  build(); draw(0); if(!reduce) requestAnimationFrame(frame);
  window.addEventListener('mousemove',function(e){ tmx=e.clientX-window.innerWidth/2; });
  var to; window.addEventListener('resize',function(){clearTimeout(to);to=setTimeout(function(){build();draw(performance.now());},200);});
})();
</script>

<div class="header">
  <h1>Playgrounds Portfolio</h1>
  <p>${cards.length} interactive simulations across physics, astronomy, statistical mechanics, and machine learning. Built for AI-lab hiring committees and ESA Research Fellowship reviewers; aligned to the UPorto FCUP Bachelor in Physics and MSc in Astronomy and Astrophysics curriculum.</p>
</div>

<section>
  <h2>Featured</h2>
  <div class="heroes">${heroHTML}</div>
</section>

<section>
  <h2>Browse</h2>
  <div class="controls">
    <div class="search"><input id="search-input" type="text" aria-label="Search playgrounds"></div>
    <select class="sortsel" id="sortsel" aria-label="Order">
      <option value="az">Order: A to Z</option>
      <option value="subject">Order: by subject</option>
      <option value="curriculum">Order: curriculum (BSc to MSc)</option>
    </select>
  </div>
  <div class="tags-rail" id="tags-rail">${chipRail}<button class="clearall" id="clearall">clear all</button></div>
  <div class="card-grid" id="card-grid">${cardsHTML}</div>
</section>

<footer>Maintained by Andreas W. Neitzel · ORCID 0000-0001-6283-907X · IA/CAUP, U. Porto · <a href="https://github.com/AndreasWNeitzel/playgrounds-portfolio">source</a></footer>

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

  var qs=["Filter by title...","try: fourier","try: AST2004","try: black hole","try: bsc-y3s1","try: quantum"], qi=0,ci=0,del=false;
  function type(){
    if(reduce){ input.placeholder="Search playgrounds"; return; }
    var s=qs[qi]; input.placeholder=s.slice(0,ci)+(ci%2?'_':' ');
    if(!del&&ci<s.length)ci++;
    else if(!del&&ci===s.length){del=true;setTimeout(type,1400);return;}
    else if(del&&ci>0)ci--;
    else {del=false;qi=(qi+1)%qs.length;}
    setTimeout(type,del?32:70);
  }
  type();

  var actx=null;
  function initA(){ if(actx||reduce)return; try{actx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){} }
  window.addEventListener('pointerdown',initA,{once:true});
  window.addEventListener('keydown',initA,{once:true});
  function ping(){
    if(!actx||reduce)return;
    var o=actx.createOscillator(),g=actx.createGain(),n=actx.currentTime;
    o.type='sine'; o.frequency.value=880;
    g.gain.setValueAtTime(0.0001,n);
    g.gain.exponentialRampToValueAtTime(0.04,n+0.005);
    g.gain.exponentialRampToValueAtTime(0.0001,n+0.08);
    o.connect(g); g.connect(actx.destination); o.start(n); o.stop(n+0.085);
  }

  function visible(c){
    var q=input.value.toLowerCase();
    var t=c.dataset.title,uc=c.dataset.uc,y=(c.dataset.year||'').toLowerCase(),sj=c.dataset.subj;
    var tags=(c.dataset.tags||'').split(' ');
    var mq=!q||t.indexOf(q)>=0||uc.indexOf(q)>=0||y.indexOf(q)>=0||sj.indexOf(q)>=0;
    var keys=Object.keys(active);
    var mt=keys.length===0||keys.every(function(k){return sj===k||tags.indexOf(k)>=0;});
    return mq&&mt;
  }
  function clearGroups(){ [].slice.call(grid.querySelectorAll('.cur-group,.cur-wrap')).forEach(function(e){e.remove();}); }
  function render(){
    clearGroups();
    var mode=sortsel.value, vis=cards.filter(visible);
    cards.forEach(function(c){c.style.display='none';});
    if(mode==='curriculum'){
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
      var arr=vis.slice();
      if(mode==='subject') arr.sort(function(a,b){return a.dataset.subj.localeCompare(b.dataset.subj)||a.dataset.title.localeCompare(b.dataset.title);});
      else arr.sort(function(a,b){return a.dataset.title.localeCompare(b.dataset.title);});
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
      setTimeout(function(){ location.href=href; },320);
    });
  });
  render();
})();
</script>
</body></html>`;

try { mkdirSync('dist', { recursive: true }); } catch {}
writeFileSync('dist/index.html', html);
writeFileSync('index.html', html);
console.log(`Wrote dist/index.html and index.html (${cards.length} cards, ${heroes.length} heroes).`);
