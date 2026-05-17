// Abrupt p-n junction in the depletion approximation. Built-in
// potential V_bi = (kT/q) ln(NA ND / ni^2); depletion width
// W = sqrt( 2 eps (V_bi - V) / q (1/NA + 1/ND) ) with the charge-
// balance condition NA x_p = ND x_n; a triangular field of peak
// E_max = q ND x_n / eps; the ideal-diode law
// I = I0 (exp(qV/kT) - 1); and the C-V (Mott-Schottky) relation
// C = eps / W. SI units. Headless, deterministic. Reference: Sze and
// Ng, Physics of Semiconductor Devices (3rd ed.), Ch. 2
// (`sze-devices`); Kittel, Introduction to Solid State Physics
// (8th ed.), Ch. 19 (`kittel-cm`).

export const Q = 1.602176634e-19;        // C
export const KB = 1.380649e-23;          // J/K
export const EPS0 = 8.8541878128e-12;    // F/m
export const EPS_SI = 11.7 * EPS0;       // silicon permittivity
export const NI_SI = 1.0e16;             // intrinsic carrier density (m^-3, 300 K ~ 1e10 cm^-3)

export function thermalVoltage(T = 300) { return KB * T / Q; }

export function builtInPotential(NA, ND, T = 300, ni = NI_SI) {
  return thermalVoltage(T) * Math.log((NA * ND) / (ni * ni));
}

// Depletion width at applied bias V (forward V > 0). Clamped so the
// forward limit V -> V_bi gives W -> 0 (not negative).
export function depletionWidth(NA, ND, V, T = 300, eps = EPS_SI, ni = NI_SI) {
  const Vbi = builtInPotential(NA, ND, T, ni);
  const drop = Math.max(0, Vbi - V);
  return Math.sqrt((2 * eps * drop / Q) * (1 / NA + 1 / ND));
}

// Depletion edges (into p and into n). NA x_p = ND x_n.
export function depletionEdges(NA, ND, V, T = 300, eps = EPS_SI, ni = NI_SI) {
  const W = depletionWidth(NA, ND, V, T, eps, ni);
  const xn = W * NA / (NA + ND);
  const xp = W * ND / (NA + ND);
  return { W, xp, xn };
}

// Peak field at the metallurgical junction and the potential drop.
export function peakField(NA, ND, V, T = 300, eps = EPS_SI, ni = NI_SI) {
  const { xn } = depletionEdges(NA, ND, V, T, eps, ni);
  return Q * ND * xn / eps;
}
export function potentialDrop(NA, ND, V, T = 300, eps = EPS_SI, ni = NI_SI) {
  const { W } = depletionEdges(NA, ND, V, T, eps, ni);
  return 0.5 * peakField(NA, ND, V, T, eps, ni) * W;     // triangle area
}

// Depletion-region charge per unit area (one side); the two sides
// are equal and opposite (net zero).
export function depletionCharge(NA, ND, V, T = 300, eps = EPS_SI, ni = NI_SI) {
  const { xn, xp } = depletionEdges(NA, ND, V, T, eps, ni);
  return { Qn: Q * ND * xn, Qp: Q * NA * xp };
}

// Ideal-diode current (in units of the saturation current I0).
export function diodeCurrentOverI0(V, T = 300) {
  return Math.exp(V / thermalVoltage(T)) - 1;
}

// Junction capacitance per area and the Mott-Schottky 1/C^2.
export function junctionCapacitance(NA, ND, V, T = 300, eps = EPS_SI, ni = NI_SI) {
  return eps / depletionWidth(NA, ND, V, T, eps, ni);
}
export function invCsq(NA, ND, V, T = 300, eps = EPS_SI, ni = NI_SI) {
  const C = junctionCapacitance(NA, ND, V, T, eps, ni);
  return 1 / (C * C);
}

// Charge-density profile rho(x) in the depletion approximation: 0 in
// neutral regions, -q NA in [-xp,0], +q ND in [0,xn]. x measured
// from the metallurgical junction.
export function chargeDensity(x, NA, ND, V, T = 300, eps = EPS_SI, ni = NI_SI) {
  const { xp, xn } = depletionEdges(NA, ND, V, T, eps, ni);
  if (x >= -xp && x < 0) return -Q * NA;
  if (x >= 0 && x <= xn) return Q * ND;
  return 0;
}

// Conduction/valence band edges across the junction (eV), neutral
// regions flat, total bending q(V_bi - V). Reference at the n-side.
export function bands(x, NA, ND, V, Eg = 1.12, T = 300, eps = EPS_SI, ni = NI_SI) {
  const { xp, xn } = depletionEdges(NA, ND, V, T, eps, ni);
  const Vbi = builtInPotential(NA, ND, T, ni);
  const drop = Vbi - V;                                  // total band bending (V)
  // Quadratic electrostatic potential of the triangular field:
  // p-side phi = (q NA / 2 eps)(x + xp)^2, n-side
  // phi = drop - (q ND / 2 eps)(xn - x)^2, flat outside.
  let phi;
  if (x <= -xp) phi = 0;
  else if (x >= xn) phi = drop;
  else if (x < 0) phi = (Q * NA / (2 * eps)) * (x + xp) ** 2;
  else phi = drop - (Q * ND / (2 * eps)) * (xn - x) ** 2;
  const Ec = Eg - phi;            // conduction edge falls by phi across the junction
  return { Ec, Ev: Ec - Eg, phi };
}
