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
  seahorse:    { cx: -0.7269,            cy:  0.1889,            label: 'Seahorse Valley' },
  spiral:      { cx: -0.745428,          cy:  0.113009,          label: 'Spiral on the boundary' },
  satellite:   { cx: -0.748,             cy:  0.1,               label: 'Satellite copy' },
  elephant:    { cx:  0.27322626,        cy:  0.00592323,        label: 'Elephant Valley' },
  triplecusp:  { cx: -0.10109636,        cy:  0.95628651,        label: 'Triple-spiral cusp' },
  // The "valley of double seahorses" near a Misiurewicz point. Always
  // visually striking under exponential zoom.
  misiurewicz: { cx: -1.7693831791955150, cy: 0.0042368479187367, label: 'Misiurewicz point' },
};

// Adaptive iteration count given the view width. Wider views need fewer
// iterations; deep zooms need many more. The formula is calibrated so the
// default 3.5 view uses 256 iterations and a 1e-9 zoom uses ~ 2200.
export function maxIterForWidth(width) {
  const depth = Math.max(0, Math.log10(3.5 / width));   // 0 at full view, log10 at zoom
  return Math.round(256 + 220 * depth);
}
