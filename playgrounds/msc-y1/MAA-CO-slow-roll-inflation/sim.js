// Pure slow-roll inflation physics (no DOM), shared by playground.js and
// invariants.test.mjs. Reduced Planck units, M_Pl = 1.
//
// Potentials:
//   phi2:        V = phi^2 / 2
//   phi4:        V = phi^4 / 4
//   starobinsky: V = (1 - e)^2,  e = exp(-sqrt(2/3) phi)
//
// Starobinsky derivatives (e = exp(-k phi), k = sqrt(2/3)):
//   V'  = 2 k e (1 - e)
//   V'' = (4/3) e (2e - 1) = 2 (2/3) (2 e^2 - e)
// (The previous code carried a spurious extra -e^2 in V'', giving the
// wrong eta and hence the wrong Starobinsky n_s on the (n_s, r) plane.)

const K = Math.sqrt(2 / 3);

export function V(phi, model) {
  if (model === 'phi2') return 0.5 * phi * phi;
  if (model === 'phi4') return 0.25 * phi * phi * phi * phi;
  return Math.pow(1 - Math.exp(-K * phi), 2);
}

export function Vp(phi, model) {
  if (model === 'phi2') return phi;
  if (model === 'phi4') return phi * phi * phi;
  const e = Math.exp(-K * phi);
  return 2 * K * e * (1 - e);
}

export function Vpp(phi, model) {
  if (model === 'phi2') return 1;
  if (model === 'phi4') return 3 * phi * phi;
  const e = Math.exp(-K * phi);
  return 2 * (2 / 3) * (2 * e * e - e);
}

export function epsilon(phi, model) {
  const v = V(phi, model);
  return v > 1e-12 ? 0.5 * (Vp(phi, model) / v) ** 2 : 0;
}

export function eta(phi, model) {
  const v = V(phi, model);
  return v > 1e-12 ? Vpp(phi, model) / v : 0;
}

// Spectral observables to leading slow-roll order.
export function nsR(phi, model) {
  const e = epsilon(phi, model);
  const n = eta(phi, model);
  return { ns: 1 - 6 * e + 2 * n, r: 16 * e };
}

// Spectral observables as a function of the number of e-folds N before
// the end of inflation (the observationally relevant CMB-pivot quantity;
// the raw epsilon(phi)/eta(phi) at the live rolling field diverge in the
// reheating region and fly off the (n_s, r) plane). Standard large-field
// / plateau closed forms (M_Pl = 1):
//   phi2 (V ~ phi^2):  n_s = 1 - 2/N,  r = 8/N
//   phi4 (V ~ phi^4):  n_s = 1 - 3/N,  r = 16/N
//   Starobinsky R^2:   n_s = 1 - 2/N,  r = 12/N^2
export function nsR_atN(N, model) {
  if (model === 'phi4') return { ns: 1 - 3 / N, r: 16 / N };
  if (model === 'starobinsky') return { ns: 1 - 2 / N, r: 12 / (N * N) };
  return { ns: 1 - 2 / N, r: 8 / N };
}
