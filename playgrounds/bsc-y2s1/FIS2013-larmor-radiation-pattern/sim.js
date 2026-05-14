// Non-relativistic Larmor radiation pattern.
// Power radiated per solid angle for an accelerated charge:
//   dP/dOmega = (q^2 / 16 pi^2 eps0 c^3) |a|^2 sin^2(theta)
// where theta is the angle between the acceleration vector and the line of sight.
// Total power: P_tot = (q^2 |a|^2) / (6 pi eps0 c^3)  (Larmor formula).
// Reference: Griffiths E&M Ch. 11 (`griffiths-em`); Jackson Ch. 14 (`jackson3e`).
export const EPS0 = 8.854187817e-12;
export const C = 299792458;
export const Q = 1.602176634e-19;
export function dPdOmega(theta, a, q = Q) {
  const pref = (q * q) / (16 * Math.PI * Math.PI * EPS0 * C * C * C);
  return pref * a * a * Math.sin(theta) ** 2;
}
export function Ptotal(a, q = Q) {
  return (q * q * a * a) / (6 * Math.PI * EPS0 * C * C * C);
}
// Solid-angle integral of dP/dOmega.
export function integratedPower(a, q = Q, N = 1000) {
  let s = 0; const dth = Math.PI / N;
  for (let i = 1; i < N; i += 1) {
    const th = i * dth;
    s += dPdOmega(th, a, q) * Math.sin(th);
  }
  return s * dth * 2 * Math.PI;
}
