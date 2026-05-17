// Tight-binding band structure. One-band 1D chain
//   E(k) = eps0 - 2 t cos(k a),
// width 4t, group velocity (2 t a / hbar) sin(k a), curvature
// 2 t a^2 cos(k a) so the band-edge effective mass is
// m* = hbar^2 / (2 t a^2). The dimerized (SSH) chain has the 2x2
// Bloch Hamiltonian off-diagonal t1 + t2 e^{-i k a}, eigenvalues
//   E_pm = +- sqrt(t1^2 + t2^2 + 2 t1 t2 cos k a),
// a gap 2 |t1 - t2| at the zone boundary. The 2D square lattice has
//   E(kx,ky) = eps0 - 2 t (cos kx a + cos ky a),
// a saddle (van Hove) at (pi,0). Units a = hbar = 1. Headless,
// deterministic. Reference: Kittel, Introduction to Solid State
// Physics (8th ed.), Ch. 7-9 (`kittel-cm`); Ashcroft and Mermin,
// Solid State Physics, Ch. 10 (`ashcroft-mermin`).

export function E1D(k, t, eps0 = 0, a = 1) { return eps0 - 2 * t * Math.cos(k * a); }
export function vGroup1D(k, t, a = 1) { return 2 * t * a * Math.sin(k * a); }
export function curvature1D(k, t, a = 1) { return 2 * t * a * a * Math.cos(k * a); }
export function effMassBottom(t, a = 1) { return 1 / (2 * t * a * a); }   // hbar^2 / (2 t a^2)

// Dimerized (SSH) two-band dispersion and its 2x2 Bloch matrix.
export function sshBands(k, t1, t2, a = 1) {
  const re = t1 + t2 * Math.cos(k * a), im = -t2 * Math.sin(k * a);
  const mag = Math.hypot(re, im);
  return { plus: mag, minus: -mag };
}
export function sshGap(t1, t2) { return 2 * Math.abs(t1 - t2); }

export function E2D(kx, ky, t, eps0 = 0, a = 1) {
  return eps0 - 2 * t * (Math.cos(kx * a) + Math.cos(ky * a));
}

// 1D tight-binding density of states per unit cell:
// g(E) = 1 / (pi sqrt((2t)^2 - (E - eps0)^2)) on the band, else 0.
export function dos1D(E, t, eps0 = 0) {
  const x = E - eps0, w = 2 * t;
  const d = w * w - x * x;
  return d <= 0 ? 0 : 1 / (Math.PI * Math.sqrt(d));
}

// Band filling (fraction of states below E_F) for the 1D band, from
// the closed form k_F = (1/a) arccos(-(E_F - eps0)/2t), filling
// = k_F / pi (two states per k by spin folded out; one band).
export function filling1D(EF, t, eps0 = 0, a = 1) {
  const x = (EF - eps0) / (2 * t);
  if (x <= -1) return 0;
  if (x >= 1) return 1;
  return Math.acos(-x) / Math.PI;
}

// 2D Fermi-surface contour points E2D(kx,ky) = EF, returned as a
// list of [kx,ky] from marching a fine grid (for drawing/tests).
export function fermiSurface2D(EF, t, eps0 = 0, a = 1, N = 200) {
  const pts = [];
  const f = (kx, ky) => E2D(kx, ky, t, eps0, a) - EF;
  for (let i = 0; i < N; i += 1) {
    const kx = -Math.PI + (i / N) * 2 * Math.PI;
    const kx2 = -Math.PI + ((i + 1) / N) * 2 * Math.PI;
    for (let j = 0; j < N; j += 1) {
      const ky = -Math.PI + (j / N) * 2 * Math.PI;
      // detect a sign change along the cell's bottom edge
      if (f(kx, ky) * f(kx2, ky) < 0) {
        const tt = f(kx, ky) / (f(kx, ky) - f(kx2, ky));
        pts.push([kx + tt * (kx2 - kx), ky]);
      }
    }
  }
  return pts;
}

// Real-space Bloch amplitude Re[ e^{i k x} u ] sampled on the chain
// (u taken constant = 1 for the single s-band): a cosine of period
// 2 pi / k. Used by the playground only.
export function blochWave(x, k) { return Math.cos(k * x); }
