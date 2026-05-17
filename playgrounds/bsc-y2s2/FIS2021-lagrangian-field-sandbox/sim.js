// Lagrangian sandbox: a few canonical systems whose Euler-Lagrange
// equations are derived in closed form, with the conserved
// quantities Noether's theorem predicts. Time integration is the
// verified shared RK4 engine (shared/js/engine/ode-rk.js); this file
// supplies the right-hand sides, the energies and the momenta.
//
//  pendulum  q=[th,thd]   L = 1/2 m l^2 thd^2 + m g l cos th
//  double    q=[t1,t2,w1,w2]  the standard double pendulum
//  spring    q=[r,th,rd,thd]  elastic pendulum (radial spring k,l0)
//  kepler    q=[x,y,vx,vy]    central -mu/r potential (planar)
//
// Conserved: H for all (time-translation); angular momentum for the
// rotationally symmetric kepler/spring; linear momentum for a free
// particle. Headless, deterministic. Reference: Goldstein, Poole and
// Safko, Classical Mechanics (3rd ed.), Ch. 1-3 (`goldstein-mech`);
// Landau and Lifshitz, Mechanics (3rd ed.), Sec. 1-7
// (`landau-mechanics`).

export function pendulumPeriodSmall(l, g) { return 2 * Math.PI * Math.sqrt(l / g); }

// Right-hand side y' = f(y) for each system. p holds parameters.
export function makeRhs(system, p) {
  if (system === 'pendulum') {
    return (t, y, out) => { out[0] = y[1]; out[1] = -(p.g / p.l) * Math.sin(y[0]); };
  }
  if (system === 'double') {
    const { m1, m2, L1, L2, g } = p;
    return (t, y, out) => {
      const [a1, a2, w1, w2] = y;
      const d = a1 - a2, s = Math.sin(d), c = Math.cos(d);
      const den = 2 * m1 + m2 - m2 * Math.cos(2 * d);
      out[0] = w1; out[1] = w2;
      out[2] = (-g * (2 * m1 + m2) * Math.sin(a1) - m2 * g * Math.sin(a1 - 2 * a2)
        - 2 * s * m2 * (w2 * w2 * L2 + w1 * w1 * L1 * c)) / (L1 * den);
      out[3] = (2 * s * (w1 * w1 * L1 * (m1 + m2) + g * (m1 + m2) * Math.cos(a1)
        + w2 * w2 * L2 * m2 * c)) / (L2 * den);
    };
  }
  if (system === 'spring') {
    const { m, k, l0, g } = p;
    return (t, y, out) => {
      const [r, th, rd, thd] = y;
      out[0] = rd; out[1] = thd;
      out[2] = r * thd * thd - (k / m) * (r - l0) + g * Math.cos(th);
      out[3] = (-g * Math.sin(th) - 2 * rd * thd) / r;
    };
  }
  // kepler: central force -mu r / |r|^3
  const mu = p.mu;
  return (t, y, out) => {
    const [x, yy, vx, vy] = y;
    const r3 = (x * x + yy * yy) ** 1.5 + 1e-12;
    out[0] = vx; out[1] = vy;
    out[2] = -mu * x / r3; out[3] = -mu * yy / r3;
  };
}

export function energy(system, y, p) {
  if (system === 'pendulum') {
    const [th, thd] = y;
    return 0.5 * p.m * p.l * p.l * thd * thd - p.m * p.g * p.l * Math.cos(th);
  }
  if (system === 'double') {
    const { m1, m2, L1, L2, g } = p;
    const [a1, a2, w1, w2] = y;
    const T = 0.5 * m1 * (L1 * w1) ** 2
      + 0.5 * m2 * ((L1 * w1) ** 2 + (L2 * w2) ** 2 + 2 * L1 * L2 * w1 * w2 * Math.cos(a1 - a2));
    const V = -(m1 + m2) * g * L1 * Math.cos(a1) - m2 * g * L2 * Math.cos(a2);
    return T + V;
  }
  if (system === 'spring') {
    const { m, k, l0, g } = p;
    const [r, th, rd, thd] = y;
    return 0.5 * m * (rd * rd + r * r * thd * thd) - m * g * r * Math.cos(th)
      + 0.5 * k * (r - l0) ** 2;
  }
  const [x, yy, vx, vy] = y;
  return 0.5 * (vx * vx + vy * vy) - p.mu / Math.sqrt(x * x + yy * yy);
}

// Angular momentum (per unit mass) for the rotationally symmetric
// systems; null when rotation is not a symmetry.
export function angularMomentum(system, y) {
  if (system === 'kepler') { const [x, yy, vx, vy] = y; return x * vy - yy * vx; }
  if (system === 'spring') { const [r, , , thd] = y; return r * r * thd; }
  return null;
}

// Small-oscillation eigenfrequencies of the equal-mass equal-length
// double pendulum: omega^2 = (2 -+ sqrt2)(g/L).
export function doublePendulumModes(L, g) {
  return [Math.sqrt((2 - Math.SQRT2) * g / L), Math.sqrt((2 + Math.SQRT2) * g / L)];
}
