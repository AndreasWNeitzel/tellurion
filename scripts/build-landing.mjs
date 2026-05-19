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

const cardsHTML = cards.map(c => `
  <a class="card" data-title="${c.title.toLowerCase()}" data-uc="${(c.primary_uc || '').toLowerCase()}" data-year="${c.curriculum_year}" data-tags="${c.tags.join(' ')}" data-order="${c.order}" data-group="${c.group}" href="${c.path}/index.html">
    <div class="chead"><h3>${c.title}</h3><span class="ybadge">${c.badge}</span></div>
    <div class="meta"><span class="uc">${c.primary_uc}</span></div>
    <div class="tags">${c.tags.slice(0, 4).map(t => `<span class="tag">${t}</span>`).join('')}</div>
  </a>`).join('');

const heroHTML = heroes.length ? heroes.map(h => `
  <a class="hero-card" href="${h.path}/index.html">
    <div class="hbadge"><span class="star">&#9733;</span></div>
    <h2>${h.title}</h2>
    <div class="hero-meta"><span class="uc">${h.primary_uc}</span> &middot; ${h.badge}</div>
  </a>`).join('') : '<p>Featured coming soon.</p>';

const chipRail = TAGS.map(t => `<button class="chip" data-tag="${t}">${t}</button>`).join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Playgrounds Portfolio. Andreas W. Neitzel</title>
<meta property="og:title" content="Playgrounds Portfolio">
<meta property="og:description" content="${cards.length} interactive physics, astronomy, and machine-learning playgrounds.">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Orbitron:wght@600&display=swap">
<style>
:root{
  --bg-primary:#080b14; --bg-card:#0d1117; --bg-card-hover:#111827;
  --border-subtle:#1e2a3a; --border-active:#2d4263;
  --text-primary:#e2e8f0; --text-secondary:#64748b; --text-dimmed:#334155;
  --accent-blue:#3b82f6; --accent-gold:#d4a843;
  --f-ui:'Inter',ui-sans-serif,system-ui,sans-serif;
  --f-mono:'IBM Plex Mono',ui-monospace,monospace;
}
*{box-sizing:border-box}
html{background:var(--bg-primary);scrollbar-width:thin;scrollbar-color:#2d4263 #0b0e16}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:#0b0e16}
::-webkit-scrollbar-thumb{background:#2d4263;border-radius:999px}
body{max-width:1240px;margin:0 auto;padding:30px;background:transparent;color:var(--text-primary);
  font-family:var(--f-ui);font-weight:400;position:relative;z-index:0;line-height:1.55}
#ambient{position:fixed;inset:0;width:100vw;height:100vh;z-index:-2;pointer-events:none;display:block}
.site-title{font-family:'Orbitron',var(--f-ui);font-weight:600;font-size:26px;letter-spacing:0.01em;margin:0 0 6px;color:var(--text-primary)}
.header p{color:var(--text-secondary);max-width:74ch;font-size:14px}
h2.sec{font-family:var(--f-ui);font-weight:500;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:var(--text-dimmed);margin:30px 0 14px}
.uc{font-family:var(--f-mono);font-weight:400;font-size:11px;color:var(--text-secondary)}
.heroes{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:14px 0 6px}
.hero-card{display:block;padding:15px;background:var(--bg-card);border:1px solid var(--border-subtle);
  border-radius:8px;color:var(--text-primary);text-decoration:none;transition:background .15s ease,border-color .15s ease}
.hero-card:hover{background:var(--bg-card-hover);border-color:var(--border-active)}
.hbadge .star{color:var(--accent-gold);font-size:13px}
.hero-card h2{font-family:var(--f-ui);font-weight:600;font-size:15px;letter-spacing:-0.02em;margin:6px 0 6px;color:var(--text-primary)}
.hero-meta{font-size:12px;color:var(--text-secondary)}
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
.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:12px;margin-top:8px}
.card-grid.curr{display:block}
.card{display:block;padding:14px;background:var(--bg-card);border:1px solid var(--border-subtle);
  border-radius:8px;color:var(--text-primary);text-decoration:none;transition:background .15s ease,border-color .15s ease}
.card:hover{background:var(--bg-card-hover);border-color:var(--border-active)}
.chead{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.card h3{font-family:var(--f-ui);font-weight:600;font-size:14px;letter-spacing:-0.02em;margin:0 0 4px;color:var(--text-primary)}
.card .meta{margin:2px 0 8px}
.ybadge{font-family:var(--f-mono);font-size:11px;color:var(--text-secondary);white-space:nowrap;flex:none}
.card .tags{display:flex;flex-wrap:wrap;gap:4px}
.card .tag{font-size:11px;padding:2px 7px;background:#1e2a3a;color:var(--text-secondary);border-radius:4px;font-family:var(--f-mono)}
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
    layers=[[0.10,1.2,0.85],[0.05,0.9,0.55],[0.02,0.6,0.35]].map(function(d){
      var n=Math.max(20,Math.round(W*H/20000*d[2]/0.4)), a=[];
      for(var i=0;i<n;i++)a.push({x:r()*W,y:r()*(H+600),rr:d[1]*(0.5+r()),ph:r()*6.2832});
      return {par:d[0],br:d[2],s:a};
    });
    var cols=[[40,55,110],[70,45,100],[28,75,95],[90,60,90]];
    neb=[]; for(var k=0;k<4;k++)neb.push({x:r()*W,y:r()*H,R:300+r()*360,c:cols[k],vx:(r()-0.5)*0.04,vy:(r()-0.5)*0.04,ph:r()*6.2832});
  }
  function draw(t){
    x.fillStyle='#080b14'; x.fillRect(0,0,W,H);
    for(var b of neb){
      var nx=b.x+(reduce?0:Math.sin(t*0.00004+b.ph)*36), ny=b.y+(reduce?0:Math.cos(t*0.00003+b.ph)*26);
      var a=0.05+(reduce?0:0.018*Math.sin(t*0.0002+b.ph));
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
        var tw=reduce?0.42:0.30+0.30*Math.sin(t*0.0016*L.br+s.ph);
        x.globalAlpha=Math.max(0,Math.min(1,tw))*L.br*0.6;
        x.fillStyle='#aab4cc'; x.beginPath(); x.arc(px,py,s.rr,0,6.2832); x.fill();
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

<footer>Andreas W. Neitzel &middot; ORCID 0000-0001-6283-907X &middot; IA/CAUP, University of Porto &middot; <a href="https://github.com/AndreasWNeitzel/playgrounds-portfolio">source</a></footer>

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
})();
</script>
</body></html>`;

try { mkdirSync('dist', { recursive: true }); } catch {}
writeFileSync('dist/index.html', html);
writeFileSync('index.html', html);
console.log(`Wrote dist/index.html and index.html (${cards.length} cards, ${heroes.length} heroes).`);
