// sim.js
// RC discharge: a capacitor of capacitance C charged to V_0 discharges
// through a resistor of resistance R. Kirchhoff's voltage law gives
//   V_C(t) = V_0 exp(-t / tau), tau = R C.
//
// Closed-form. Reference: Griffiths Introduction to Electrodynamics,
// 5e Ch. 7 (`griffithsem2017`).

export function vC(t, V0, tau) {
  return V0 * Math.exp(-t / tau);
}

export function iR(t, V0, R, tau) {
  return (V0 / R) * Math.exp(-t / tau);
}

// Energy stored in capacitor at time t: U(t) = 0.5 C V(t)^2.
export function energyC(t, V0, C, tau) {
  const V = vC(t, V0, tau);
  return 0.5 * C * V * V;
}

// Power dissipated in R at time t: P(t) = V_C(t)^2 / R.
export function powerR(t, V0, R, tau) {
  const V = vC(t, V0, tau);
  return V * V / R;
}

// Total energy dissipated from 0 to t: 0.5 C V_0^2 (1 - exp(-2 t / tau)).
export function energyDissipated(t, V0, C, tau) {
  const Vsq = V0 * V0 * (1 - Math.exp(-2 * t / tau));
  return 0.5 * C * Vsq;
}

// Time to reach a fraction f of V_0: t = -tau ln(f).
export function timeToFraction(f, tau) {
  if (f <= 0 || f >= 1) return NaN;
  return -tau * Math.log(f);
}
