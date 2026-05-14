// Singular isothermal sphere (Jeans approximation): rho(r) = sigma^2 / (2 pi G r^2).
// Enclosed mass: M(<r) = 2 sigma^2 r / G. Circular velocity: v_c(r) = sqrt(2) sigma (flat).
// Reference: Binney-Tremaine Ch. 4 (`binney-tremaine`).
export const G_SI = 6.674e-11;
export function density(r, sigma) { return sigma * sigma / (2 * Math.PI * G_SI * r * r); }
export function massEnclosed(r, sigma) { return 2 * sigma * sigma * r / G_SI; }
export function vCirc(sigma) { return Math.sqrt(2) * sigma; }
