// sim.js
// The radial wavefunctions of hydrogen. Separating the Schrodinger equation in the
// Coulomb potential -1/r gives R_nl(r) proportional to (2r/n)^l e^{-r/n} times an
// associated Laguerre polynomial L_{n-l-1}^{2l+1}(2r/n), with energies that depend
// only on n,
//   E_n = -13.6 eV / n^2,
// degenerate in l. The radial probability density P(r) = r^2 |R_nl|^2 has n-l-1
// nodes, integrates to one, and peaks near the most probable radius, which grows
// like n^2 a_0; the mean radius is <r> = (3n^2 - l(l+1))/2 a_0.
//
// Units: Bohr radius a_0 = 1, energies in eV via the Rydberg 13.6057 eV.
//
// Reference: Griffiths, Introduction to Quantum Mechanics, 2nd ed., Sec. 4.2;
// Bransden and Joachain, Physics of Atoms and Molecules, 2nd ed., Ch. 3.

const RYDBERG = 13.6056931;

// associated Laguerre polynomial L_k^alpha(x) by recurrence.
export function laguerre(k, alpha, x) {
  if (k === 0) return 1; if (k === 1) return 1 + alpha - x;
  let l0 = 1, l1 = 1 + alpha - x;
  for (let i = 1; i < k; i += 1) { const l2 = ((2 * i + 1 + alpha - x) * l1 - (i + alpha) * l0) / (i + 1); l0 = l1; l1 = l2; }
  return l1;
}

function Rraw(n, l, r) { return Math.pow(2 * r / n, l) * Math.exp(-r / n) * laguerre(n - l - 1, 2 * l + 1, 2 * r / n); }

const normCache = {};
function normSq(n, l) {
  const key = `${n}:${l}`; if (normCache[key]) return normCache[key];
  const rmax = 4 * n * n + 12, N = 8000, dr = rmax / N; let s = 0;
  for (let i = 0; i < N; i += 1) { const r = (i + 0.5) * dr; const R = Rraw(n, l, r); s += r * r * R * R * dr; }
  normCache[key] = s; return s;
}

export function R_nl(n, l, r) { return Rraw(n, l, r) / Math.sqrt(normSq(n, l)); }
export function radialProb(n, l, r) { const R = Rraw(n, l, r); return r * r * R * R / normSq(n, l); }
export function energy(n) { return -RYDBERG / (n * n); }
export function radialNodes(n, l) { return n - l - 1; }
export function meanRadius(n, l) { return (3 * n * n - l * (l + 1)) / 2; }

export function mostProbableRadius(n, l, N = 4000) {
  const rmax = 4 * n * n + 12; let best = 0, bp = 0; for (let i = 1; i <= N; i += 1) { const r = rmax * i / N; const p = radialProb(n, l, r); if (p > bp) { bp = p; best = r; } } return best;
}

const SPDF = ['s', 'p', 'd', 'f', 'g', 'h'];
export function orbitalLabel(n, l) { return `${n}${SPDF[l] || `(l=${l})`}`; }
