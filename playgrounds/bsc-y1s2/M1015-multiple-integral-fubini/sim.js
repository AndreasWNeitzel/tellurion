// Fubini's theorem made into a volume. For an integrable f on a rectangle
// R = [a,b] x [c,d], the double integral is the volume under the surface
// z = f(x,y), and it can be built by slicing the solid either way:
//
//   int_R f dA = int_a^b ( int_c^d f dy ) dx = int_c^d ( int_a^b f dx ) dy.
//
// Both stacks of slabs fill the same solid, so the two iterated integrals
// agree. We use integrands that are non-negative on [0,pi]^2 so the solid
// sits on the plane and "volume" is literal, not signed.
//
// Reference: Riley, Hobson, Bence, Mathematical Methods for Physics and
// Engineering, 3rd ed., Ch. 10 (multiple integrals).

const PI = Math.PI;

// Each preset: f >= 0 on [0,pi]^2; fRef is max f over the full domain (a
// fixed height scale so the solid does not jump as the region is resized);
// exact(A,B,C,D) is the closed-form integral over [A,B]x[C,D], or null to
// fall back to high-order quadrature.
export const INTEGRANDS = {
  dome: {
    label: 'sin x · sin y',
    f: (x, y) => Math.sin(x) * Math.sin(y),
    fRef: 1,
    exact: (A, B, C, D) => (Math.cos(A) - Math.cos(B)) * (Math.cos(C) - Math.cos(D)),
  },
  slant: {
    // Asymmetric in its two variables (linear in x, a sine hump in y), so the
    // two slicing orders accumulate along visibly different routes before they
    // meet at the same volume.
    label: 'x · sin y / 2',
    f: (x, y) => (x * Math.sin(y)) / 2,
    fRef: PI / 2,
    exact: (A, B, C, D) => ((B * B - A * A) / 2) * (Math.cos(C) - Math.cos(D)) / 2,
  },
  wave: {
    // Genuinely non-separable: cannot be written as g(x) h(y), yet Fubini
    // still holds. A diagonal travelling ridge.
    label: '½(1 + sin(x + y))',
    f: (x, y) => 0.5 * (1 + Math.sin(x + y)),
    fRef: 1,
    exact: null,
  },
};

// Composite Simpson on [a,b] with N panels (N forced even).
function simp(f, a, b, N) {
  const n = N % 2 === 0 ? N : N + 1;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i += 1) s += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
  return (s * h) / 3;
}

export function integrand(id) { return INTEGRANDS[id] || INTEGRANDS.dome; }
export function fAt(id, x, y) { return integrand(id).f(x, y); }

// Inner integrals (the cross-section areas of the solid).
// areaAtX: slab at fixed x, integrate over y  -> A(x) = int_C^D f(x,y) dy.
// areaAtY: slab at fixed y, integrate over x  -> A(y) = int_A^B f(x,y) dx.
export function areaAtX(id, x, C, D, N = 96) {
  const f = integrand(id).f;
  return simp((y) => f(x, y), C, D, N);
}
export function areaAtY(id, y, A, B, N = 96) {
  const f = integrand(id).f;
  return simp((x) => f(x, y), A, B, N);
}

// Iterated double integral in a chosen order. order 'dydx' integrates y
// (inner) then x (outer); 'dxdy' integrates x then y. Both must agree.
export function iterate(id, order, A, B, C, D, N = 96) {
  const f = integrand(id).f;
  if (order === 'dxdy') return simp((y) => simp((x) => f(x, y), A, B, N), C, D, N);
  return simp((x) => simp((y) => f(x, y), C, D, N), A, B, N);
}

// Reference value: closed form when available, else fine quadrature.
export function exactValue(id, A, B, C, D) {
  const I = integrand(id);
  return I.exact ? I.exact(A, B, C, D) : iterate(id, 'dydx', A, B, C, D, 400);
}
