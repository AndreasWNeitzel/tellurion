// Three classical 1D root finders.
// Reference: Burden-Faires Numerical Analysis Ch. 2 (`burdenfaires`); Villate VPython
// Numerical Methods Ch. 4 (`villate-vpython`).
export function bisect(f, a, b, tol = 1e-10, maxIter = 200) {
  const trail = [{ a, b, m: 0.5 * (a + b), iter: 0 }];
  let fa = f(a), fb = f(b);
  if (fa * fb > 0) return { root: NaN, trail, ok: false };
  for (let i = 0; i < maxIter; i += 1) {
    const m = 0.5 * (a + b);
    const fm = f(m);
    trail.push({ a, b, m, iter: i + 1 });
    if (Math.abs(fm) < tol || (b - a) / 2 < tol) return { root: m, trail, ok: true };
    if (fa * fm < 0) { b = m; fb = fm; } else { a = m; fa = fm; }
  }
  return { root: 0.5 * (a + b), trail, ok: false };
}
export function newton(f, df, x0, tol = 1e-10, maxIter = 100) {
  const trail = [{ x: x0, iter: 0 }];
  let x = x0;
  for (let i = 0; i < maxIter; i += 1) {
    const fx = f(x), dx = df(x);
    if (Math.abs(dx) < 1e-30) return { root: x, trail, ok: false };
    const xn = x - fx / dx;
    trail.push({ x: xn, iter: i + 1 });
    if (Math.abs(xn - x) < tol) return { root: xn, trail, ok: true };
    x = xn;
  }
  return { root: x, trail, ok: false };
}
export function secant(f, x0, x1, tol = 1e-10, maxIter = 100) {
  const trail = [{ x: x0, iter: 0 }, { x: x1, iter: 1 }];
  for (let i = 0; i < maxIter; i += 1) {
    const f0 = f(x0), f1 = f(x1);
    if (Math.abs(f1 - f0) < 1e-30) return { root: x1, trail, ok: false };
    const x2 = x1 - f1 * (x1 - x0) / (f1 - f0);
    trail.push({ x: x2, iter: i + 2 });
    if (Math.abs(x2 - x1) < tol) return { root: x2, trail, ok: true };
    x0 = x1; x1 = x2;
  }
  return { root: x1, trail, ok: false };
}
