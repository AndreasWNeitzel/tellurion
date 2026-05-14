// 1D Green's function for the Laplacian on [0, L] with Dirichlet BC u(0) = u(L) = 0.
//   -u''(x) = f(x)
//   G(x, x0) = (x_min)(L - x_max)/L, where x_min = min(x, x0), x_max = max(x, x0).
//   u(x) = integral_0^L G(x, x0) f(x0) dx0.
// Reference: Arfken-Weber Ch. 9 (`arfken-weber`); Riley-Hobson Ch. 21 (`riley-hobson`).
export function greenFn(x, x0, L) {
  if (x < 0 || x > L || x0 < 0 || x0 > L) return 0;
  const xMin = Math.min(x, x0), xMax = Math.max(x, x0);
  return xMin * (L - xMax) / L;
}
export function solve(f, L = 1, N = 200) {
  const u = new Float64Array(N + 1);
  const xs = new Float64Array(N + 1);
  for (let i = 0; i <= N; i += 1) xs[i] = i * L / N;
  const dx = L / N;
  for (let i = 0; i <= N; i += 1) {
    let s = 0;
    for (let j = 0; j <= N; j += 1) s += greenFn(xs[i], xs[j], L) * f(xs[j]) * dx;
    u[i] = s;
  }
  return { xs, u };
}
