// sim.js
// Rutherford scattering. An alpha particle of energy E and impact parameter b is
// deflected by the Coulomb repulsion of a nucleus of charge Ze. Its path is a
// hyperbola with the nucleus at the focus, and the deflection angle follows
//   cot(theta/2) = 2b/D,    D = (1/4 pi eps0) Z z e^2 / E,
// where D is the head-on distance of closest approach. The number scattered into
// angle theta is set by the differential cross section
//   dsigma/dOmega = (D/4)^2 / sin^4(theta/2),
// the steep 1/sin^4 law whose large-angle tail is what told Rutherford the atom
// has a tiny, massive, charged nucleus.
//
// Reference: Krane, Introductory Nuclear Physics, Sec. 11.2; Eisberg and Resnick,
// Quantum Physics, 2nd ed., Ch. 4.
//
// Units m = 1, incident speed v0 = 1 (so E = 1/2 and the Coulomb constant k = D/2).

export function scatteringAngle(b, D) {
  if (Math.abs(b) < 1e-12) return Math.PI;
  return Math.sign(b) * 2 * Math.atan2(D, 2 * Math.abs(b));
}
export function crossSection(theta, D) { const s = Math.sin(Math.abs(theta) / 2); return (D / 4) * (D / 4) / Math.pow(s, 4); }
export function closestApproach(b, D) { return D / 2 + Math.hypot(D / 2, b); }

// integrate the hyperbolic orbit in the repulsive Coulomb field (velocity-Verlet),
// returning the path, the measured asymptotic deflection, and the closest approach.
export function integrateTrajectory(b, D, opts = {}) {
  const k = D / 2; const dt = opts.dt || 0.01; const x0 = opts.xStart || -60, xEnd = opts.xEnd || 60, maxN = opts.maxN || 60000;
  const exitR = opts.exitR || Math.max(Math.abs(x0), xEnd);
  let px = x0, py = b, vx = 1, vy = 0;
  const accel = (x, y) => { const r2 = x * x + y * y, r = Math.sqrt(r2); const f = k / (r2 * r); return [f * x, f * y]; };
  let [ax, ay] = accel(px, py); const pts = [[px, py]]; let rmin = Math.hypot(px, py); let step = 0;
  while (step < maxN) {
    px += vx * dt + 0.5 * ax * dt * dt; py += vy * dt + 0.5 * ay * dt * dt;
    const [nax, nay] = accel(px, py); vx += 0.5 * (ax + nax) * dt; vy += 0.5 * (ay + nay) * dt; ax = nax; ay = nay;
    const r = Math.hypot(px, py); rmin = Math.min(rmin, r);
    if (step % 6 === 0) pts.push([px, py]);
    step += 1;
    if (r > exitR && (px * vx + py * vy) > 0) break; // left the region, moving outward
  }
  pts.push([px, py]);
  return { pts, theta: Math.atan2(vy, vx), rmin };
}

// representative impact parameters (in units of D), symmetric about the axis.
export function beamImpactParameters(D) { const fr = [0.18, 0.4, 0.8, 1.5, 2.8]; const out = []; for (const f of fr) { out.push(f * D); out.push(-f * D); } return out.sort((a, c) => a - c); }
