// explainer.js
// A click-to-open "What is this?" panel for every playground. It fetches
// the playground's own colocated spec.md (the single source of truth),
// pulls the plain-language summary, the full set of equations, and the
// bibliographic source, and renders them in a dialog. Equations stay as
// KaTeX delimiters and are rendered with the page's existing KaTeX (or a
// lazily injected copy if a playground does not already load it).
//
// Render-neutral: the trigger button and dialog live outside #stage, so
// the visual-regression goldens (which screenshot #stage only) are
// unaffected. No per-playground markup is required beyond including this
// module once.

import { mountStarField } from './starfield.js';
import { returnFromPlayground } from './audio.js';
import { mountCursor } from './cursor.js';

const FENCE = '-'.repeat(3);

function parseFrontmatter(text) {
  const m = text.match(new RegExp(`^${FENCE}\\n([\\s\\S]*?)\\n${FENCE}`));
  const fm = {};
  if (!m) return { fm, body: text };
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim().replace(/^(['"])([\s\S]*)\1$/, '$2');
    fm[k] = v;
  }
  return { fm, body: text.slice(m[0].length) };
}

// Extract a "## Heading" section body (everything up to the next
// "## "). Done by splitting on heading boundaries rather than a regex
// with a multiline `$`, whose end-of-line match would otherwise stop
// the capture at the blank line that follows every heading.
function section(body, name) {
  const chunks = body.split(/\n(?=##\s)/);
  const want = name.toLowerCase();
  for (const c of chunks) {
    const nl = c.indexOf('\n');
    const head = (nl < 0 ? c : c.slice(0, nl)).replace(/^##\s+/, '').trim().toLowerCase();
    if (head.startsWith(want)) return nl < 0 ? '' : c.slice(nl + 1).trim();
  }
  return '';
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Markdown-lite to HTML, preserving $...$ / $$...$$ for KaTeX. Handles
// paragraphs, ###/#### subheadings, ordered and bullet lists, `code`,
// **bold**, fenced code blocks, and multi-line display-equation blocks.
// The comprehensive "## Explainer" section relies on all of these.
function mdToHtml(md) {
  const blocks = md.split(/\n{2,}/);
  const html = [];
  for (const raw of blocks) {
    const blk = raw.trim();
    if (!blk) continue;
    if (blk.startsWith('```')) {
      html.push(`<pre><code>${esc(blk.replace(/```[a-z]*\n?/gi, '').replace(/```$/, ''))}</code></pre>`);
      continue;
    }
    // A block can bundle a "### Heading" with the prose that follows it
    // when no blank line separates them. Walk lines, splitting headings
    // out and flushing the buffered run with the right block rule.
    let buf = [];
    const flush = () => {
      const t = buf.join('\n').trim();
      buf = [];
      if (!t) return;
      if (/^(\$\$)[\s\S]*\1$/.test(t)) { html.push(`<p class="eq">${t}</p>`); return; }
      if (/^\d+\.\s+/.test(t) && t.split('\n').every((l) => /^\d+\.\s+|^\s+/.test(l) || !l.trim())) {
        const items = t.split(/\n(?=\d+\.\s+)/).map((l) => inline(l.replace(/^\d+\.\s+/, '').trim()));
        html.push(`<ol>${items.map((x) => `<li>${x}</li>`).join('')}</ol>`);
        return;
      }
      if (/^[-*]\s+/.test(t) && t.split('\n').every((l) => /^[-*]\s+|^\s+/.test(l) || !l.trim())) {
        const items = t.split(/\n(?=[-*]\s+)/).map((l) => inline(l.replace(/^[-*]\s+/, '').trim()));
        html.push(`<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`);
        return;
      }
      html.push(`<p>${inline(t.replace(/\n/g, ' '))}</p>`);
    };
    for (const ln of blk.split('\n')) {
      const h = ln.match(/^(#{3,5})\s+(.*)$/);
      if (h) {
        flush();
        const lvl = h[1].length <= 3 ? 'h4' : 'h5';
        html.push(`<${lvl}>${inline(h[2].trim())}</${lvl}>`);
      } else {
        buf.push(ln);
      }
    }
    flush();
  }
  return html.join('');
}

// Inline spans; escape only the non-math, non-code runs.
function inline(s) {
  const parts = [];
  let i = 0;
  while (i < s.length) {
    if (s.startsWith('$$', i)) {
      const j = s.indexOf('$$', i + 2);
      if (j < 0) { parts.push(esc(s.slice(i))); break; }
      parts.push(s.slice(i, j + 2)); i = j + 2;
    } else if (s[i] === '$') {
      const j = s.indexOf('$', i + 1);
      if (j < 0) { parts.push(esc(s.slice(i))); break; }
      parts.push(s.slice(i, j + 1)); i = j + 1;
    } else if (s[i] === '`') {
      const j = s.indexOf('`', i + 1);
      if (j < 0) { parts.push(esc(s.slice(i))); break; }
      parts.push(`<code>${esc(s.slice(i + 1, j))}</code>`); i = j + 1;
    } else {
      let j = i;
      while (j < s.length && s[j] !== '$' && s[j] !== '`') j += 1;
      parts.push(
        esc(s.slice(i, j))
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\*([^*\n]+)\*/g, '<em>$1</em>'),
      );
      i = j;
    }
  }
  return parts.join('');
}

function ensureKatex(cb) {
  if (window.renderMathInElement) return cb();
  if (!document.querySelector('link[data-explainer-katex]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.dataset.explainerKatex = '1';
    l.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css';
    document.head.appendChild(l);
    const s1 = document.createElement('script');
    s1.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js';
    s1.onload = () => {
      const s2 = document.createElement('script');
      s2.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/contrib/auto-render.min.js';
      s2.onload = cb;
      document.head.appendChild(s2);
    };
    document.head.appendChild(s1);
  } else {
    const t = setInterval(() => { if (window.renderMathInElement) { clearInterval(t); cb(); } }, 60);
  }
}

async function build() {
  let text;
  try {
    const r = await fetch('./spec.md', { cache: 'no-store' });
    if (!r.ok) return;
    text = await r.text();
  } catch { return; }   // file:// or fetch blocked: panel simply absent

  const { fm, body } = parseFrontmatter(text);
  const title = fm.title || document.title || 'This playground';
  const plain = fm.one_paragraph || fm.description || '';
  // The long-form, simple-language, equation-complete walkthrough. When
  // present it is the primary panel content; the terser peer-review
  // sections below it become supporting reference detail.
  const explainer = section(body, 'Explainer')
    || section(body, 'In plain words')
    || section(body, 'In plain language');
  const setup = section(body, 'Physical setup');
  const eqs = section(body, 'Governing equations') || section(body, 'Equations');
  const numerics = section(body, 'Numerical method');
  // Citations are deliberately not rendered in the explainer dialog: bibkey
  // identifiers are internal book-keeping, and prose sources already live in
  // the page caption and in each playground's spec.md.
  if (!plain && !setup && !eqs && !explainer) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'explainer-fab';
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.textContent = 'What is this?';

  const dlg = document.createElement('dialog');
  dlg.className = 'explainer-dialog';
  dlg.setAttribute('aria-label', `Explanation: ${title}`);
  // With a dedicated Explainer section, that is the whole story (it
  // carries its own subheadings, equations and worked steps); the
  // peer-review sections are folded into a collapsed "Reference detail"
  // so they stay available without crowding the primary read. Without
  // one, fall back to the assembled section view.
  const refDetail = [
    setup ? `<h4>Physical setup</h4>${mdToHtml(setup)}` : '',
    eqs ? `<h4>Governing equations</h4>${mdToHtml(eqs)}` : '',
    numerics ? `<h4>How it is computed</h4>${mdToHtml(numerics)}` : '',
  ].join('');
  const main = explainer
    ? `<section class="explainer-main">${mdToHtml(explainer)}</section>
       ${refDetail ? `<details class="explainer-more"><summary>Reference detail (setup, equations, numerics)</summary><div class="explainer-more-body">${refDetail}</div></details>` : ''}`
    : `${plain ? `<section><h3>The idea, in plain language</h3>${mdToHtml(plain)}</section>` : ''}
       ${setup ? `<section><h3>Physical setup</h3>${mdToHtml(setup)}</section>` : ''}
       ${eqs ? `<section><h3>The equations</h3>${mdToHtml(eqs)}</section>` : ''}
       ${numerics ? `<section><h3>How it is computed</h3>${mdToHtml(numerics)}</section>` : ''}`;
  dlg.innerHTML = `
    <article class="explainer-body">
      <button class="explainer-close" type="button" aria-label="Close">close</button>
      <h2>${esc(title)}</h2>
      ${main}
    </article>`;

  const open = () => {
    // Lock the page scroll so its scrollbar does not show alongside
    // the dialog's own scrollbar (the reported double scrollbar).
    document.documentElement.style.overflow = 'hidden';
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    ensureKatex(() => window.renderMathInElement && window.renderMathInElement(dlg, {
      delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
      throwOnError: false,
    }));
  };
  const close = () => { if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open'); };
  btn.addEventListener('click', open);
  dlg.querySelector('.explainer-close').addEventListener('click', close);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && dlg.open) close(); });
  // Restore page scroll on every close path (button, backdrop, Escape).
  dlg.addEventListener('close', () => { document.documentElement.style.overflow = ''; });

  document.body.appendChild(btn);
  document.body.appendChild(dlg);
}

// Capture-aware space-theme chrome (ambient parallax background behind
// the playground, a frosted "go back" control, smooth page fade). The
// per-playground visual gate loads ?deterministic=1&capture=..., and
// for those loads this returns immediately so the page is byte-
// identical to the committed goldens (the 310 deterministic gates stay
// valid). Real visitors, with no such query, get the full aesthetic.
const _qp = new URLSearchParams(location.search);
const _CAPTURE = _qp.get('deterministic') === '1' || _qp.has('capture');

function mountChrome() {
  if (_CAPTURE) return;
  if (document.getElementById('ambient')) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!document.querySelector('link[data-chrome-font]')) {
    const lf = document.createElement('link');
    lf.rel = 'stylesheet'; lf.dataset.chromeFont = '1';
    lf.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap';
    document.head.appendChild(lf);
  }
  const css = document.createElement('style');
  css.textContent = [
    ':root{--bg-void:#07090f;--bg-card:#0f1220;--bg-frosted:rgba(12,15,26,0.85);',
    '--border-subtle:rgba(255,255,255,0.10);--border-active:rgba(255,255,255,0.18);',
    '--text-primary:#e8eaf0;--text-secondary:#8892a4;--text-dimmed:#3d4758;--accent:#4f7ef7}',
    'html{background:var(--bg-void);scrollbar-width:thin;scrollbar-color:var(--border-subtle) transparent}',
    '::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}',
    '::-webkit-scrollbar-thumb{background:var(--border-subtle);border-radius:3px}',
    '::-webkit-scrollbar-thumb:hover{background:var(--border-active)}',
    // No transform on <body>: a transformed ancestor would reparent
    // position:fixed (back button, "What is this?" FAB) to the body
    // box instead of the viewport. Opacity-only page fade. The
    // padding-top keeps the playground title clear of the fixed back
    // button. (Chrome is capture-suppressed, so goldens are untouched.)
    'body{position:relative;z-index:0;padding-top:60px;opacity:1;transition:opacity .15s ease}',
    'body.pg-leaving{opacity:0}',
    '#ambient{position:fixed;inset:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;display:block}',
    '@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}',
    '.pg-back{position:fixed;top:20px;left:20px;z-index:100;display:flex;align-items:center;gap:8px;',
    'padding:8px 14px 8px 10px;background:var(--bg-frosted);backdrop-filter:blur(12px);',
    '-webkit-backdrop-filter:blur(12px);border:1px solid var(--border-subtle);border-radius:6px;',
    "font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:0.8125rem;font-weight:400;",
    'text-decoration:none;cursor:pointer;opacity:0;transform:translateX(-8px);',
    'transition:border-color var(--t-fast),background var(--t-fast)}',
    '.pg-back.in{opacity:1;transform:translateX(0);transition:opacity 150ms ease,transform 150ms ease}',
    '.pg-back:hover{border-color:var(--border-active);background:var(--bg-card)}',
    '.pg-back:hover .bt{color:var(--text-primary)}',
    '.pg-back svg{width:14px;height:14px;color:var(--accent);flex:none;display:block}',
    '.pg-back .bt{color:var(--text-secondary)}',
    // Related strip (Section 14)
    ".pg-related{max-width:1100px;margin:36px auto 48px;padding:0 24px;font-family:'Plus Jakarta Sans',system-ui,sans-serif}",
    '.pg-related h2{font-size:0.6875rem;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-dimmed);margin:0 0 16px}',
    '.pg-related .rgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}',
    '@media(max-width:760px){.pg-related .rgrid{grid-template-columns:1fr}}',
    '.rcard{position:relative;display:flex;flex-direction:column;background:var(--bg-card);border:1px solid var(--border-subtle);',
    'border-radius:8px;overflow:hidden;text-decoration:none;transition:border-color var(--t-fast),transform var(--t-fast)}',
    '.rcard::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--rtagc,#94a3b8);border-radius:3px 0 0 3px}',
    '.rcard:hover{border-color:var(--border-active);transform:translateY(-2px)}',
    '.rcard .rimg{position:relative;height:80px;background:var(--bg-card)}',
    '.rcard .rimg::after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,rgba(7,9,15,0.2),rgba(7,9,15,0.95))}',
    '.rcard .rph{position:absolute;left:30%;top:34%;width:40%;height:28%;background:#fff;opacity:0.07}',
    '.rcard .rimgsrc{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}',
    '.rcard .rbody{padding:12px 14px}',
    '.rcard .rt{font-size:1.0rem;font-weight:600;letter-spacing:-0.01em;color:var(--text-primary);margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.rcard .ru{margin-top:4px;font-family:var(--f-mono,monospace);font-size:0.75rem;color:var(--text-dimmed)}',
    reduce ? 'body{transition:none}.pg-back{opacity:1;transform:none;transition:none}' : '',
  ].join('');
  document.head.appendChild(css);

  // Star field lives only on the homepage; playground pages keep the
  // GPU and the CPU clear for the simulation itself. Custom cursor is
  // also homepage-only.
  mountCursor();

  // The Layout System v2 template provides its own .playground-back.
  // Only inject the legacy .pg-back on pre-v2 pages; otherwise wire
  // the leave transition + audio resurface onto the v2 button so it
  // keeps that behaviour without a duplicate control.
  const v2Back = document.querySelector('.playground-back');
  if (v2Back) {
    v2Back.addEventListener('click', (e) => {
      if (reduce) return;
      e.preventDefault();
      try { returnFromPlayground(); } catch { /* ignore */ }
      try { (window.__starfield || mountStarField())?.accelerate('out'); } catch { /* ignore */ }
      document.body.classList.add('pg-leaving');
      const href = v2Back.getAttribute('href') || '../../../index.html';
      setTimeout(() => { location.href = href; }, 170);
    });
  } else {
    const back = document.createElement('a');
    back.className = 'pg-back';
    back.href = '../../../index.html';
    const ttl = (document.querySelector('h1') ? document.querySelector('h1').textContent : (document.title || 'Back')).trim();
    back.setAttribute('aria-label', 'Back to all simulations');
    back.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>'
      + '<span class="bt">' + esc(ttl.length > 24 ? ttl.slice(0, 24).trim() + '…' : ttl) + '</span>';
    back.addEventListener('click', (e) => {
      if (reduce) return;
      e.preventDefault();
      try { returnFromPlayground(); } catch { /* ignore */ }   // B2 resurface
      try { (window.__starfield || mountStarField())?.accelerate('out'); } catch { /* ignore */ }
      document.body.classList.add('pg-leaving');
      setTimeout(() => { location.href = back.getAttribute('href'); }, 170);
    });
    document.body.appendChild(back);
    // Entry: slide in from the left, 400 ms after load (Section 10).
    if (reduce) back.classList.add('in');
    else setTimeout(() => back.classList.add('in'), 400);
  }

  if (!reduce) {
    document.body.classList.add('pg-leaving');
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('pg-leaving')));
  }

  // Related strip (Section 14): same UC first, then same primary tag,
  // up to 3. Catalogue is fetched at runtime; capture-suppressed, so
  // it never touches the deterministic golden frames.
  fetch('../../../shared/playgrounds-catalogue.json').then((r) => r.ok ? r.json() : null).then((cat) => {
    // The v2 template carries an empty .playground-related section in
    // the content column. Populate THAT (replacing it with the built
    // strip) rather than appending a detached section to the body, so
    // the related cards appear where the page reserves space for them.
    const tmpl = document.querySelector('.playground-related');
    if (!Array.isArray(cat) || !cat.length) { if (tmpl) tmpl.hidden = true; return; }
    const segs = decodeURIComponent(location.pathname).split('/').filter(Boolean);
    const ix = segs.lastIndexOf('index.html');
    const slug = ix > 0 ? segs[ix - 1] : segs[segs.length - 1];
    const self = cat.find((e) => e.slug === slug) || {};
    const pool = cat.filter((e) => e.slug !== slug);
    const pick = [];
    const take = (arr) => { for (const e of arr) { if (pick.length < 3 && !pick.includes(e)) pick.push(e); } };
    if (self.uc) take(pool.filter((e) => e.uc && e.uc === self.uc));
    if (self.tag) take(pool.filter((e) => e.tag === self.tag));
    const rel = pick.slice(0, 3);
    if (rel.length === 0) { if (tmpl) tmpl.hidden = true; return; }   // nothing related
    const cardsHTML = rel.map((e) => {
      const thumbHTML = e.thumb
        ? `<img class="rimgsrc" src="../../../assets/thumbs/${e.thumb}" alt="" loading="lazy">`
        : '<div class="rph"></div>';
      return (
        `<a class="rcard" style="--rtagc:${e.tagc || '#94a3b8'}" href="../../../${e.path}/index.html">`
        + `<div class="rimg">${thumbHTML}</div>`
        + `<div class="rbody"><h3 class="rt">${esc(e.title)}</h3><div class="ru">${esc(e.uc || '')}</div></div></a>`
      );
    }).join('');
    const sec = document.createElement('section');
    sec.className = 'pg-related';
    sec.innerHTML = '<h2>Related</h2><div class="rgrid">' + cardsHTML + '</div>';
    if (tmpl) tmpl.replaceWith(sec);
    else document.body.appendChild(sec);
  }).catch(() => {});
}

function boot() { build(); mountChrome(); }
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
