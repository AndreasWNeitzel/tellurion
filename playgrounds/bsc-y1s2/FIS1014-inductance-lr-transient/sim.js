// sim.js
// The LR circuit transient and the energy stored in a magnetic field. With the
// switch on a battery, Kirchhoff gives L dI/dt + R I = V, so the current rises
//   I(t) = (V/R)(1 - e^{-t/tau}),   tau = L/R,
// toward the steady value V/R. The inductor opposes the change with a back-EMF
// V_L = L dI/dt = V e^{-t/tau} that starts at V and decays; throughout,
// V_R + V_L = V. Switch the battery out (short through R) and the current decays,
// I(t) = I_0 e^{-t/tau}, dumping the stored energy U = (1/2) L I^2 into the
// resistor.
//
// Reference: Halliday, Resnick and Walker, Fundamentals of Physics, Ch. 30
// (RL circuits, energy stored in a magnetic field); Griffiths, Introduction to
// Electrodynamics, 5e, Sec. 7.2.

export function timeConstant(L, R) { return L / R; }
export function steadyCurrent(V, R) { return V / R; }
export function currentRise(V, R, L, t) { return (V / R) * (1 - Math.exp(-t / (L / R))); }
export function currentDecay(I0, R, L, t) { return I0 * Math.exp(-t / (L / R)); }
export function backEMF(Vapplied, R, I) { return Vapplied - R * I; }   // V_L = L dI/dt = Vapplied - R I
export function energy(L, I) { return 0.5 * L * I * I; }

// Backward-Euler (unconditionally stable) step of L dI/dt = Vapplied - R I.
export function stepCurrent(I, dt, Vapplied, R, L) { return (I + Vapplied * dt / L) / (1 + R * dt / L); }

export function createState(I0 = 0) { return { I: I0, t: 0, heat: 0 }; }
export function step(s, dt, p) {
  const Inew = stepCurrent(s.I, dt, p.on ? p.V : 0, p.R, p.L);
  s.heat += p.R * Inew * Inew * dt;       // energy dissipated in R
  s.I = Inew; s.t += dt;
  return s;
}
