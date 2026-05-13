// sim.js
// Electric field lines from a small set of point charges.
//
// Electric field at r from charge q_i at r_i:
//   E(r) = sum_i (q_i / |r - r_i|^3) (r - r_i)
//
// Field lines are integral curves of E. Field-line density on the plane is
// proportional to |E| (Gauss's law); we enforce this by starting equal
// numbers of lines per unit charge from each positive charge, uniformly in
// emission angle. Lines terminate either at a negative charge or after
// leaving a large bounding box.
//
// Reference: Griffiths, Introduction to Electrodynamics 4e Ch. 2.

export const BOX = 4.0;     // half-width of bounding box

export function field(rx, ry, charges) {
  let Ex = 0, Ey = 0;
  for (const c of charges) {
    const dx = rx - c.x, dy = ry - c.y;
    const r2 = dx * dx + dy * dy + 1e-6;
    const r3 = r2 * Math.sqrt(r2);
    Ex += c.q * dx / r3;
    Ey += c.q * dy / r3;
  }
  return { Ex, Ey };
}

// Trace a single field line starting at (x0, y0). Sign +1 follows E (out of
// + charges); -1 traces against E (toward - charges).
export function traceLine(x0, y0, charges, sign = 1, maxLen = 8.0, ds = 0.04) {
  const xs = [x0], ys = [y0];
  let x = x0, y = y0, total = 0;
  for (let step = 0; step < 5000 && total < maxLen; step += 1) {
    const { Ex, Ey } = field(x, y, charges);
    const mag = Math.sqrt(Ex * Ex + Ey * Ey);
    if (mag < 1e-6) break;
    const ux = sign * Ex / mag, uy = sign * Ey / mag;
    x += ux * ds; y += uy * ds;
    total += ds;
    xs.push(x); ys.push(y);
    // Check distance to any charge for termination near a sink
    for (const c of charges) {
      const dx = x - c.x, dy = y - c.y;
      if (dx * dx + dy * dy < 0.01) { return { xs, ys, terminated: true }; }
    }
    if (Math.abs(x) > BOX || Math.abs(y) > BOX) return { xs, ys, terminated: false };
  }
  return { xs, ys, terminated: false };
}

// Standard preset configurations.
export const PRESETS = {
  'dipole':   [{ x: -0.8, y: 0, q:  1 }, { x:  0.8, y: 0, q: -1 }],
  'two-plus': [{ x: -0.8, y: 0, q:  1 }, { x:  0.8, y: 0, q:  1 }],
  'quadrupole': [
    { x: -0.7, y:  0.7, q:  1 }, { x:  0.7, y:  0.7, q: -1 },
    { x: -0.7, y: -0.7, q: -1 }, { x:  0.7, y: -0.7, q:  1 },
  ],
  'mono-plus': [{ x: 0, y: 0, q: 1 }],
};

// Sample line emission angles uniformly per positive charge, in proportion
// to |q|.
export function emissionPoints(charges, perUnitCharge = 16, smallR = 0.08) {
  const out = [];
  for (const c of charges) {
    const n = Math.max(4, Math.round(perUnitCharge * Math.abs(c.q)));
    for (let i = 0; i < n; i += 1) {
      const theta = 2 * Math.PI * (i + 0.5) / n;
      out.push({
        x: c.x + smallR * Math.cos(theta),
        y: c.y + smallR * Math.sin(theta),
        sign: c.q > 0 ? 1 : -1,
      });
    }
  }
  return out;
}
