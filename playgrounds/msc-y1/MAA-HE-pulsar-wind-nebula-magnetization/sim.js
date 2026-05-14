// Pulsar wind nebula (Crab-like): magnetization sigma = U_B / U_particle.
// Termination-shock radius from pressure balance:
//   R_TS = sqrt(L_sd / (4 pi c P_ext)),  P_ext = pressure of surrounding nebula.
// Reference: Kennel-Coroniti 1984; Rybicki-Lightman Ch. 6 (`rybickilightman1979`).
export function terminationRadius(L_erg_s, P_ext_dyn_cm2) {
  const c = 3e10;
  return Math.sqrt(L_erg_s / (4 * Math.PI * c * P_ext_dyn_cm2));
}
export function sigma_M(U_B, U_part) { return U_B / Math.max(1e-30, U_part); }
// For Crab: L_sd ~ 5e38 erg/s, R_TS ~ 0.1 pc.
export const CRAB_L = 5e38;
export const CRAB_R_TS_PC = 0.1;
