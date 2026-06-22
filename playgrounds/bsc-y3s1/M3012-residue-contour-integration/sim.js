// sim.js
// The residue theorem. For a function f analytic except at isolated poles, the
// integral around a closed contour C equals 2 pi i times the sum of the residues
// of the poles enclosed:
//   oint_C f(z) dz = 2 pi i  sum_{z_k inside C} Res(f, z_k).
// Sweep a circle outward and the integral is flat between poles and jumps by
// 2 pi i Res each time the contour swallows another pole.
//
// Reference: Ablowitz and Fokas, Complex Variables, 2nd ed., Ch. 4; Arfken,
// Weber, Harris, Mathematical Methods for Physicists, 7th ed., Sec. 11.8.

export const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
export const cabs = (z) => Math.hypot(z[0], z[1]);

export const FUNCS = {
  twoPoles: { label: 'f = z / ((z-1)(z+2))', f: (z) => cdiv(z, cmul(csub(z, [1, 0]), cadd(z, [2, 0]))), poles: [[1, 0], [-2, 0]] },
  imagPair: { label: 'f = 1 / (z^2 + 1)', f: (z) => cdiv([1, 0], cadd(cmul(z, z), [1, 0])), poles: [[0, 1], [0, -1]] },
  threeReal: { label: 'f = 1 / ((z-0.8)(z-1.8)(z+2.6))', f: (z) => cdiv([1, 0], cmul(cmul(csub(z, [0.8, 0]), csub(z, [1.8, 0])), cadd(z, [2.6, 0]))), poles: [[0.8, 0], [1.8, 0], [-2.6, 0]] },
  cubic: { label: 'f = 1 / (z^3 - z)', f: (z) => cdiv([1, 0], csub(cmul(cmul(z, z), z), z)), poles: [[0, 0], [1, 0], [-1, 0]] },
};

// numeric contour integral oint_C f dz around the circle centre + R e^{i theta}.
export function contourIntegral(fn, center, R, N = 4000) {
  let sre = 0, sim = 0; const dt = 2 * Math.PI / N;
  for (let i = 0; i < N; i += 1) { const th = (i + 0.5) * dt; const c = Math.cos(th), s = Math.sin(th); const z = [center[0] + R * c, center[1] + R * s]; const fz = fn.f(z); const dz = [-R * s * dt, R * c * dt]; sre += fz[0] * dz[0] - fz[1] * dz[1]; sim += fz[0] * dz[1] + fz[1] * dz[0]; }
  return [sre, sim];
}

// residue at a (simple) pole p by a small contour integral, Res = (1/2 pi i) oint.
export function residueAt(fn, p, rs = 2e-3, N = 600) {
  const I = contourIntegral(fn, p, rs, N); // = 2 pi i Res
  return [I[1] / (2 * Math.PI), -I[0] / (2 * Math.PI)]; // divide by 2 pi i
}

// sum of residues of the poles strictly inside the contour, and the theorem value.
export function enclosedResidueSum(fn, center, R) {
  let re = 0, im = 0; for (const p of fn.poles) if (cabs(csub(p, center)) < R) { const r = residueAt(fn, p); re += r[0]; im += r[1]; }
  return [re, im];
}
export function residueTheoremValue(fn, center, R) { const s = enclosedResidueSum(fn, center, R); return [-2 * Math.PI * s[1], 2 * Math.PI * s[0]]; } // 2 pi i * s
