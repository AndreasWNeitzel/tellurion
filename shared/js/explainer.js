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
  // Bibliographic origin: prefer an explicit section, then frontmatter,
  // then a "Source:/Reference:" line in the body, then the figcaption.
  let cites = section(body, 'Citations') || section(body, 'References');
  if (!cites && fm.primary_citation) cites = `- ${fm.primary_citation}${fm.primary_chapter ? `, ch. ${fm.primary_chapter}` : ''}`;
  if (!cites) {
    const sm = body.match(/(?:Source|Reference|Refs?)\s*[:.-][^\n]+/i);
    if (sm) cites = sm[0].trim();
  }
  if (!cites) {
    const cap = document.querySelector('figcaption, [data-slot="caption"]');
    const ct = cap && cap.textContent.match(/(?:Source|Reference)\s*[:.][^.]+\.?/i);
    if (ct) cites = ct[0].trim();
  }
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
       ${refDetail ? `<details class="explainer-more"><summary>Reference detail (setup, equations, numerics)</summary>${refDetail}</details>` : ''}`
    : `${plain ? `<section><h3>The idea, in plain language</h3>${mdToHtml(plain)}</section>` : ''}
       ${setup ? `<section><h3>Physical setup</h3>${mdToHtml(setup)}</section>` : ''}
       ${eqs ? `<section><h3>The equations</h3>${mdToHtml(eqs)}</section>` : ''}
       ${numerics ? `<section><h3>How it is computed</h3>${mdToHtml(numerics)}</section>` : ''}`;
  dlg.innerHTML = `
    <article class="explainer-body">
      <button class="explainer-close" type="button" aria-label="Close">close</button>
      <h2>${esc(title)}</h2>
      ${main}
      ${cites ? `<section><h3>Where this comes from</h3>${mdToHtml(cites)}</section>` : ''}
    </article>`;

  const open = () => {
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

  document.body.appendChild(btn);
  document.body.appendChild(dlg);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', build, { once: true });
} else {
  build();
}
