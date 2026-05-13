// sim.js
// Mandelbrot escape-time core. Pure scalar iteration z_{n+1} = z_n^2 + c
// from z_0 = 0. Returns the smooth iteration count at escape, or maxIter
// for set members. maxIter is a per-call parameter so the renderer can
// scale it with zoom depth (auto-zoom needs ~ 1500 iterations near the
// boundary, the default 256 is too shallow).

export const DEFAULT_MAX_ITER = 256;
export const ESCAPE_R2 = 4;

// Cardioid and period-2 bulb tests: c values inside either are guaranteed
// to be in the set, so we short-circuit and skip the iteration loop. This
// is a tenfold speedup near the bulb edges where most pixels live.
function inMainCardioid(cr, ci) {
  const q = (cr - 0.25) * (cr - 0.25) + ci * ci;
  return q * (q + (cr - 0.25)) < 0.25 * ci * ci;
}
function inPeriod2Bulb(cr, ci) {
  const dx = cr + 1;
  return dx * dx + ci * ci < 0.0625;             // 1/16
}

// Escape time at c = (cr, ci). Returns { iter, mu } where mu is the smooth
// iteration count mu = iter + 1 - log2(log2(|z|)) on escape; mu = maxIter
// for set members.
export function escapeTime(cr, ci, maxIter = DEFAULT_MAX_ITER) {
  if (inMainCardioid(cr, ci) || inPeriod2Bulb(cr, ci)) {
    return { iter: maxIter, mu: maxIter };
  }
  let zr = 0, zi = 0;
  for (let n = 0; n < maxIter; n += 1) {
    const zr2 = zr * zr;
    const zi2 = zi * zi;
    if (zr2 + zi2 > ESCAPE_R2) {
      const absZ = Math.sqrt(zr2 + zi2);
      const mu = n + 1 - Math.log2(Math.log2(absZ));
      return { iter: n, mu };
    }
    const newR = zr2 - zi2 + cr;
    const newI = 2 * zr * zi + ci;
    zr = newR;
    zi = newI;
  }
  return { iter: maxIter, mu: maxIter };
}

export function escapeIterations(cr, ci, maxIter = DEFAULT_MAX_ITER) {
  return escapeTime(cr, ci, maxIter).iter;
}

// Default zoom targets known to be visually rich. Used by the auto-zoom
// presets and the capture sweep.
export const ZOOM_TARGETS = {
  seahorse:    { cx: -0.7269,            cy:  0.1889,            label: 'Seahorse Valley',           width: 0.20 },
  spiral:      { cx: -0.745428,          cy:  0.113009,          label: 'Spiral on the boundary',    width: 0.04 },
  satellite:   { cx: -1.769383179195515, cy:  0.004236847918737,  label: 'Satellite mini-Mandelbrot', width: 0.025 },
  elephant:    { cx:  0.2741,            cy:  0.00488,           label: 'Elephant Valley',           width: 0.06 },
  triplecusp:  { cx: -0.0852,            cy:  0.65126,           label: 'Triple-spiral cusp',        width: 0.06 },
  misiurewicz: { cx: -0.77568377,        cy:  0.13646737,        label: 'Misiurewicz point',         width: 0.02 },
};

// Adaptive iteration count given the view width. Wider views need fewer
// iterations; deep zooms need more. Capped at 1500 so deep-zoom frames stay
// interactive; the cap shows as a flatter rainbow on extreme zoom but the
// boundary structure still resolves.
export function maxIterForWidth(width) {
  const depth = Math.max(0, Math.log10(3.5 / width));   // 0 at full view
  return Math.min(1500, Math.round(256 + 180 * depth));
}
