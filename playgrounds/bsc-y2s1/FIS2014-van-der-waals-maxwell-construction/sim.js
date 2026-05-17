// Van der Waals fluid in reduced (critical) units. The reduced equation
// of state is
//   p = 8 T / (3 V - 1) - 3 / V^2 ,
// with the critical point at V = T = p = 1. Below T = 1 the isotherm is
// the non-monotonic S-curve; the physical coexistence pressure is fixed
// by the Maxwell equal-area construction. The area integral of the
// reduced EOS is closed form, and the binodal volumes are found by
// spinodal-bracketed monotone bisection (no cubic-root branch cases).
// Headless and deterministic. Reference: Callen, Thermodynamics,
// 2nd ed., Sec. 3.6 and Problem 9.4-1 (`callen`).

export function pVdW(V, T) { return 8 * T / (3 * V - 1) - 3 / (V * V); }
export function dpdV(V, T) { return -24 * T / ((3 * V - 1) ** 2) + 6 / (V ** 3); }
export function d2pdV2(V, T) { return 144 * T / ((3 * V - 1) ** 3) - 18 / (V ** 4); }
export function criticalPoint() { return { Vc: 1, Tc: 1, pc: 1 }; }

// Antiderivative of p dV: (8T/3) ln(3V-1) + 3/V.
function intP(V, T) { return (8 * T / 3) * Math.log(3 * V - 1) + 3 / V; }

function bisectRoot(f, a, b, iters = 80) {
  let fa = f(a);
  for (let i = 0; i < iters; i += 1) {
    const m = 0.5 * (a + b), fm = f(m);
    if (fa === 0) return a;
    if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
  }
  return 0.5 * (a + b);
}

// Spinodal volumes for T < 1: the two roots of dp/dV = 0, i.e.
// (3V-1)^2 = 4 T V^3, one on the liquid branch (1/3, 1), one on the
// gas branch (1, infinity).
export function spinodal(T) {
  if (T >= 1) return null;
  const g = (V) => (3 * V - 1) ** 2 - 4 * T * V ** 3;
  return { Vsl: bisectRoot(g, 1 / 3 + 1e-7, 1, 140), Vsg: bisectRoot(g, 1, 80, 140) };
}

const _mxCache = new Map();
// Maxwell construction at T < 1. p is monotone on each metastable
// branch, so for a trial coexistence pressure pco the liquid root sits
// in (1/3, Vsl) and the gas root in (Vsg, large); bisect pco until the
// closed-form signed area over [Vl, Vg] vanishes (equal areas). Returns
// null for T >= 1 (single phase). Cached on T to 1e-4.
export function maxwell(T) {
  if (T >= 1) return null;
  const key = Math.round(T * 1e4);
  if (_mxCache.has(key)) return _mxCache.get(key);
  const sp = spinodal(T);
  const pMin = pVdW(sp.Vsl, T), pMax = pVdW(sp.Vsg, T);
  let lo = Math.max(1e-6, pMin) + 1e-9, hi = pMax - 1e-9;
  let res = null;
  for (let it = 0; it < 90; it += 1) {
    const pco = 0.5 * (lo + hi);
    const Vl = bisectRoot(V => pVdW(V, T) - pco, 1 / 3 + 1e-7, sp.Vsl, 90);
    const Vg = bisectRoot(V => pVdW(V, T) - pco, sp.Vsg, 400, 90);
    const a = intP(Vg, T) - intP(Vl, T) - pco * (Vg - Vl);
    res = { pco, Vl, Vg, Vsl: sp.Vsl, Vsg: sp.Vsg, area: a };
    if (a > 0) lo = pco; else hi = pco;
  }
  _mxCache.set(key, res);
  return res;
}

// Lever rule: liquid mass fraction at (V, T). 1 below the binodal
// liquid volume, 0 above the gas volume, linear in between.
export function liquidFraction(V, T) {
  const m = maxwell(T);
  if (!m) return V < 1 ? 1 : 0;
  if (V <= m.Vl) return 1;
  if (V >= m.Vg) return 0;
  return (m.Vg - V) / (m.Vg - m.Vl);
}

// Pressure actually observed: flat at pco inside the coexistence
// window, the bare EOS outside it.
export function observedP(V, T) {
  const m = maxwell(T);
  if (m && V > m.Vl && V < m.Vg) return m.pco;
  return pVdW(V, T);
}
