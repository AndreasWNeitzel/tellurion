// Three classic ODE integrators on a 1D harmonic oscillator: x'' = -omega^2 x.
// State y = [x, v].  Right-hand side f(y) = [v, -omega^2 x].
// Reference: Hairer-Norsett-Wanner Vol I. Practice text: Villate (`villate-vpython`).
export function f(y, omega) { return [y[1], -omega * omega * y[0]]; }
export function euler(y, dt, omega) {
  const k = f(y, omega);
  return [y[0] + dt * k[0], y[1] + dt * k[1]];
}
export function rk4(y, dt, omega) {
  const k1 = f(y, omega);
  const y2 = [y[0] + 0.5 * dt * k1[0], y[1] + 0.5 * dt * k1[1]];
  const k2 = f(y2, omega);
  const y3 = [y[0] + 0.5 * dt * k2[0], y[1] + 0.5 * dt * k2[1]];
  const k3 = f(y3, omega);
  const y4 = [y[0] + dt * k3[0], y[1] + dt * k3[1]];
  const k4 = f(y4, omega);
  return [y[0] + dt * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6,
          y[1] + dt * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6];
}
// Cash-Karp RK45 (one adaptive step). Returns { y_new, err_norm }.
export function rk45(y, dt, omega) {
  const a = [
    [],
    [1/5],
    [3/40, 9/40],
    [3/10, -9/10, 6/5],
    [-11/54, 5/2, -70/27, 35/27],
    [1631/55296, 175/512, 575/13824, 44275/110592, 253/4096],
  ];
  const b5 = [37/378, 0, 250/621, 125/594, 0, 512/1771];
  const b4 = [2825/27648, 0, 18575/48384, 13525/55296, 277/14336, 1/4];
  const ks = [f(y, omega)];
  for (let i = 1; i < 6; i += 1) {
    const yi = y.slice();
    for (let j = 0; j < i; j += 1) {
      yi[0] += dt * a[i][j] * ks[j][0];
      yi[1] += dt * a[i][j] * ks[j][1];
    }
    ks.push(f(yi, omega));
  }
  const y5 = [y[0], y[1]], y4 = [y[0], y[1]];
  for (let i = 0; i < 6; i += 1) {
    y5[0] += dt * b5[i] * ks[i][0]; y5[1] += dt * b5[i] * ks[i][1];
    y4[0] += dt * b4[i] * ks[i][0]; y4[1] += dt * b4[i] * ks[i][1];
  }
  const err = Math.hypot(y5[0] - y4[0], y5[1] - y4[1]);
  return { y_new: y5, err_norm: err };
}
export function energy(y, omega) { return 0.5 * (y[1] * y[1] + omega * omega * y[0] * y[0]); }
