// Two-body elastic scattering reduced to one body of mass mu in a
// central potential. Headless and deterministic. The relative
// coordinate r feels the force; the centre of mass drifts uniformly.
// Hard sphere and the Coulomb / inverse-square law have closed forms;
// the screened Yukawa potential is integrated (RK4) to get the
// deflection function chi(b). The CM scattering angle and the
// differential cross section follow from chi(b):
//   d sigma / d Omega = (b / sin chi) |db / d chi|.
// Reference: Goldstein, Classical Mechanics (3rd ed.), Ch. 3.7;
// Landau and Lifshitz, Mechanics (3rd ed.), Sec. 18-19.

export function reducedMass(m1, m2) { return m1 * m2 / (m1 + m2); }

// Hard-sphere CM deflection: chi = pi - 2 arcsin(b/R) for b < R, else 0.
export function chiHardSphere(b, R) {
  return b >= R ? 0 : Math.PI - 2 * Math.asin(Math.max(-1, Math.min(1, b / R)));
}
export function dsigmaHardSphere(R) { return (R * R) / 4; }   // isotropic in CM

// Repulsive Coulomb / inverse-square: cot(chi/2) = 2 b E / alpha,
// so chi = 2 arccot(2 b E / alpha). alpha = strength, E = 1/2 mu v0^2.
export function chiCoulomb(b, alpha, E) {
  if (b <= 0) return Math.PI;
  return 2 * Math.atan2(alpha, 2 * b * E);
}
// Rutherford differential cross section.
export function dsigmaRutherford(chi, alpha, E) {
  const s = Math.sin(chi / 2);
  return (alpha / (4 * E)) ** 2 / Math.max(1e-12, s * s * s * s);
}

// Yukawa V(r) = (alpha / r) exp(-r / lambda). Numerically integrate the
// relative-coordinate orbit from far away with impact parameter b and
// asymptotic speed v0; return the asymptotic deflection angle (CM).
export function chiYukawa(b, alpha, lambda, mu, v0) {
  // Start several screening lengths out (where V is negligible) but cap
  // r0 so the encounter integrates fully. Velocity-Verlet on (x,y).
  const r0 = Math.max(16, Math.min(80, 7 * lambda));
  let x = -r0, y = b, vx = v0, vy = 0;
  // dt 0.001 -> 0.002, cap 4e5 -> 8e4. Velocity-Verlet on the smooth
  // Yukawa force is stable at this step and the deflection function
  // stays monotone; combined with caching the curve in the playground
  // (it was being recomputed ~180x every frame) this removes the lag.
  const dt = 0.002;
  const acc = (px, py) => {
    const r = Math.hypot(px, py) || 1e-9;
    // V = (alpha/r) e^{-r/lam}; F_r = -dV/dr = alpha e^{-r/lam}(1/r^2 + 1/(r lam)).
    const Fr = alpha * Math.exp(-r / lambda) * (1 / (r * r) + 1 / (r * lambda));
    return [Fr * px / r / mu, Fr * py / r / mu];
  };
  let a = acc(x, y);
  for (let i = 0; i < 80000; i += 1) {
    x += vx * dt + 0.5 * a[0] * dt * dt;
    y += vy * dt + 0.5 * a[1] * dt * dt;
    const a2 = acc(x, y);
    vx += 0.5 * (a[0] + a2[0]) * dt;
    vy += 0.5 * (a[1] + a2[1]) * dt;
    a = a2;
    if (x > r0 && vx > 0) break;
  }
  return Math.abs(Math.atan2(vy, vx));
}

export function chiOf(b, p) {
  if (p.kind === 'hard') return chiHardSphere(b, p.R);
  if (p.kind === 'coulomb') return chiCoulomb(b, p.alpha, p.E);
  return chiYukawa(b, p.alpha, p.lambda, p.mu, p.v0);
}

// One relative-coordinate trajectory for the chosen potential (for the
// animated lab/CM view). Returns array of [x, y] of the relative vector.
export function relTrajectory(b, p) {
  const r0 = 26;
  let x = -r0, y = b, vx = p.v0, vy = 0;
  const dt = 0.004;
  const pts = [[x, y]];
  if (p.kind === 'hard') {
    // Exact elastic hard sphere: free flight with a single specular
    // reflection off the circle r = R (the impulsive collision). The
    // old stiff-spring barely deflected, so the collision was
    // invisible; this gives a sharp, unmistakable bounce. b >= R is a
    // clean miss (chi = 0), which is physically correct.
    let bounced = false;
    for (let i = 0; i < 20000; i += 1) {
      const nx = x + vx * dt, ny = y + vy * dt;
      if (!bounced && b < p.R && nx * nx + ny * ny <= p.R * p.R) {
        const dx = nx - x, dy = ny - y;
        const A = dx * dx + dy * dy;
        const B = 2 * (x * dx + y * dy);
        const C = x * x + y * y - p.R * p.R;
        const s = (-B - Math.sqrt(Math.max(0, B * B - 4 * A * C))) / (2 * A);
        const cxp = x + s * dx, cyp = y + s * dy;        // contact on the sphere
        const inv = 1 / (Math.hypot(cxp, cyp) || 1e-9);
        const nX = cxp * inv, nY = cyp * inv;            // outward normal
        const vn = vx * nX + vy * nY;
        vx -= 2 * vn * nX; vy -= 2 * vn * nY;            // specular reflection
        x = cxp; y = cyp; bounced = true;
        pts.push([x, y]);                                // sharp corner
        continue;
      }
      x = nx; y = ny;
      if (i % 3 === 0) pts.push([x, y]);
      if (x > r0 && i > 50) break;
    }
    return pts;
  }
  const force = (px, py) => {
    const r = Math.hypot(px, py) || 1e-9;
    let dV;
    if (p.kind === 'coulomb') dV = -p.alpha / (r * r);
    else dV = -p.alpha * Math.exp(-r / p.lambda) * (1 / (r * r) + 1 / (r * p.lambda));
    const Fr = -dV;
    return [Fr * px / r / p.mu, Fr * py / r / p.mu];
  };
  // Velocity-Verlet: second order, so the displayed orbit conserves the
  // asymptotic speed (elastic scattering) to far better than semi-implicit
  // Euler, even through the close Coulomb approach.
  let a = force(x, y);
  for (let i = 0; i < 20000; i += 1) {
    x += vx * dt + 0.5 * a[0] * dt * dt;
    y += vy * dt + 0.5 * a[1] * dt * dt;
    const a2 = force(x, y);
    vx += 0.5 * (a[0] + a2[0]) * dt;
    vy += 0.5 * (a[1] + a2[1]) * dt;
    a = a2;
    if (i % 3 === 0) pts.push([x, y]);
    if (x > r0 && i > 50) break;
  }
  return pts;
}
