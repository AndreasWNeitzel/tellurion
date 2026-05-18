// Close-binary Roche geometry and conservative mass transfer
// (Eggleton 1983; Frank, King and Raine, Accretion Power in
// Astrophysics; Hilditch). The corotating Roche potential gives the
// Lagrange points and the figure-eight critical surface; the Eggleton
// formula gives the volume-equivalent Roche-lobe radius; conservative
// transfer holds the total mass and orbital angular momentum fixed and
// changes the separation and period. SI units; a in metres, M in kg.

export const G = 6.674e-11, MSUN = 1.98892e30, RSUN = 6.957e8;
export const AU = 1.495978707e11, DAY = 86400;

// Eggleton (1983) volume-equivalent Roche-lobe radius, r_L / a, for the
// star whose companion mass ratio is q = M_this / M_companion.
export function eggletonRL(q) {
  const q23 = Math.cbrt(q * q), q13 = Math.cbrt(q);
  return 0.49 * q23 / (0.6 * q23 + Math.log(1 + q13));
}

// Dimensionless Roche potential in the corotating frame: a = 1,
// G(M1+M2) = 1, Omega^2 = 1. M1 at x = -m2, M2 at x = +m1, where
// m1 = M1/Mtot, m2 = M2/Mtot. Phi = -m1/r1 - m2/r2 - (x^2+y^2)/2.
export function fracs(M1, M2) {
  const Mt = M1 + M2;
  return { m1: M1 / Mt, m2: M2 / Mt, x1: -M2 / Mt, x2: M1 / Mt };
}
export function rochePotential(x, y, M1, M2) {
  const { m1, m2, x1, x2 } = fracs(M1, M2);
  const r1 = Math.hypot(x - x1, y) || 1e-12;
  const r2 = Math.hypot(x - x2, y) || 1e-12;
  return -m1 / r1 - m2 / r2 - 0.5 * (x * x + y * y);
}
// d(Phi)/dx along y = 0 (the line of centres).
function dPhidx(x, M1, M2) {
  const { m1, m2, x1, x2 } = fracs(M1, M2);
  const a = x - x1, b = x - x2;
  return m1 * Math.sign(a) / (a * a) + m2 * Math.sign(b) / (b * b) - x;
}
function bisectRoot(f, lo, hi, it = 120) {
  let flo = f(lo);
  for (let i = 0; i < it; i += 1) {
    const mid = 0.5 * (lo + hi), fm = f(mid);
    if (flo * fm <= 0) hi = mid; else { lo = mid; flo = fm; }
  }
  return 0.5 * (lo + hi);
}

// The five Lagrange points (a = 1 units). L1 between the stars, L2
// beyond M2, L3 beyond M1, L4/L5 the equilateral points.
export function lagrangePoints(M1, M2) {
  const { x1, x2 } = fracs(M1, M2);
  const eps = 1e-7;
  const L1 = bisectRoot((x) => dPhidx(x, M1, M2), x1 + eps, x2 - eps);
  const L2 = bisectRoot((x) => dPhidx(x, M1, M2), x2 + eps, x2 + 3);
  const L3 = bisectRoot((x) => dPhidx(x, M1, M2), x1 - 3, x1 - eps);
  // L4/L5: equilateral triangle with the two masses (exact for any q)
  const xm = 0.5 * (x1 + x2), d = Math.abs(x2 - x1);
  const L45y = Math.sqrt(3) / 2 * d;
  return {
    L1: [L1, 0], L2: [L2, 0], L3: [L3, 0],
    L4: [xm, L45y], L5: [xm, -L45y],
  };
}
export function criticalPotential(M1, M2) {
  const { L1 } = lagrangePoints(M1, M2);
  return rochePotential(L1[0], 0, M1, M2);
}

// Kepler third law and the circular orbital angular momentum.
export const keplerPeriod = (Mt, a) => 2 * Math.PI * Math.sqrt(a ** 3 / (G * Mt));
export const orbitalJ = (M1, M2, a) => M1 * M2 * Math.sqrt(G * a / (M1 + M2));

// Conservative transfer of dm from the donor (M1) to the accretor
// (M2): total mass and J fixed. From J ~ M1 M2 sqrt(a) at fixed Mtot,
// a_new = a (M1 M2 / M1' M2')^2.
export function conservativeTransfer(M1, M2, a, dm) {
  const M1n = M1 - dm, M2n = M2 + dm;
  const an = a * ((M1 * M2) / (M1n * M2n)) ** 2;
  return {
    M1: M1n, M2: M2n, a: an,
    P: keplerPeriod(M1n + M2n, an),
    J: orbitalJ(M1n, M2n, an),
    dlnA: Math.log(an / a),
  };
}

// Roche-lobe radius response exponent zeta_L = d ln R_L / d ln M1 under
// conservative transfer (donor = M1). R_L = a * eggleton(M1/M2).
export function zetaLobe(M1, M2, a) {
  const h = M1 * 1e-5;
  const rL = (m1) => {
    const m2 = M2 + (M1 - m1);                          // conservative
    const an = a * ((M1 * M2) / (m1 * m2)) ** 2;
    return an * eggletonRL(m1 / m2);
  };
  return (Math.log(rL(M1 + h)) - Math.log(rL(M1 - h))) / (Math.log(M1 + h) - Math.log(M1 - h));
}

// Classify the system given the donor radius and its mass-radius
// exponent zeta_star = d ln R / d ln M.
export function classify(M1, M2, a, Rdonor, zetaStar) {
  const RL = a * eggletonRL(M1 / M2);
  if (Rdonor < RL * 0.999) return { state: 'detached', RL, fill: Rdonor / RL };
  const zL = zetaLobe(M1, M2, a);
  if (zetaStar >= zL) return { state: 'stable transfer', RL, fill: Rdonor / RL, zetaL: zL };
  return { state: 'common envelope', RL, fill: Rdonor / RL, zetaL: zL };
}

// Equipotential contour of value phi0 around a centre cx (one of the
// stars), returned as an (x,y) ring for drawing the lobe. Along a ray
// the Roche potential rises from -infinity at the star, reaches a
// maximum, then falls; the lobe boundary is the first outward crossing
// of phi0, found by a radial scan plus bisection.
export function equipotentialRing(M1, M2, phi0, cx, nTheta = 240, rMax = 3) {
  const xs = new Float64Array(nTheta), ys = new Float64Array(nTheta);
  const nScan = 400;
  for (let i = 0; i < nTheta; i += 1) {
    const th = 2 * Math.PI * i / nTheta;
    const ct = Math.cos(th), sn = Math.sin(th);
    const g = (r) => rochePotential(cx + r * ct, r * sn, M1, M2) - phi0;
    let r = NaN, prevR = 1e-4, prevG = g(prevR);
    for (let k = 1; k <= nScan; k += 1) {
      const rr = 1e-4 + (rMax - 1e-4) * k / nScan, gg = g(rr);
      if (prevG < 0 && gg >= 0) {                          // first upward crossing
        let lo = prevR, hi = rr;
        for (let b = 0; b < 60; b += 1) {
          const mid = 0.5 * (lo + hi);
          if (g(lo) * g(mid) <= 0) hi = mid; else lo = mid;
        }
        r = 0.5 * (lo + hi);
        break;
      }
      prevR = rr; prevG = gg;
    }
    xs[i] = Number.isNaN(r) ? NaN : cx + r * ct;
    ys[i] = Number.isNaN(r) ? NaN : r * sn;
  }
  return { xs, ys };
}
