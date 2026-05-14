// Analytic hydrogen orbital |psi_{n,l,m}|^2 on a grid (Bohr units: r in a_0).
// We use the standard form psi = R_{n,l}(r) Y_{l,m}(theta, phi).
// Only the low quantum numbers (n <= 5) are exercised by the playground.
//
// Reference: Eisberg-Resnick Ch. 5 (`eisberg-resnick`); Griffiths QM Ch. 4 (`griffiths-qm`).

const FACT = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880];

function laguerre(n, alpha, x) {
  if (n === 0) return 1;
  if (n === 1) return 1 + alpha - x;
  let L0 = 1, L1 = 1 + alpha - x;
  for (let k = 1; k < n; k += 1) {
    const L2 = ((2 * k + 1 + alpha - x) * L1 - (k + alpha) * L0) / (k + 1);
    L0 = L1; L1 = L2;
  }
  return L1;
}

function plgndr(l, m, x) {
  // Associated Legendre P_l^m(x), |x| <= 1.
  let pmm = 1;
  if (m > 0) {
    const somx2 = Math.sqrt((1 - x) * (1 + x));
    let fact = 1;
    for (let i = 1; i <= m; i += 1) { pmm *= -fact * somx2; fact += 2; }
  }
  if (l === m) return pmm;
  let pmmp1 = x * (2 * m + 1) * pmm;
  if (l === m + 1) return pmmp1;
  let pll = 0;
  for (let ll = m + 2; ll <= l; ll += 1) {
    pll = (x * (2 * ll - 1) * pmmp1 - (ll + m - 1) * pmm) / (ll - m);
    pmm = pmmp1; pmmp1 = pll;
  }
  return pll;
}

// |psi|^2 evaluated at spherical (r, theta, phi). Result is unnormalized.
export function densityAt(r, theta, phi, n, l, m) {
  if (r < 1e-3) r = 1e-3;
  const rho = 2 * r / n;
  const am = Math.abs(m);
  const radialNorm = Math.sqrt(Math.pow(2 / n, 3) * FACT[n - l - 1] / (2 * n * FACT[n + l]));
  const R = radialNorm * Math.exp(-rho / 2) * Math.pow(rho, l) * laguerre(n - l - 1, 2 * l + 1, rho);
  const Plm = plgndr(l, am, Math.cos(theta));
  const angularNorm = Math.sqrt((2 * l + 1) / (4 * Math.PI) * FACT[l - am] / FACT[l + am]);
  const Y = angularNorm * Plm; // m-dependent phase is e^{i m phi}; |Y|^2 drops phi.
  return R * R * Y * Y;
}

// Phase: arg(psi) = m phi (radial and Plm are real for our convention).
export function phaseAt(phi, m) { return m * phi; }

// Energy eigenvalue in eV (hydrogen).
export function energyEV(n) { return -13.605693 / (n * n); }

// Expected <r>/a_0 for the n,l state: (3 n^2 - l (l + 1)) / 2 (Eisberg-Resnick eq 5.106).
export function expectedR(n, l) { return (3 * n * n - l * (l + 1)) / 2; }
