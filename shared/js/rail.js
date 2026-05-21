// shared/js/rail.js
// Right-rail diagnostics surface for the Playground Layout System v2.
//
// The rail subscribes to the playground's diagnostics interface:
//   window.playground.getState()       -> { fields: StateField[] }
//   window.playground.getInvariants()  -> Invariant[]
// State is polled at 10 Hz, invariants at 5 Hz, from a single rAF
// loop that pauses while the document is hidden. References are read
// once from the playground's spec.md.
//
// This module self-initialises on DOMContentLoaded. If the page has
// no .playground-rail (an unmigrated playground), it does nothing.

const STATE_HZ = 10;
const INVAR_HZ = 5;

// ---- value formatting (spec 7.2) ----------------------------------------
function formatValue(value, format) {
  if (typeof value === 'string') return value;
  if (!Number.isFinite(value)) return String(value);
  let out;
  switch (format) {
    case 'int':     out = value.toFixed(0); break;
    case 'sci':     out = value.toExponential(2); break;
    case 'percent': out = (value * 100).toFixed(1) + '%'; break;
    case 'fixed-3': out = value.toFixed(3); break;
    case 'float':
    default:        out = value.toPrecision(3); break;
  }
  // Render negative zero as "0".
  if (out === '-0' || out === '-0.00' || out === '-0.000' || Object.is(Number(out), -0)) {
    out = out.replace(/^-(?=0(\D|$))/, '');
  }
  return out;
}

function labelFor(field) {
  if (field.label) return field.label;
  return field.key.replace(/_/g, ' ');
}

// ---- references parsing (spec 7.4, 7.6) ---------------------------------
// Pull the references list out of the playground's spec.md frontmatter.
async function loadReferences() {
  try {
    const res = await fetch('spec.md', { cache: 'no-cache' });
    if (!res.ok) return [];
    const text = await res.text();
    const m = text.match(/(^|\n)\s*references\s*:(.*)/i);
    if (!m) return [];
    const after = text.slice(m.index + m[0].length);
    const block = after.split(/\n(?=\S)/)[0] || '';
    const items = [];
    for (const line of block.split('\n')) {
      const lm = line.match(/^\s*[-*]\s+(.+?)\s*$/);
      if (lm) items.push(lm[1].replace(/^["']|["']$/g, ''));
    }
    return items;
  } catch {
    return [];
  }
}

// ---- rendering ----------------------------------------------------------
function renderState(tableEl) {
  const pg = window.playground;
  let fields = [];
  try {
    const s = pg && typeof pg.getState === 'function' ? pg.getState() : null;
    fields = (s && Array.isArray(s.fields)) ? s.fields : [];
  } catch { fields = []; }

  if (fields.length === 0) {
    tableEl.innerHTML = '<tr><td class="rail-empty t-small">Engine not running</td></tr>';
    return;
  }
  // Primary fields first; cap secondary at 5 with a "+N more" line.
  const primary = fields.filter((f) => f.significance !== 'secondary');
  const secondary = fields.filter((f) => f.significance === 'secondary');
  const shown = primary.concat(secondary.slice(0, 5));
  const rows = shown.map((f) => {
    const v = formatValue(f.value, f.format);
    const unit = f.unit ? ` ${f.unit}` : '';
    return `<tr><td class="state-label">${escapeHtml(labelFor(f))}</td>`
      + `<td class="state-value">${escapeHtml(v)}${escapeHtml(unit)}</td></tr>`;
  });
  if (secondary.length > 5) {
    rows.push(`<tr><td class="state-label rail-empty">+${secondary.length - 5} more</td><td></td></tr>`);
  }
  tableEl.innerHTML = rows.join('');
}

function renderInvariants(listEl) {
  const pg = window.playground;
  let invs = [];
  try {
    invs = pg && typeof pg.getInvariants === 'function' ? pg.getInvariants() : [];
    if (!Array.isArray(invs)) invs = [];
  } catch { invs = []; }

  if (invs.length === 0) {
    listEl.innerHTML = '<li class="rail-empty t-small">No invariants registered</li>';
    return;
  }
  listEl.innerHTML = invs.map((inv) => {
    const status = inv.status === 'pass' || inv.status === 'drift' || inv.status === 'pending'
      ? inv.status : 'pending';
    const val = Number.isFinite(inv.value) ? inv.value.toExponential(2) : '';
    return `<li class="invariant invariant--${status}">`
      + '<span class="invariant-dot"></span>'
      + `<span class="invariant-label">${escapeHtml(inv.label || inv.key)}</span>`
      + `<span class="invariant-value">${escapeHtml(val)}</span></li>`;
  }).join('');
}

function renderReferences(section, listEl, refs) {
  if (!refs || refs.length === 0) {
    section.hidden = true;            // 7.6: no references -> render nothing
    return;
  }
  section.hidden = false;
  listEl.innerHTML = refs.map((r) => `<li class="t-small">${escapeHtml(r)}</li>`).join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

// ---- mount + update loop ------------------------------------------------
export function mountRail() {
  const rail = document.querySelector('.playground-rail');
  if (!rail) return;
  const stateTable = rail.querySelector('.rail-state-table');
  const invarList = rail.querySelector('.rail-invariants-list');
  const refSection = rail.querySelector('.rail-references');
  const refList = rail.querySelector('.rail-references-list');

  if (refSection && refList) {
    loadReferences().then((refs) => renderReferences(refSection, refList, refs));
  }

  let lastState = 0, lastInvar = 0;
  function tick(now) {
    if (document.visibilityState === 'visible') {
      if (stateTable && now - lastState >= 1000 / STATE_HZ) {
        renderState(stateTable);
        lastState = now;
      }
      if (invarList && now - lastInvar >= 1000 / INVAR_HZ) {
        renderInvariants(invarList);
        lastInvar = now;
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountRail, { once: true });
  } else {
    mountRail();
  }
}

// Exposed for tests.
export const _internal = { formatValue, labelFor };
