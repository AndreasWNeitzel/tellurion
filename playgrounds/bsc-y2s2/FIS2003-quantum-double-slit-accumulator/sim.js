// Quantum double slit. Far-field probability density on the screen is
// the single-slit envelope times the two-slit fringe term modulated by
// the which-path coherence gamma in [0, 1]:
//   P(y) ~ sinc^2(pi a y / (lambda L)) * (1 + gamma cos(2 pi d y / (lambda L))).
// gamma = 1 (no detector) gives full-visibility fringes of spacing
// dy = lambda L / d; gamma = 0 (perfect which-path) erases them,
// leaving the single-slit envelope. Particles arrive one at a time,
// each position drawn from P(y) by the Born rule (seeded inverse-CDF
// sampling). Headless and deterministic. Reference: Eisberg and
// Resnick, Quantum Physics of Atoms (2nd ed.), Ch. 3 and 5.

import { makeRng } from '../../../shared/js/render/rng.js';

function sinc(x) { return Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x; }

export function intensity(y, P) {
  const { lambda, L, d, a, gamma } = P;
  const env = sinc(Math.PI * a * y / (lambda * L)) ** 2;
  const fr = 1 + gamma * Math.cos(2 * Math.PI * d * y / (lambda * L));
  return env * fr;
}

export function fringeSpacing(P) { return P.lambda * P.L / P.d; }
export function envelopeFirstMin(P) { return P.lambda * P.L / P.a; }

// Build a normalised cumulative distribution of P(y) on [-Y, Y].
function buildCdf(P, Y, n = 4000) {
  const ys = new Float64Array(n + 1), cdf = new Float64Array(n + 1);
  let acc = 0;
  for (let i = 0; i <= n; i += 1) {
    const y = -Y + (2 * Y * i) / n;
    ys[i] = y;
    if (i > 0) acc += 0.5 * (intensity(ys[i - 1], P) + intensity(y, P)) * (2 * Y / n);
    cdf[i] = acc;
  }
  for (let i = 0; i <= n; i += 1) cdf[i] /= acc;
  return { ys, cdf };
}

// One-at-a-time Born sampling: n screen positions drawn from P(y).
export function sampleScreen(P, n, Y, seed = 0xC0FFEE) {
  const rng = makeRng(seed), { ys, cdf } = buildCdf(P, Y);
  const out = new Float64Array(n);
  for (let k = 0; k < n; k += 1) {
    const u = rng();
    let lo = 0, hi = cdf.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cdf[mid] < u) lo = mid; else hi = mid; }
    const t = (u - cdf[lo]) / Math.max(1e-12, cdf[hi] - cdf[lo]);
    out[k] = ys[lo] + t * (ys[hi] - ys[lo]);
  }
  return out;
}

export function histogram(samples, bins, Y) {
  const h = new Float64Array(bins);
  for (const y of samples) { const b = Math.floor(((y + Y) / (2 * Y)) * bins); if (b >= 0 && b < bins) h[b] += 1; }
  return h;
}

// Fringe visibility: the contrast between the central fringe maximum
// (y = 0) and the adjacent fringe minimum (y = dy/2), half a fringe
// apart so the slowly varying envelope is essentially equal at both
// points and only the fringe term contributes (V -> gamma).
export function visibility(P) {
  const dy = fringeSpacing(P);
  const Imax = intensity(0, P), Imin = intensity(dy / 2, P);
  return (Imax - Imin) / (Imax + Imin + 1e-300);
}

// Analytic cumulative distribution F(y) on [-Y, Y], by trapezoidal
// integration of P(y). Binning-free reference for the Born sampler.
export function cdf(y, P, Y, n = 8000) {
  const h = 2 * Y / n;
  let acc = 0, target = 0, prev = intensity(-Y, P);
  for (let i = 1; i <= n; i += 1) {
    const yi = -Y + i * h, cur = intensity(yi, P);
    acc += 0.5 * (prev + cur) * h;
    if (yi <= y) target = acc;
    prev = cur;
  }
  return acc > 0 ? target / acc : 0;
}
