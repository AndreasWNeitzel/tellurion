// sim.js
// The intermediate value theorem made constructive. If f is continuous on [a, b]
// and f(a), f(b) have opposite signs, the IVT guarantees a root in between.
// Bisection turns the existence proof into an algorithm: evaluate the midpoint,
// keep the half that still shows the sign change, and repeat. The bracket width
// halves every step, w_k = (b0 - a0) / 2^k, so the root is found to any tolerance
// in a number of steps that grows only logarithmically.
//
// Reference: Rudin, Principles of Mathematical Analysis, 3rd ed., Thm. 4.23 (the
// IVT); Burden and Faires, Numerical Analysis, 9th ed., Sec. 2.1 (bisection).

export const FUNCS = {
  cubic: { label: 'x^3 - x - 2', f: (x) => x * x * x - x - 2, dom: [0, 2.6], yr: [-3.4, 4.6], a0: 0.5, b0: 2.2, root: 1.5213797068045676 },
  cosx: { label: 'cos x - x', f: (x) => Math.cos(x) - x, dom: [-0.4, 2.0], yr: [-2.6, 1.5], a0: 0, b0: 1.6, root: 0.7390851332151607 },
  sqrt2: { label: 'x^2 - 2', f: (x) => x * x - 2, dom: [0, 2.6], yr: [-2.6, 4.8], a0: 0.6, b0: 2.3, root: Math.SQRT2 },
  wobble: { label: 'sin(3x) - 0.4x', f: (x) => Math.sin(3 * x) - 0.4 * x, dom: [0.2, 3.2], yr: [-1.8, 1.0], a0: 0.6, b0: 1.6, root: 0.9213805136911106 },
};

export function bracketsRoot(fn, a, b) { return fn.f(a) * fn.f(b) <= 0; }
export function width(s) { return Math.abs(s.b - s.a); }
export function midpoint(s) { return 0.5 * (s.a + s.b); }

// one bisection step: keep the half that still shows the sign change.
export function bisectStep(fn, s) {
  const m = 0.5 * (s.a + s.b);
  if (fn.f(s.a) * fn.f(m) <= 0) return { a: s.a, b: m, m };
  return { a: m, b: s.b, m };
}

// run to a tolerance, returning the history of midpoints, widths and |f(m)|.
export function run(fn, a0, b0, tol = 1e-7, maxIter = 60) {
  let s = { a: a0, b: b0 }; const hist = [];
  for (let k = 0; k < maxIter && width(s) > tol; k += 1) { s = bisectStep(fn, s); hist.push({ k: k + 1, m: s.m, w: width(s), fm: Math.abs(fn.f(s.m)) }); }
  return { root: midpoint(s), steps: hist.length, hist };
}
