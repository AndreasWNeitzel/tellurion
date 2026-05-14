// Isothermal: P V = n R T = const.
// Adiabatic (reversible): P V^gamma = const, T V^(gamma-1) = const.
// Reference: Callen Thermodynamics Ch. 1-3 (`callen`); Reif Ch. 5 (`reif`).
export const R = 8.314462618;
export function isothermalPressure(V, T, n = 1) { return n * R * T / V; }
export function adiabaticPressure(V, V0, P0, gamma) { return P0 * Math.pow(V0 / V, gamma); }
export function adiabaticTemperature(V, V0, T0, gamma) { return T0 * Math.pow(V0 / V, gamma - 1); }
export function workIsothermal(V1, V2, T, n = 1) { return n * R * T * Math.log(V2 / V1); }
export function workAdiabatic(V1, V2, P1, V0, gamma) {
  // W = (P1 V1 - P2 V2) / (gamma - 1)
  const P2 = adiabaticPressure(V2, V0, P1 * Math.pow(V1 / V0, gamma) * Math.pow(V0 / V1, gamma), gamma);
  return (P1 * V1 - P2 * V2) / (gamma - 1);
}
