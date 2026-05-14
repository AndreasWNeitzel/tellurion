// Temperature dependence of nuclear burning rates.
// pp chain: epsilon_pp ∝ rho T^4 (rough; full T^{4.5}).
// CNO cycle: epsilon_CNO ∝ rho T^{18} (steep).
// Helium 3-alpha: epsilon ∝ rho^2 T^{40} (extremely steep).
// Reference: Hansen-Kawaler-Trimble Stellar Interiors Ch. 6 (`hansen-kawaler`);
// Kippenhahn-Weigert Ch. 18 (`kippenhahn-weigert`).
export function eps_pp(T_K, rho_cgs = 1) { return 1e-6 * rho_cgs * Math.pow(T_K / 1.5e7, 4); }
export function eps_CNO(T_K, rho_cgs = 1) { return 1e-6 * rho_cgs * Math.pow(T_K / 2e7, 18); }
export function eps_3alpha(T_K, rho_cgs = 1) { return 1e-6 * rho_cgs * rho_cgs * Math.pow(T_K / 1e8, 40); }
