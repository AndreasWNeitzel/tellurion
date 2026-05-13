// sim.js
// Mandelbrot escape-time core. Pure scalar iteration z_{n+1} = z_n^2 + c.
// Returns the smooth iteration count at escape, or MAX_ITER for set members.

export const MAX_ITER = 256;
export const ESCAPE_R2 = 4;

// Escape time at complex parameter c = (cr, ci). Returns
//   { iter, mu }
// where iter is the integer iteration count at escape (or MAX_ITER) and mu is
// the smooth iteration count (mu = iter + 1 - log2(log2(|z|))) when escape occurred.
// For set members (no escape) mu === MAX_ITER.
export function escapeTime(cr, ci) {
  let zr = 0, zi = 0;
  for (let n = 0; n < MAX_ITER; n += 1) {
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
  return { iter: MAX_ITER, mu: MAX_ITER };
}

// Same as escapeTime but returns just the integer iter (used for invariant tests).
export function escapeIterations(cr, ci) {
  let zr = 0, zi = 0;
  for (let n = 0; n < MAX_ITER; n += 1) {
    const zr2 = zr * zr;
    const zi2 = zi * zi;
    if (zr2 + zi2 > ESCAPE_R2) return n;
    const newR = zr2 - zi2 + cr;
    const newI = 2 * zr * zi + ci;
    zr = newR;
    zi = newI;
  }
  return MAX_ITER;
}

// Render a width x height grid of escape iterations into a Uint16Array. Used by
// the headless tests; the playground renders directly into ImageData.
export function renderGrid(cx, cy, width, viewWidth, viewHeight) {
  const out = new Uint16Array(width * viewHeight);
  for (let py = 0; py < viewHeight; py += 1) {
    const ci = cy + (0.5 - py / viewHeight) * width * (viewHeight / width);
    for (let px = 0; px < width; px += 1) {
      const cr = cx + (px / width - 0.5) * width;
      out[py * width + px] = escapeIterations(cr, ci);
    }
  }
  return out;
}
