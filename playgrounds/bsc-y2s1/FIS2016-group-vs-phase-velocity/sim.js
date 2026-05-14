// Group vs phase velocity for a two-component superposition.
// y(x, t) = cos(k1 x - omega1 t) + cos(k2 x - omega2 t)
//        = 2 cos((dk/2) x - (domega/2) t) cos(k_avg x - omega_avg t)
// Phase velocity v_p = omega/k of the carrier (k_avg, omega_avg).
// Group velocity v_g = domega/dk of the envelope.
// Dispersion relations:
//   omega = c k         linear (light in vacuum): v_p = v_g = c
//   omega = a sqrt(k)   gravity waves on deep water: v_g = v_p / 2
//   omega = a k^2       Schrodinger (free particle): v_g = 2 v_p
// Reference: Crawford Waves Ch. 6 (`crawford-waves`); Pain Ch. 5 (`pain-vibrations`).
export function omega(disp, k) {
  switch (disp) {
    case 'light': return k;
    case 'water-deep': return Math.sqrt(9.81 * k);
    case 'shrod': return 0.05 * k * k;
    case 'plasma': { const omega_p = 2; return Math.sqrt(omega_p * omega_p + k * k); }
  }
  return k;
}
export function phaseVelocity(disp, k) { return omega(disp, k) / k; }
export function groupVelocity(disp, k, eps = 1e-3) {
  return (omega(disp, k + eps) - omega(disp, k - eps)) / (2 * eps);
}
