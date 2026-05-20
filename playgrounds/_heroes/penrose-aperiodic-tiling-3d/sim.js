// Headless physics for the Penrose-tiling hero. We build a P3
// rhombus tiling by Conway-Penrose deflation, starting from a
// "sun" patch of 10 acute golden gnomon (A) triangles around the
// centre. Each deflation step expands each tile into a sum of
// smaller tiles using the golden-ratio splits:
//
//   A (acute  36 72 72): -> A + B               (Preshing 2011)
//   B (obtuse 108 36 36): -> A + 2 B
//
// (Senechal, Quasicrystals and Geometry, CUP 1995, Ch. 6.) The
// substitution matrix is [[1, 1], [1, 2]], dominant eigenvalue
// phi^2 = phi + 1, and the leading eigenvector has ratio
// A/B = 1/phi. Some references swap A and B and the matrix
// becomes [[2, 1], [1, 1]] giving A/B = phi. We choose the
// convention that the abundant tile is type B (obtuse, thin
// rhombus) so the limit A/B = 1/phi, equivalently B/A = phi.
//
// References:
//   Penrose, Bull. Inst. Math. Appl. 10 (1974) 266.
//   Senechal, Quasicrystals and Geometry, CUP 1995, Ch. 6.
//   `senechal-quasicrystals`.
//   Preshing 2011 (https://preshing.com/20110831/penrose-tiling-explained/).

export const PHI = (1 + Math.sqrt(5)) / 2;
const G = PHI;

function lerp(p, q, t) {
  return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
}

// Initial Sun patch: 10 A triangles arranged around the center.
// Each triangle has apex at the origin (36 deg) and two equal
// unit-length sides going to consecutive 36-deg-spaced points on
// the unit circle.
export function sunSeed() {
  const triangles = [];
  for (let i = 0; i < 10; i++) {
    const p0 = { x: 0, y: 0 };
    const a = (i / 10) * 2 * Math.PI;
    const b = ((i + 1) / 10) * 2 * Math.PI;
    const p1 = { x: Math.cos(a), y: Math.sin(a) };
    const p2 = { x: Math.cos(b), y: Math.sin(b) };
    // Alternate chirality so adjacent triangles share an edge with
    // matching deflation rules.
    if (i % 2 === 0) triangles.push({ type: 'A', p0, p1, p2 });
    else triangles.push({ type: 'A', p0, p1: p2, p2: p1 });
  }
  return triangles;
}

// Subdivide one triangle. We follow Preshing's (2011) explicit
// rules:
//
//   A (apex p0 = 36 deg, base p1 p2 = 72 deg each): subdivides into
//     1 B (the central piece) + 1 A (the outer piece on the p1
//     side). The cut is at point P on edge p0 p1 such that
//     |p0 P| = |p0 p1| / phi.
//
//   B (apex p0 = 108 deg, base p1 p2 = 36 deg each): subdivides into
//     2 B + 1 A. Two cuts are made: Q on edge p0 p1 at
//     |p0 Q| = |p0 p1| / phi from p0, and R on edge p1 p2 at
//     |p1 R| = |p1 p2| / phi from p1.
function subdivide(tri) {
  const { type, p0, p1, p2 } = tri;
  if (type === 'A') {
    const P = lerp(p0, p1, 1 / G);
    return [
      { type: 'B', p0: P, p1: p0, p2: p2 },
      { type: 'A', p0: p2, p1: P, p2: p1 },
    ];
  } else {
    // type === 'B'
    const Q = lerp(p1, p0, 1 / G);
    const R = lerp(p1, p2, 1 / G);
    return [
      { type: 'B', p0: R, p1: p2, p2: p0 },
      { type: 'B', p0: Q, p1: R, p2: p1 },
      { type: 'A', p0: R, p1: Q, p2: p0 },
    ];
  }
}

export function buildTiling(N = 4) {
  let triangles = sunSeed();
  for (let i = 0; i < N; i++) {
    const next = [];
    for (const t of triangles) {
      const kids = subdivide(t);
      for (const k of kids) next.push(k);
    }
    triangles = next;
  }
  return triangles;
}

export function countByType(triangles) {
  let a = 0, b = 0;
  for (const t of triangles) {
    if (t.type === 'A') a++;
    else b++;
  }
  // ratio of the rarer (A) to the more abundant (B). Converges to
  // 1/phi from above as the tiling grows.
  return { A: a, B: b, total: a + b, ratio: a / Math.max(1, b) };
}

// Triangle area.
export function triangleArea({ p0, p1, p2 }) {
  return 0.5 * Math.abs((p1.x - p0.x) * (p2.y - p0.y) - (p2.x - p0.x) * (p1.y - p0.y));
}

// Total covered area.
export function totalArea(triangles) {
  let s = 0;
  for (const t of triangles) s += triangleArea(t);
  return s;
}
