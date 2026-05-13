// sim.js
// Transmission line and reflection coefficient.
//
// Voltage reflection coefficient at a load Z_L on a line of characteristic
// impedance Z_0:
//   Gamma_L = (Z_L - Z_0) / (Z_L + Z_0).
//
// VSWR (voltage standing wave ratio):
//   VSWR = (1 + |Gamma|) / (1 - |Gamma|), with VSWR = 1 at matched load.
//
// Power delivered to the load:
//   P_L / P_inc = 1 - |Gamma|^2.
//
// Both Z_L and Z_0 may be complex; here we restrict to real positive
// impedance for the playground (resistive loads).
//
// Reference: Jackson, Classical Electrodynamics 3e Ch. 8 (`jackson1998`).

export function reflection(ZL, Z0) {
  return (ZL - Z0) / (ZL + Z0);
}

export function vswr(ZL, Z0) {
  const g = Math.abs(reflection(ZL, Z0));
  if (g >= 1 - 1e-15) return Infinity;
  return (1 + g) / (1 - g);
}

export function powerDelivered(ZL, Z0) {
  const g = reflection(ZL, Z0);
  return 1 - g * g;
}

// Return-loss in dB: -20 log10(|Gamma|).
export function returnLossDb(ZL, Z0) {
  const g = Math.abs(reflection(ZL, Z0));
  if (g < 1e-15) return Infinity;
  return -20 * Math.log10(g);
}

// Whether the load is matched within tolerance tol (relative).
export function isMatched(ZL, Z0, tol = 0.01) {
  return Math.abs(reflection(ZL, Z0)) < tol;
}
