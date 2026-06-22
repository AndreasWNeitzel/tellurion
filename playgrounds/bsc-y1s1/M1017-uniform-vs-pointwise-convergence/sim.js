// sim.js
// Uniform versus pointwise convergence of a function sequence f_n. Pointwise
// convergence means f_n(x) -> f(x) at every fixed x; uniform convergence is the
// stronger statement that the worst-case gap, the sup-norm ||f_n - f||_inf, goes
// to zero. The two differ: f_n can settle at every point while a bump of fixed or
// even growing height slides along and keeps the sup-norm away from zero. Uniform
// limits inherit continuity; pointwise limits need not (x^n on [0,1] limits to a
// discontinuous step).
//
// Reference: Rudin, Principles of Mathematical Analysis, 3rd ed., Sec. 7.1-7.2;
// Abbott, Understanding Analysis, 2nd ed., Sec. 6.2.

export const FUNCS = {
  power: { label: 'f_n = x^n on [0,1]', dom: [0, 1], yr: [-0.05, 1.12], fn: (x, n) => Math.pow(Math.max(0, x), n), flim: (x) => (x >= 0.99999 ? 1 : 0), uniform: false, note: 'discontinuous limit' },
  witch: { label: 'f_n = 2nx/(1+(nx)^2)', dom: [0, 2], yr: [-0.05, 1.25], fn: (x, n) => 2 * n * x / (1 + (n * x) * (n * x)), flim: () => 0, uniform: false, note: 'sliding bump, height 1' },
  tall: { label: 'f_n = n x e^(-n x^2)', dom: [0, 2], yr: [-0.05, 2.7], fn: (x, n) => n * x * Math.exp(-n * x * x), flim: () => 0, uniform: false, note: 'growing bump, sup -> inf' },
  ramp: { label: 'f_n = x / n on [0,2]', dom: [0, 2], yr: [-0.05, 2.15], fn: (x, n) => x / n, flim: () => 0, uniform: true, note: 'whole curve flattens' },
};

// the sup-norm ||f_n - f||_inf over the domain, by dense sampling, with the
// argmax position returned for the gap marker.
export function supNorm(key, n, samples = 2000) {
  const f = FUNCS[key]; const [a, b] = f.dom; let m = 0, xm = a;
  for (let i = 0; i <= samples; i += 1) { const x = a + (b - a) * i / samples; const d = Math.abs(f.fn(x, n) - f.flim(x)); if (d > m) { m = d; xm = x; } }
  return { sup: m, x: xm };
}
