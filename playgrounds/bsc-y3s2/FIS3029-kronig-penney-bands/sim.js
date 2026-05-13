// sim.js
// Kronig-Penney model in the delta-comb limit.
//
// A 1D crystal: V(x) = (hbar^2 P / m a) sum_n delta(x - n a). The dispersion
// relation for Bloch states is (Ashcroft & Mermin 1976, Eq. 8.7):
//
//   cos(k a) = cos(q a) + (P / (q a)) sin(q a),  q = sqrt(2 m E) / hbar
//
// with dimensionless strength P. The right-hand side is a transcendental
// function f(q a) = cos(q a) + (P / (q a)) sin(q a). Energies for which
// f lies outside [-1, +1] are forbidden (band gaps); energies inside the
// band give a real k a.
//
// We use units hbar^2 / (2 m a^2) = 1, so the dimensionless energy
// epsilon = E (2 m a^2 / hbar^2) = (q a)^2.
//
// Reference: Shankar 1994, PQM 2e, Section 19.3 (`shankar1994`); Ashcroft &
// Mermin 1976, Solid State Physics, Chapter 8.

export function fKP(qa, P) {
  if (qa === 0) return 1 + P;
  return Math.cos(qa) + (P / qa) * Math.sin(qa);
}

// Inverse: given epsilon (= (qa)^2), return k a or NaN if forbidden.
// k a = acos(fKP(qa, P)) in [0, pi].
export function kaForEnergy(epsilon, P) {
  if (epsilon <= 0) return NaN;
  const qa = Math.sqrt(epsilon);
  const f = fKP(qa, P);
  if (f < -1 || f > 1) return NaN;
  return Math.acos(f);
}

// Build allowed-band intervals in epsilon for a given P.
// We scan epsilon in [0, eMax] and locate intervals where |f| <= 1.
export function bandIntervals(P, eMax = 80, nSamples = 4000) {
  const eps = new Float64Array(nSamples);
  const fs = new Float64Array(nSamples);
  for (let i = 0; i < nSamples; i += 1) {
    eps[i] = eMax * (i / (nSamples - 1));
    fs[i] = fKP(Math.sqrt(Math.max(0, eps[i])), P);
  }
  const intervals = [];
  let inBand = Math.abs(fs[0]) <= 1;
  let start = inBand ? eps[0] : NaN;
  for (let i = 1; i < nSamples; i += 1) {
    const allowed = Math.abs(fs[i]) <= 1;
    if (allowed && !inBand) {
      // Entered band; refine boundary by bisection.
      let lo = eps[i - 1], hi = eps[i];
      for (let it = 0; it < 30; it += 1) {
        const mid = 0.5 * (lo + hi);
        const fm = fKP(Math.sqrt(mid), P);
        if (Math.abs(fm) > 1) lo = mid; else hi = mid;
      }
      start = 0.5 * (lo + hi);
      inBand = true;
    } else if (!allowed && inBand) {
      let lo = eps[i - 1], hi = eps[i];
      for (let it = 0; it < 30; it += 1) {
        const mid = 0.5 * (lo + hi);
        const fm = fKP(Math.sqrt(mid), P);
        if (Math.abs(fm) <= 1) lo = mid; else hi = mid;
      }
      const end = 0.5 * (lo + hi);
      intervals.push([start, end]);
      inBand = false;
    }
  }
  if (inBand) intervals.push([start, eps[nSamples - 1]]);
  return intervals;
}

// E(k) dispersion curves in the reduced-zone scheme. For each band index
// i = 0, 1, 2, ..., return an array of (ka, epsilon) sampling the band.
export function dispersionCurves(P, nBands = 5, nSamples = 100) {
  const intervals = bandIntervals(P, 200);
  const curves = [];
  for (let b = 0; b < Math.min(nBands, intervals.length); b += 1) {
    const [eMin, eMax] = intervals[b];
    const pts = [];
    for (let i = 0; i < nSamples; i += 1) {
      const eps = eMin + (eMax - eMin) * (i / (nSamples - 1));
      const ka = kaForEnergy(eps, P);
      if (Number.isFinite(ka)) {
        // Alternate band sense: band b at ka = 0 has epsilon = eMin if b is even, eMax if b is odd
        // (lowest band has min at k = 0; second band has min at k = pi; etc.)
        const effectiveKa = (b % 2 === 0) ? ka : (Math.PI - ka);
        pts.push([effectiveKa, eps]);
      }
    }
    pts.sort((a, b2) => a[0] - b2[0]);
    curves.push(pts);
  }
  return curves;
}
