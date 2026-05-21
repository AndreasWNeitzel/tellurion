// shared/js/canvas-type.js
// Canvas typography module for the Playground Layout System v2.
//
// This module is the ONLY sanctioned way to size text drawn inside a
// canvas. No playground may assign a literal pixel size to ctx.font;
// the gate lint enforces this. Every canvas text role has a base size
// (at a 600 px reference canvas) and is scaled by the square root of
// the canvas CSS width, then clamped to a role-specific [min, max].
//
// DEVICE PIXEL RATIO
// ------------------
// Sizes are computed from canvas.clientWidth (CSS pixels), and
// fontString() returns a CSS-pixel size. If the 2D context has been
// pre-scaled with ctx.scale(dpr, dpr) the returned string renders
// correctly as-is. If the context is NOT pre-scaled and the canvas is
// at internal resolution canvas.width = clientWidth * dpr, the caller
// must scale the size itself, e.g.:
//
//   const dpr = window.devicePixelRatio || 1;
//   const px = fontSize(canvas, 'tick') * dpr;
//   ctx.font = `${px}px ${family}`;
//
// Most Canvas2D playgrounds in this repo use an unscaled context whose
// coordinate space equals canvas.width x canvas.height; for those,
// setCanvasFont() and textWithMargin() work directly.

// 5.1 role table (frozen: do not add roles).
const ROLES = {
  title:   { base: 18, min: 16, max: 24 },
  heading: { base: 15, min: 13, max: 20 },
  body:    { base: 13, min: 12, max: 17 },
  caption: { base: 12, min: 11, max: 16 },
  legend:  { base: 12, min: 11, max: 16 },
  mono:    { base: 12, min: 11, max: 16 },
  tick:    { base: 11, min: 10, max: 14 },
  badge:   { base: 10, min: 10, max: 13 },
};
const REF_WIDTH = 600;
// Floors applied when a canvas carries data-plot-role="diagnostic".
const DIAGNOSTIC_FLOORS = { tick: 11, caption: 12, heading: 13 };

function clampN(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Resolved at module init from CSS custom properties (browser only).
let FONT_SANS = '"Inter", system-ui, -apple-system, sans-serif';
let FONT_MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';

// 5.2: allowed canvas text colors, pulled from CSS at init.
export const COLORS = {
  primary:   '#1A1B1C',
  secondary: '#5C5E61',
  dimmed:    '#6E7073',
};

function readTokens() {
  if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') return;
  const cs = getComputedStyle(document.documentElement);
  const sans = cs.getPropertyValue('--font-sans').trim();
  const mono = cs.getPropertyValue('--font-mono').trim();
  if (sans) FONT_SANS = sans;
  if (mono) FONT_MONO = mono;
  const fg = cs.getPropertyValue('--fg').trim();
  const fgMuted = cs.getPropertyValue('--fg-muted').trim();
  const fgFaint = cs.getPropertyValue('--fg-faint').trim();
  if (fg) COLORS.primary = fg;
  if (fgMuted) COLORS.secondary = fgMuted;
  if (fgFaint) COLORS.dimmed = fgFaint;
}
readTokens();

// CSS-pixel font size for a role on this canvas.
// size = clamp(min, base * sqrt(cssWidth / 600), max), with the
// diagnostic-canvas floors applied afterward.
export function fontSize(canvas, role) {
  const r = ROLES[role];
  if (!r) throw new Error(`canvas-type: unknown role "${role}"`);
  const cssW = (canvas && canvas.clientWidth) || (canvas && canvas.width) || REF_WIDTH;
  let size = clampN(r.base * Math.sqrt(cssW / REF_WIDTH), r.min, r.max);
  const plotRole = canvas && canvas.dataset && canvas.dataset.plotRole;
  if (plotRole === 'diagnostic') {
    const floor = DIAGNOSTIC_FLOORS[role];
    if (floor !== undefined) size = Math.max(size, floor);
  }
  return size;
}

// Complete ctx.font string. family is 'sans' | 'mono'; weight 400/500/600.
export function fontString(canvas, role, family = 'sans', weight = 400) {
  const size = fontSize(canvas, role);
  const stack = family === 'mono' ? FONT_MONO : FONT_SANS;
  return `${weight} ${size.toFixed(1)}px ${stack}`;
}

// Set ctx.font, ctx.fillStyle and ctx.textBaseline in one call.
// opts: { color, baseline, align, weight, family }.
export function setCanvasFont(ctx, canvas, role, opts = {}) {
  ctx.font = fontString(canvas, role, opts.family || 'sans', opts.weight || 400);
  if (opts.color) ctx.fillStyle = opts.color;
  ctx.textBaseline = opts.baseline || 'alphabetic';
  if (opts.align) ctx.textAlign = opts.align;
}

// Draw text inset from a named anchor by at least fontSize * 0.8.
// anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
//       | 'top-center' | 'bottom-center'.
// Assumes an unscaled context (coordinate space = canvas.width x height).
export function textWithMargin(ctx, canvas, str, role, anchor, opts = {}) {
  setCanvasFont(ctx, canvas, role, opts);
  const pad = fontSize(canvas, role) * 0.8;
  const W = canvas.width, H = canvas.height;
  let x, y;
  switch (anchor) {
    case 'top-left':      x = pad;       y = pad;       ctx.textAlign = 'left';   ctx.textBaseline = 'top';    break;
    case 'top-right':     x = W - pad;   y = pad;       ctx.textAlign = 'right';  ctx.textBaseline = 'top';    break;
    case 'bottom-left':   x = pad;       y = H - pad;   ctx.textAlign = 'left';   ctx.textBaseline = 'bottom'; break;
    case 'bottom-right':  x = W - pad;   y = H - pad;   ctx.textAlign = 'right';  ctx.textBaseline = 'bottom'; break;
    case 'top-center':    x = W / 2;     y = pad;       ctx.textAlign = 'center'; ctx.textBaseline = 'top';    break;
    case 'bottom-center': x = W / 2;     y = H - pad;   ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; break;
    default: throw new Error(`canvas-type: unknown anchor "${anchor}"`);
  }
  ctx.fillText(str, x, y);
}

// Subscribe to canvas CSS-size changes. callback(newCSSWidth,
// newCSSHeight). Returns an unsubscribe function. Used to regenerate
// WebGL2 label textures and to re-paint Canvas2D scenes on focus-mode
// transitions.
export function onCanvasResize(canvas, callback) {
  if (typeof ResizeObserver === 'undefined') return () => {};
  let lastW = canvas.clientWidth, lastH = canvas.clientHeight;
  const ro = new ResizeObserver(() => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w !== lastW || h !== lastH) {
      lastW = w; lastH = h;
      callback(w, h);
    }
  });
  ro.observe(canvas);
  return () => ro.disconnect();
}

// Exposed for tests and tooling.
export const _ROLES = ROLES;
export const _REF_WIDTH = REF_WIDTH;
