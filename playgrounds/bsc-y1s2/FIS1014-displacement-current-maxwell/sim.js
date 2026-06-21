// sim.js
// The displacement current that completes Ampere's law. Charging a parallel-plate
// capacitor through a resistor, the conduction current in the wire stops at the
// plates, yet a magnetic field still circulates around the gap. Maxwell's fix: a
// changing electric flux acts as a current,
//   I_disp = eps0 dPhi_E/dt,   Phi_E = E A,   E = Q / (eps0 A),
// so I_disp = dQ/dt = I_cond exactly. The Maxwell-Ampere law
//   closed integral of B . dl = mu0 (I_cond + eps0 dPhi_E/dt)
// then gives the same B whether the Amperian loop threads the wire (enclosing
// the conduction current) or the gap (enclosing the displacement current).
//
// RC charging: Q(t) = C V (1 - e^{-t/RC}), I_cond(t) = (V/R) e^{-t/RC}. Units
// eps0 = A = mu0 = 1 (the field constants only rescale; the equality is exact).
//
// Reference: Griffiths, Introduction to Electrodynamics, 5e, Sec. 7.3.

export const EPS0 = 1, A_PLATE = 1;

export function tauOf(R, C) { return R * C; }
export function current(V, R, t, tau) { return (V / R) * Math.exp(-t / tau); }       // conduction current
export function charge(V, C, t, tau) { return C * V * (1 - Math.exp(-t / tau)); }
export function eField(V, C, t, tau) { return charge(V, C, t, tau) / (EPS0 * A_PLATE); } // E = Q / (eps0 A)
export function fluxE(V, C, t, tau) { return eField(V, C, t, tau) * A_PLATE; }           // Phi_E = E A

// Displacement current from the rate of change of the electric flux, computed
// INDEPENDENTLY of the conduction current (central difference). It comes out
// equal to I_cond.
export function displacementCurrent(V, C, t, tau, h = 1e-4) {
  const tlo = Math.max(0, t - h), thi = t + h;
  return EPS0 * (fluxE(V, C, thi, tau) - fluxE(V, C, tlo, tau)) / (thi - tlo);
}

// B magnitude on an Amperian loop of radius r enclosing current I (mu0 = 1).
export function bField(Ienc, r) { return Ienc / (2 * Math.PI * Math.max(r, 1e-6)); }
