// sim.js
// Bound states of the one-dimensional finite square well, depth V0 and width L
// (V = 0 for |x| < L/2, V = V0 outside). Inside the well the solutions oscillate
// with k = sqrt(2mE)/hbar; outside they decay with kappa = sqrt(2m(V0-E))/hbar.
// Matching the wavefunction and its derivative at the walls gives the
// transcendental quantisation conditions, in the dimensionless z = kL/2 with
// w = sqrt(z0^2 - z^2) and z0 = (L/2) sqrt(2 m V0)/hbar:
//   even states:  z tan z = w        (write as z sin z - w cos z = 0)
//   odd states:   z cot z = -w       (write as z cos z + w sin z = 0)
// The bound-state energies are E_n / V0 = (z_n / z0)^2, and there is always at
// least one (even) bound state, however shallow the well.
//
// Reference: Griffiths, Introduction to Quantum Mechanics, 2nd ed., Sec. 2.6
// (the finite square well); Gasiorowicz, Quantum Physics, 3rd ed., Ch. 5.

const HBAR = 1, M = 1;
export function z0of(V0, L) { return (L / 2) * Math.sqrt(2 * M * V0) / HBAR; }

function Feven(z, z0) { const w = Math.sqrt(Math.max(0, z0 * z0 - z * z)); return z * Math.sin(z) - w * Math.cos(z); }
function Fodd(z, z0) { const w = Math.sqrt(Math.max(0, z0 * z0 - z * z)); return z * Math.cos(z) + w * Math.sin(z); }

function bisect(F, lo, hi, z0) {
  let a = lo, b = hi; if (F(a, z0) * F(b, z0) > 0) return null;
  for (let i = 0; i < 80; i += 1) { const m = 0.5 * (a + b); if (F(a, z0) * F(m, z0) <= 0) b = m; else a = m; }
  return 0.5 * (a + b);
}

// the bound states, ordered by energy; parity alternates even, odd, even, ...
export function boundStates(V0, L) {
  const z0 = z0of(V0, L); const out = []; const half = Math.PI / 2; let n = 0;
  while (n * half < z0) {
    const lo = n * half + 1e-7, hi = Math.min((n + 1) * half, z0) - 1e-7;
    if (lo < hi) { const F = n % 2 === 0 ? Feven : Fodd; const z = bisect(F, lo, hi, z0); if (z !== null) out.push({ n, parity: n % 2 === 0 ? 'even' : 'odd', z, EoverV0: (z / z0) * (z / z0), E: (z / z0) * (z / z0) * V0 }); }
    n += 1;
  }
  return out;
}
export function countStates(V0, L) { return Math.floor(z0of(V0, L) / (Math.PI / 2)) + 1; }

// the (unnormalised) wavefunction of a bound state at position x: cos/sin inside,
// matched exponential decay outside.
export function waveAt(state, x, V0, L) {
  const z0 = z0of(V0, L), z = state.z, k = 2 * z / L, w = Math.sqrt(Math.max(0, z0 * z0 - z * z)), kap = 2 * w / L;
  const h = L / 2;
  if (Math.abs(x) <= h) return state.parity === 'even' ? Math.cos(k * x) : Math.sin(k * x);
  const edge = state.parity === 'even' ? Math.cos(z) : Math.sin(z) * Math.sign(x);
  return edge * Math.exp(-kap * (Math.abs(x) - h));
}

// the two transcendental branches and the circle, for the graphical solution.
export function evenBranch(z) { return z * Math.tan(z); }
export function oddBranch(z) { return -z / Math.tan(z); }
export function circle(z, z0) { return Math.sqrt(Math.max(0, z0 * z0 - z * z)); }
