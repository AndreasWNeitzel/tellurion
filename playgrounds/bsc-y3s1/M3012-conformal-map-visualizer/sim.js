// sim.js
// Conformal maps. An analytic complex function w = f(z) maps the z-plane to the
// w-plane, and wherever f'(z) != 0 it is conformal: it preserves the angle between
// any two crossing curves, because near a point f acts as a rotation by arg f'(z)
// and a uniform scaling by |f'(z)|. At a critical point f'(z) = 0 conformality
// fails and angles are multiplied (doubled for a simple zero of f'). The local
// area is scaled by |f'(z)|^2.
//
// Reference: Ablowitz and Fokas, Complex Variables, 2nd ed., Ch. 5; Needham,
// Visual Complex Analysis, Ch. 4.

export const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
export const cexp = (z) => { const e = Math.exp(z[0]); return [e * Math.cos(z[1]), e * Math.sin(z[1])]; };
export const cabs = (z) => Math.hypot(z[0], z[1]);

export const FUNCS = {
  square: { label: 'w = z^2', f: (z) => cmul(z, z), df: (z) => [2 * z[0], 2 * z[1]], zE: 1.7, critical: [[0, 0]] },
  inverse: { label: 'w = 1 / z', f: (z) => cdiv([1, 0], z), df: (z) => cmul([-1, 0], cdiv([1, 0], cmul(z, z))), zE: 2.0, poles: [[0, 0]] },
  exp: { label: 'w = e^z', f: (z) => cexp(z), df: (z) => cexp(z), zE: 2.4, critical: [] },
  mobius: { label: 'w = (z - 1)/(z + 1)', f: (z) => cdiv(csub(z, [1, 0]), cadd(z, [1, 0])), df: (z) => cdiv([2, 0], cmul(cadd(z, [1, 0]), cadd(z, [1, 0]))), zE: 2.2, poles: [[-1, 0]] },
  joukowski: { label: 'w = z + 1/z', f: (z) => cadd(z, cdiv([1, 0], z)), df: (z) => csub([1, 0], cdiv([1, 0], cmul(z, z))), zE: 2.2, critical: [[1, 0], [-1, 0]], poles: [[0, 0]] },
};

// angle between the images of two given directions at z0 under f (finite
// difference), which stays at the input angle wherever f is conformal.
export function imageAngle(fn, z0, dir1, dir2, h = 1e-4) {
  const i1 = csub(fn.f(cadd(z0, [dir1[0] * h, dir1[1] * h])), fn.f(z0));
  const i2 = csub(fn.f(cadd(z0, [dir2[0] * h, dir2[1] * h])), fn.f(z0));
  let a = Math.atan2(i2[1], i2[0]) - Math.atan2(i1[1], i1[0]);
  while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}
