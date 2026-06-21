// sim.js
// The determinant of a 2x2 matrix as the signed area scaling of the linear map.
// With columns v1 = (a, b) and v2 = (c, d), the map sends the unit square to the
// parallelogram they span, and
//   det = a d - b c = signed area of that parallelogram = |v1||v2| sin(angle).
// It is positive when v2 is counterclockwise from v1, negative when the map
// reverses orientation, and zero when the columns are linearly dependent (the
// parallelogram collapses to a line). Every unit cell of the plane has its area
// multiplied by |det|, which is why |det| is the area-scaling factor (and in
// three dimensions the volume-scaling factor) and the heart of the Jacobian.
//
// Reference: Strang, Linear Algebra and its Applications, Ch. 5; Lay, Linear
// Algebra, Sec. 3.3 (Cramer's rule, volume, and linear transformations).

export function det2(a, b, c, d) { return a * d - b * c; }     // columns (a,b), (c,d)

// Shoelace area of the image of the unit square (an independent area check).
export function parallelogramArea(a, b, c, d) {
  const p = [[0, 0], [a, b], [a + c, b + d], [c, d]];
  let s = 0; for (let i = 0; i < 4; i += 1) { const j = (i + 1) % 4; s += p[i][0] * p[j][1] - p[j][0] * p[i][1]; }
  return Math.abs(s) / 2;
}

export function imageCorners(a, b, c, d) { return [[0, 0], [a, b], [a + c, b + d], [c, d]]; }

// Signed angle from v1 to v2 (counterclockwise positive).
export function angleBetween(a, b, c, d) {
  const cross = a * d - b * c, dot = a * c + b * d;
  return Math.atan2(cross, dot);
}

// Apply the matrix M = [[a, c], [b, d]] to a point.
export function apply(a, b, c, d, x, y) { return [a * x + c * y, b * x + d * y]; }

export const PRESETS = {
  identity: { label: 'identity (det 1)', a: 1, b: 0, c: 0, d: 1 },
  rotation: { label: 'rotation (det 1)', a: Math.cos(0.7), b: Math.sin(0.7), c: -Math.sin(0.7), d: Math.cos(0.7) },
  shear: { label: 'shear (det 1)', a: 1, b: 0, c: 0.8, d: 1 },
  scale: { label: 'scaling (det 2.25)', a: 1.5, b: 0, c: 0, d: 1.5 },
  reflect: { label: 'reflection (det -1)', a: 1, b: 0, c: 0, d: -1 },
  singular: { label: 'singular (det 0)', a: 1, b: 0.5, c: 2, d: 1 },
};
