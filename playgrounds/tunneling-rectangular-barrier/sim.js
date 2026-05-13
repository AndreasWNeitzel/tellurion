// sim.js
// Rectangular barrier transmission T(E) and reflection R(E) for a 1D
// Schrodinger particle of mass m and energy E incident on a barrier of
// height V0 and width a. Units: hbar = m = 1.

// k = sqrt(2 E)
// E > V0  -> propagating inside: kappa = sqrt(2(E - V0)); T closed-form
// E < V0  -> evanescent inside:  kappa = sqrt(2(V0 - E)); T closed-form
// At E = V0 use the limiting expression.

export function transmission(E, V0, a) {
  if (E <= 0) return 0;
  const k = Math.sqrt(2 * E);
  if (Math.abs(E - V0) < 1e-12) {
    // limiting case: T = 1 / (1 + (m V0 a^2) / (2 hbar^2)) = 1 / (1 + V0 a^2 / 2)
    return 1 / (1 + V0 * a * a / 2);
  }
  if (E > V0) {
    const kappa = Math.sqrt(2 * (E - V0));
    const num = 4 * E * (E - V0);
    const den = num + V0 * V0 * Math.sin(kappa * a) * Math.sin(kappa * a);
    return num / den;
  } else {
    const kappa = Math.sqrt(2 * (V0 - E));
    const sh = Math.sinh(kappa * a);
    const num = 4 * E * (V0 - E);
    const den = num + V0 * V0 * sh * sh;
    return num / den;
  }
}

export function reflection(E, V0, a) {
  return 1 - transmission(E, V0, a);
}

// Resonance condition E > V0: T = 1 when sin(kappa a) = 0, i.e. kappa a = n pi.
// Returns the nth resonance energy above V0 (n = 1, 2, 3, ...).
export function resonanceEnergy(n, V0, a) {
  const kappa = n * Math.PI / a;
  return V0 + 0.5 * kappa * kappa;
}

// Real part of the wavefunction at position x for incident wave A e^{i k x},
// time t, with the barrier centred between 0 and a. Outside the barrier the
// solution is a sum of plane waves; inside it is exponential or oscillatory
// depending on E vs V0. We return Re(psi(x, t)) with the incident amplitude
// fixed at 1 for display. This is a coarse stationary-state visualization;
// time evolution is just an exp(-i E t) global phase.
export function psiReal(x, t, E, V0, a) {
  if (E <= 0) return 0;
  const k = Math.sqrt(2 * E);
  const phase = -E * t;       // global e^{-i E t} factor
  if (x < 0) {
    // incident + reflected
    const T = transmission(E, V0, a);
    // Reflection coefficient amplitude r. For simplicity use sqrt(1 - T)
    // with conventional phase; this is a visualization, not a measurement.
    const r = Math.sqrt(Math.max(0, 1 - T));
    return Math.cos(k * x + phase) + r * Math.cos(-k * x + phase + Math.PI);
  }
  if (x > a) {
    const T = transmission(E, V0, a);
    const t_amp = Math.sqrt(T);
    return t_amp * Math.cos(k * (x - a) + phase);
  }
  // inside the barrier
  if (E > V0) {
    const kappa = Math.sqrt(2 * (E - V0));
    // approximate oscillatory inside-amplitude scaled by transmission
    const T = transmission(E, V0, a);
    const amp = (1 + Math.sqrt(T)) / 2;
    return amp * Math.cos(kappa * x + phase);
  }
  const kappa = Math.sqrt(2 * (V0 - E));
  // decaying solution from the left interface
  const T = transmission(E, V0, a);
  const amp = (1 + Math.sqrt(T)) / 2;
  const decay = Math.exp(-kappa * x);
  return amp * decay * Math.cos(phase);
}
