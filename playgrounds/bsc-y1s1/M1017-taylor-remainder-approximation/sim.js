// sim.js
// Taylor polynomials and the remainder. The degree-n Taylor polynomial of f about
// a is the partial sum
//   P_n(x) = sum_{k=0}^n  f^(k)(a)/k!  (x - a)^k,
// the unique degree-n polynomial matching f and its first n derivatives at a. The
// remainder R_n(x) = f(x) - P_n(x) is bounded by the Lagrange form
//   |R_n(x)| <= M_{n+1} |x - a|^{n+1} / (n+1)!,  M_{n+1} = max |f^(n+1)| on [a, x],
// so it shrinks with n while |x - a| stays inside the radius of convergence and can
// grow without bound outside it.
//
// Reference: Rudin, Principles of Mathematical Analysis, 3rd ed., Thm. 5.15
// (Taylor's theorem); Stewart, Calculus, 8th ed., Sec. 11.10 and 11.11.

const FAC = [1]; for (let k = 1; k <= 25; k += 1) FAC[k] = FAC[k - 1] * k;
export function factorial(k) { return FAC[k]; }

// Each function provides f and the Taylor coefficient c_k(a) = f^(k)(a)/k! about a,
// plus the radius of convergence about a and a plotting domain.
export const FUNCS = {
  sin: { label: 'sin x', f: (x) => Math.sin(x), coeff: (a, k) => Math.sin(a + k * Math.PI / 2) / FAC[k], radius: () => Infinity, dom: [-8, 8] },
  exp: { label: 'e^x', f: (x) => Math.exp(x), coeff: (a, k) => Math.exp(a) / FAC[k], radius: () => Infinity, dom: [-3.2, 3.2] },
  log1p: { label: 'ln(1 + x)', f: (x) => Math.log(1 + x), coeff: (a, k) => (k === 0 ? Math.log(1 + a) : (k % 2 === 1 ? 1 : -1) / (k * Math.pow(1 + a, k))), radius: (a) => Math.abs(1 + a), dom: [-0.92, 4] },
  geom: { label: '1 / (1 - x)', f: (x) => 1 / (1 - x), coeff: (a, k) => 1 / Math.pow(1 - a, k + 1), radius: (a) => Math.abs(1 - a), dom: [-2.6, 0.95] },
};

// value of the degree-n Taylor polynomial of fn about a, evaluated at x.
export function taylorValue(fn, a, n, x) {
  let sum = 0, pw = 1; // (x - a)^k
  for (let k = 0; k <= n; k += 1) { sum += fn.coeff(a, k) * pw; pw *= (x - a); }
  return sum;
}
export function remainder(fn, a, n, x) { return fn.f(x) - taylorValue(fn, a, n, x); }

// Lagrange bound on |R_n(x)| using a sampled max of |f^(n+1)| over [a, x]; the
// (n+1)-th derivative is recovered from the coefficient, f^(n+1) = c_{n+1} (n+1)!.
export function lagrangeBound(fn, a, n, x) {
  const lo = Math.min(a, x), hi = Math.max(a, x); let M = 0;
  for (let i = 0; i <= 24; i += 1) { const t = lo + (hi - lo) * i / 24; M = Math.max(M, Math.abs(fn.coeff(t, n + 1)) * FAC[n + 1]); }
  return M * Math.pow(Math.abs(x - a), n + 1) / FAC[n + 1];
}
