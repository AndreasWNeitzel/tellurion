// sim.js
// The Riemann sum converging to the definite integral. Partition [a, b] into n
// subintervals of width h = (b - a)/n and add up f at a sample point times h:
//   S_n = sum f(x_i*) h  ->  integral_a^b f dx  as n -> infinity.
// The sample point sets the rule: left or right endpoint (first-order accurate,
// error ~ C/n), midpoint or trapezoid (second-order, error ~ C/n^2). The
// playground compares the rules and their convergence rates against the exact
// integral.
//
// Reference: Stewart, Calculus, 8e, Sec. 5.2 (the definite integral) and 7.7
// (approximate integration, the error bounds).

export const FUNCS = {
  quad: { label: 'f = x^2 on [0, 2]', f: (x) => x * x, a: 0, b: 2, exact: 8 / 3 },
  sine: { label: 'f = sin x on [0, pi]', f: (x) => Math.sin(x), a: 0, b: Math.PI, exact: 2 },
  exp: { label: 'f = e^x on [0, 1.5]', f: (x) => Math.exp(x), a: 0, b: 1.5, exact: Math.exp(1.5) - 1 },
  arctan: { label: 'f = 1/(1+x^2) on [-2, 2]', f: (x) => 1 / (1 + x * x), a: -2, b: 2, exact: 2 * Math.atan(2) },
};

export const RULES = ['left', 'right', 'midpoint', 'trapezoid'];

// Sample point x_i* (or the trapezoid average) and the cell sum.
export function sample(func, rule, a, h, i) {
  const { f } = func;
  if (rule === 'left') return f(a + i * h);
  if (rule === 'right') return f(a + (i + 1) * h);
  if (rule === 'midpoint') return f(a + (i + 0.5) * h);
  return 0.5 * (f(a + i * h) + f(a + (i + 1) * h));   // trapezoid
}

export function riemannSum(func, n, rule) {
  const { a, b } = func; const h = (b - a) / n; let s = 0;
  for (let i = 0; i < n; i += 1) s += sample(func, rule, a, h, i);
  return s * h;
}

export function error(func, n, rule) { return Math.abs(riemannSum(func, n, rule) - func.exact); }

// Observed convergence order between n and 2n (1 for endpoint rules, ~2 for
// midpoint/trapezoid): order = log2(E(n) / E(2n)).
export function convergenceOrder(func, n, rule) {
  const en = error(func, n, rule), e2 = error(func, 2 * n, rule);
  return e2 > 0 ? Math.log2(en / e2) : Infinity;
}
