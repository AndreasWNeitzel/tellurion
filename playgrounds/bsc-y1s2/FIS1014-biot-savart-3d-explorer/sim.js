// Biot-Savart magnetic field of arbitrary current loops/segments.
// Headless and deterministic. A "wire" is a polyline carrying current
// I; it is discretized into dl elements and summed:
//   B(r) = (mu0 I / 4 pi) sum  dl x (r - r') / |r - r'|^3.
// Units: mu0 / 4 pi = 1. Closed-form references the tests check:
//   straight wire   |B| = 2 I / s          (mu0/2pi with our units)
//   loop on axis    Bz = 2 pi I R^2 / (R^2 + z^2)^{3/2}
//   ideal solenoid  Bz = 4 pi n I (interior)
// Reference: Griffiths, Introduction to Electrodynamics (4th ed.),
// Sec. 5.2; Jackson, Classical Electrodynamics, Sec. 5.3.

export const K = 1; // mu0 / 4 pi

// segments: array of { pts:[[x,y,z]...], I }
export function biotSavart(segments, P) {
  let bx = 0, by = 0, bz = 0;
  for (const seg of segments) {
    const p = seg.pts, I = seg.I;
    for (let i = 0; i < p.length - 1; i += 1) {
      const a = p[i], b = p[i + 1];
      const dlx = b[0] - a[0], dly = b[1] - a[1], dlz = b[2] - a[2];
      const mx = (a[0] + b[0]) * 0.5, my = (a[1] + b[1]) * 0.5, mz = (a[2] + b[2]) * 0.5;
      const rx = P[0] - mx, ry = P[1] - my, rz = P[2] - mz;
      const r2 = rx * rx + ry * ry + rz * rz;
      const r = Math.sqrt(r2); if (r < 1e-6) continue;
      const inv = K * I / (r2 * r);
      bx += inv * (dly * rz - dlz * ry);
      by += inv * (dlz * rx - dlx * rz);
      bz += inv * (dlx * ry - dly * rx);
    }
  }
  return [bx, by, bz];
}

function circle(R, I, z0, n = 240) {
  const pts = [];
  for (let i = 0; i <= n; i += 1) { const t = 2 * Math.PI * i / n; pts.push([R * Math.cos(t), R * Math.sin(t), z0]); }
  return { pts, I };
}

export function buildPreset(name, { I = 1, R = 1 } = {}) {
  if (name === 'wire') {
    const L = 200, n = 4000, pts = [];
    for (let i = 0; i <= n; i += 1) pts.push([0, 0, -L / 2 + L * i / n]);
    return [{ pts, I }];
  }
  if (name === 'loop') return [circle(R, I, 0)];
  if (name === 'helmholtz') return [circle(R, I, -R / 2), circle(R, I, R / 2)];
  if (name === 'solenoid') {
    const N = 40, L = 4 * R, segs = [];
    for (let k = 0; k < N; k += 1) segs.push(circle(R, I, -L / 2 + L * k / (N - 1)));
    return segs;
  }
  return [circle(R, I, 0)];
}

export function axialBz(segments, zMin, zMax, n = 120) {
  const out = [];
  for (let i = 0; i <= n; i += 1) { const z = zMin + (zMax - zMin) * i / n; out.push([z, biotSavart(segments, [0, 0, z])[2]]); }
  return out;
}

// Numerical divergence of B at P (must be ~0 for any magnetostatic
// field): central differences with step h.
export function divergence(segments, P, h = 0.02) {
  const d = (ax) => {
    const pp = P.slice(); pp[ax] += h; const pm = P.slice(); pm[ax] -= h;
    return (biotSavart(segments, pp)[ax] - biotSavart(segments, pm)[ax]) / (2 * h);
  };
  return d(0) + d(1) + d(2);
}

// Solenoid turn density n = N / L for the preset above.
export function solenoidN(R) { const N = 40, L = 4 * R; return N / L; }
