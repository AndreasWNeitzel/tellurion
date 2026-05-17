// Huygens-Fresnel construction. A wavefront is replaced by N secondary
// point sources; their coherent superposition reconstructs the next
// wavefront and, in the far field, the diffraction pattern. For a
// uniform line aperture of width a the Fraunhofer amplitude is the
// sinc envelope E(theta) ~ sinc(pi a sin theta / lambda), so the
// intensity is sinc^2 with first zeros at sin theta = m lambda / a.
// Headless and deterministic. Reference: Hecht, Optics (5th ed.),
// Sec. 10.1-10.2 (Huygens-Fresnel; single-slit Fraunhofer).

export function sinc(x) { return Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x; }

// N secondary sources evenly spaced along a vertical aperture of
// height `a` centred at (x0, y0).
export function sourcesLine(N, a, x0, y0) {
  const s = [];
  for (let i = 0; i < N; i += 1) {
    const f = N === 1 ? 0.5 : i / (N - 1);
    s.push({ x: x0, y: y0 + (f - 0.5) * a, ph: 0 });
  }
  return s;
}

// N sources on a circular arc of radius R (concave toward +x), centred
// so the geometric focus is at (x0 + R, y0). Equal phase => a
// converging wavefront.
export function sourcesArc(N, a, R, x0, y0) {
  const s = [];
  const half = Math.asin(Math.min(0.999, a / (2 * R)));
  for (let i = 0; i < N; i += 1) {
    const f = N === 1 ? 0.5 : i / (N - 1);
    const th = (f - 0.5) * 2 * half;
    s.push({ x: x0 + R - R * Math.cos(th), y: y0 + R * Math.sin(th), ph: 0 });
  }
  return s;
}

// Instantaneous scalar field of the wavelets at (x, y): each source
// contributes cos(k r - omega t) / sqrt(max(r, 1)) (2D amplitude
// falloff). omega = c k.
export function fieldAt(sources, x, y, k, omega, t) {
  let u = 0;
  for (const s of sources) {
    const r = Math.hypot(x - s.x, y - s.y);
    u += Math.cos(k * r - omega * t + s.ph) / Math.sqrt(Math.max(r, 1));
  }
  return u;
}

// Coherent far-field amplitude in direction theta (measured from +x)
// at large distance: |sum exp(i k (r_i . dir))|, normalised by N.
export function farFieldAmplitude(sources, theta, k) {
  let re = 0, im = 0;
  const ux = Math.cos(theta), uy = Math.sin(theta);
  for (const s of sources) {
    const phase = k * (s.x * ux + s.y * uy) + s.ph;
    re += Math.cos(phase); im += Math.sin(phase);
  }
  return Math.hypot(re, im) / sources.length;
}

// Analytic uniform-aperture Fraunhofer amplitude (sinc envelope).
export function apertureAmplitude(theta, a, lambda) {
  return Math.abs(sinc(Math.PI * a * Math.sin(theta) / lambda));
}

// Angular coefficient of variation of the time-peak |field| on a ring
// of radius Rr about the source centroid (isotropy probe: for N = 1
// this is ~0, a perfectly circular wavelet).
export function ringEnvelopeCoV(sources, Rr, k, omega, nAng = 96, samples = 40) {
  let cx = 0, cy = 0; for (const s of sources) { cx += s.x; cy += s.y; } cx /= sources.length; cy /= sources.length;
  const peak = new Float64Array(nAng);
  for (let m = 0; m < samples; m += 1) {
    const t = (m / samples) * (2 * Math.PI / omega);
    for (let i = 0; i < nAng; i += 1) {
      const th = (2 * Math.PI * i) / nAng;
      const v = Math.abs(fieldAt(sources, cx + Rr * Math.cos(th), cy + Rr * Math.sin(th), k, omega, t));
      if (v > peak[i]) peak[i] = v;
    }
  }
  const mean = peak.reduce((p, q) => p + q, 0) / nAng;
  if (mean < 1e-12) return 1;
  let v = 0; for (const z of peak) v += (z - mean) ** 2;
  return Math.sqrt(v / nAng) / mean;
}
