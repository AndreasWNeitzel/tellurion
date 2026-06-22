// sim.js
// Polytropic stellar structure from the Lane-Emden equation. A self-gravitating
// gas sphere with P = K rho^(1+1/n) is in hydrostatic equilibrium when the
// dimensionless density theta(xi) (rho = rho_c theta^n) obeys
//   (1/xi^2) d/dxi(xi^2 dtheta/dxi) = -theta^n,  theta(0)=1, theta'(0)=0,
// integrated out to the first zero xi_1, the surface. Higher n concentrates the
// mass toward the centre; n=0 is a uniform sphere (xi_1 = sqrt 6), n=1 has the
// analytic theta = sin(xi)/xi (xi_1 = pi), and n=5 has infinite radius. The heavy
// RK4 integration is the shared engine; this module adds the derived structure.
//
// Reference: Chandrasekhar, An Introduction to the Study of Stellar Structure,
// 1939, Ch. 4; Kippenhahn, Weigert, Weiss, Stellar Structure and Evolution, 2nd
// ed., Ch. 19.

import { laneEmden, thetaAt, dthetaAt } from '../../../shared/js/engine/polytrope.js';

export function model(n) { return laneEmden(n); }
export function surfaceRadius(m) { return m.xi1; }
export function theta(m, xi) { return thetaAt(m, xi); }

// density ratio rho/rho_c = theta^n at fractional radius x = r/R = xi/xi_1.
export function densityRatio(m, x) { const th = thetaAt(m, x * m.xi1); return Math.pow(Math.max(0, th), m.nPoly); }

// enclosed mass fraction m(<r)/M = xi^2 theta'(xi) / (xi_1^2 theta'(xi_1)).
export function massFraction(m, x) { if (x <= 0) return 0; if (x >= 1) return 1; const xi = x * m.xi1; return (xi * xi * dthetaAt(m, xi)) / (m.xi1 * m.xi1 * m.dth1); }

// central concentration rho_c / <rho> = -xi_1 / (3 theta'(xi_1)).
export function centralConcentration(m) { return -m.xi1 / (3 * m.dth1); }

// analytic theta for the three solvable indices, for verification.
export function thetaAnalytic(n, xi) {
  if (n === 0) return 1 - xi * xi / 6;
  if (n === 1) return xi === 0 ? 1 : Math.sin(xi) / xi;
  if (n === 5) return 1 / Math.sqrt(1 + xi * xi / 3);
  return null;
}
