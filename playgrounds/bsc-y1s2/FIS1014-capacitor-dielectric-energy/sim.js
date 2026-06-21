// sim.js
// Parallel-plate capacitor and a dielectric slab pulled into the gap. The slab
// slides in covering a fraction x of the plate area, so the device is two
// capacitors in parallel,
//   C(x) = C0 [1 + (eps_r - 1) x],   C0 = eps0 A / d,
// and the field between the plates is E = V/d in both regions (the plates are
// equipotentials), but the dielectric region stores more charge. The slab is
// pulled IN: the inward force is, at constant charge (battery disconnected),
//   F = -dU/dx = Q^2 / (2 C^2) dC/dx > 0,   U = Q^2/(2C),
// and at constant voltage (battery connected),
//   F = +(1/2) V^2 dC/dx > 0,   U = (1/2) C V^2,
// where the battery does the work. Energy density is (1/2) eps0 eps_r E^2, higher
// in the dielectric. Units eps0 = A = d = 1, so C0 = 1.
//
// Reference: Griffiths, Introduction to Electrodynamics, 5e, Sec. 4.4.4;
// Halliday, Resnick and Walker, Fundamentals of Physics, Ch. 25.

export const EPS0 = 1, AREA = 1, DGAP = 1;

export function vacuumC() { return EPS0 * AREA / DGAP; }                 // C0
export function capacitance(epsR, x) { return vacuumC() * (1 + (epsR - 1) * x); }
export function chargeFor(epsR, x, V) { return capacitance(epsR, x) * V; } // Q = C V
export function energyConstQ(Q, epsR, x) { const C = capacitance(epsR, x); return Q * Q / (2 * C); }
export function energyConstV(epsR, x, V) { return 0.5 * capacitance(epsR, x) * V * V; }

// Inward force on the slab (positive pulls it in). dC/dx = C0 (eps_r - 1).
export function forceIn(epsR, x, mode, Q, V) {
  const dCdx = vacuumC() * (epsR - 1);
  if (mode === 'Q') { const C = capacitance(epsR, x); return (Q * Q) / (2 * C * C) * dCdx; }
  return 0.5 * V * V * dCdx;
}

export function fieldE(V) { return V / DGAP; }                          // E = V/d (both regions)
export function energyDensityVac(V) { const E = fieldE(V); return 0.5 * EPS0 * E * E; }
export function energyDensityDiel(epsR, V) { const E = fieldE(V); return 0.5 * EPS0 * epsR * E * E; }

// Slab dynamics: m x'' = F(x) - gamma x', clamped to [0, 1].
export function createSlab(x0 = 0) { return { x: x0, v: 0 }; }
export function stepSlab(s, dt, p) {
  const F = forceIn(p.epsR, s.x, p.mode, p.Q, p.V);
  const a = (F - p.gamma * s.v) / p.m;
  s.v += a * dt; s.x += s.v * dt;
  if (s.x >= 1) { s.x = 1; if (s.v > 0) s.v = 0; }
  if (s.x <= 0) { s.x = 0; if (s.v < 0) s.v = 0; }
  return s;
}

// Work done by the inward force as the slab moves from x0 to x1 (numeric).
export function workIn(epsR, x0, x1, mode, Q, V, n = 2000) {
  let w = 0; const dx = (x1 - x0) / n;
  for (let i = 0; i < n; i += 1) { const x = x0 + (i + 0.5) * dx; w += forceIn(epsR, x, mode, Q, V) * dx; }
  return w;
}
