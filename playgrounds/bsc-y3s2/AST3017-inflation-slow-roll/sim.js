// sim.js
// Slow-roll inflation observables. For a scalar inflaton with potential
// V(phi), the slow-roll parameters are
//
//   epsilon(phi) = (M_Pl^2 / 2) (V'/V)^2
//   eta(phi)     = M_Pl^2 V''/V
//
// (where M_Pl is the reduced Planck mass; below we set M_Pl = 1).
//
// Observables to leading order:
//   spectral index n_s = 1 - 6 epsilon + 2 eta
//   tensor-to-scalar ratio r = 16 epsilon
//
// Models:
//   chaotic phi^n: V = phi^n. For N e-folds before end of inflation,
//                  phi_N = sqrt(2 n N) approximately. n_s = 1 - (n + 2) / (2 N).
//                  r = 4 n / N.
//   natural:       V = Lambda^4 (1 + cos(phi / f)). Strong dependence on f / M_Pl.
//   Starobinsky / R^2: V proportional to (1 - exp(-sqrt(2/3) phi))^2.
//                  Famous prediction n_s = 1 - 2/N, r = 12 / N^2.
//
// Reference: Mukhanov, Physical Foundations of Cosmology Ch. 5
// (`mukhanov-cosmology`).

export const MODELS = ['phi2', 'phi4', 'natural', 'starobinsky'];

export function nsR(model, N) {
  switch (model) {
    case 'phi2': // V ~ phi^2 (p=2): n_s = 1 - (p+2)/(2N) = 1 - 2/N, r = 4p/N = 8/N
      return { ns: 1 - 2 / N, r: 8 / N };
    case 'phi4': // V ~ phi^4 (p=4): n_s = 1 - (p+2)/(2N) = 1 - 3/N, r = 4p/N = 16/N
      return { ns: 1 - 3 / N, r: 16 / N };
    case 'natural': {
      // Natural inflation V = Lambda^4 (1 + cos(phi/f)). Large-f
      // approximation (f = 2 M_Pl): n_s = 1 - 2/N - 1/f^2, r = 8/N.
      const f = 2;
      return { ns: 1 - 2 / N - 1 / (f * f), r: 8 / N };
    }
    case 'starobinsky':
      return { ns: 1 - 2 / N, r: 12 / (N * N) };
    default:
      return { ns: 0.96, r: 0.001 };
  }
}

// Planck 2018 1 sigma constraints (approximate):
// n_s = 0.9649 +/- 0.0042
// r < 0.064 (95 percent upper limit)
export const PLANCK_NS = 0.9649;
export const PLANCK_NS_SIG = 0.0042;
export const PLANCK_R_UPPER = 0.064;

export function withinPlanckBox(ns, r) {
  return Math.abs(ns - PLANCK_NS) < 2 * PLANCK_NS_SIG && r < PLANCK_R_UPPER;
}
