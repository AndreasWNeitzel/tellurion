// shared/js/render/vertical-layout.js
//
// Vertical-composition helper for the 4:5 portrait makeover. It does two
// jobs that keep 300+ reworks consistent and free of stretching:
//
//   1. stack(): split a portrait canvas into named regions stacked top to
//      bottom (scene, an optional plot band, an optional readout strip),
//      with one shared outer margin and inter-region gap. Playgrounds draw
//      each part into its region instead of inventing their own geometry.
//
//   2. fit(): map a physical domain into a region with a SINGLE isotropic
//      scale (equal x and y), so a circle stays a circle and a square
//      lattice stays square on the taller canvas. This is the anti-stretch
//      guarantee.
//
// Coordinates are in the canvas's own pixel space (canvas.width x
// canvas.height), matching the unscaled-context convention used across the
// repo. Pass canvas.width/canvas.height, never hardcoded numbers, so a
// resize re-flows automatically.

// Default outer margin and gap as a fraction of the canvas width, so they
// scale with the canvas. Override per playground if needed.
const MARGIN_FRAC = 0.035;
const GAP_FRAC = 0.03;

// setupCanvas(canvas, ctx) -> { w, h, dpr }
// Switch a canvas to display-resolution rendering. A canvas authored with a
// fixed internal resolution (e.g. width="760") but shown at 370 px on a phone
// renders every line and glyph at half size, which is why canvas text sized by
// canvas-type.js (from clientWidth) looks correct on a laptop and shrinks to
// ~6 px on a phone. This sets the backing store to clientWidth/Height x dpr
// (dpr capped at 2 to bound fill cost), scales the 2D context so all drawing
// happens in CSS-pixel coordinates, and returns the logical drawing size. Pass
// the returned { w, h } to stack() via { width: w, height: h }; re-run on
// resize, then re-layout and redraw. fontString() then renders at its intended
// on-screen size on every device, as its own header documents for a
// pre-scaled context.
export function setupCanvas(canvas, ctx) {
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  const cssW = Math.round(canvas.clientWidth) || canvas.width;
  const cssH = Math.round(canvas.clientHeight) || canvas.height;
  canvas.width = Math.max(1, Math.round(cssW * dpr));
  canvas.height = Math.max(1, Math.round(cssH * dpr));
  const c = ctx || canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w: cssW, h: cssH, dpr };
}

// stack(canvas, regions, opts) -> { name: {x, y, w, h}, ... }
// `canvas` may be the real canvas or any { width, height } view object (use
// the { w, h } from setupCanvas as { width, height } when drawing in logical
// CSS-pixel coordinates).
// regions: array of { name, weight } sharing the leftover height by weight,
// and/or { name, px } for a fixed pixel height (e.g. a readout strip).
// Fixed-height regions are allocated first; the rest split the remainder by
// weight, top to bottom.
export function stack(canvas, regions, opts = {}) {
  const W = canvas.width, H = canvas.height;
  const m = opts.margin != null ? opts.margin : Math.round(W * MARGIN_FRAC);
  const gap = opts.gap != null ? opts.gap : Math.round(W * GAP_FRAC);
  const innerW = W - 2 * m;
  const n = regions.length;
  const totalGap = gap * (n - 1);
  const fixed = regions.reduce((s, r) => s + (r.px || 0), 0);
  const flexH = Math.max(0, H - 2 * m - totalGap - fixed);
  const totalWeight = regions.reduce((s, r) => s + (r.px ? 0 : (r.weight || 0)), 0) || 1;
  const out = {};
  let y = m;
  for (const r of regions) {
    const h = r.px != null ? r.px : Math.round(flexH * (r.weight || 0) / totalWeight);
    out[r.name] = { x: m, y, w: innerW, h };
    y += h + gap;
  }
  return out;
}

// fit(region, domainW, domainH, opts) -> mapping that preserves aspect.
// Returns { scale, ox, oy, x(u), y(v), s(d) } where x/y map domain
// coordinates (0..domainW, 0..domainH) into the region, centred, with equal
// scale on both axes (letterboxed inside the region). opts.pad shrinks the
// usable region uniformly. opts.flipY maps domain-up to screen-up.
export function fit(region, domainW, domainH, opts = {}) {
  const pad = opts.pad || 0;
  const w = region.w - 2 * pad, h = region.h - 2 * pad;
  const scale = Math.min(w / domainW, h / domainH);
  const drawW = domainW * scale, drawH = domainH * scale;
  const ox = region.x + pad + (w - drawW) / 2;
  const oy = region.y + pad + (h - drawH) / 2;
  const flip = !!opts.flipY;
  return {
    scale, ox, oy,
    x: (u) => ox + u * scale,
    y: (v) => flip ? oy + drawH - v * scale : oy + v * scale,
    s: (d) => d * scale,
  };
}

// clipTo(ctx, region): clip subsequent drawing to a region. Caller wraps in
// ctx.save()/ctx.restore().
export function clipTo(ctx, region) {
  ctx.beginPath();
  ctx.rect(region.x, region.y, region.w, region.h);
  ctx.clip();
}
