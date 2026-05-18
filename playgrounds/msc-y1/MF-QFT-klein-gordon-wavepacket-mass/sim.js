// Klein-Gordon wave packet (natural units c = hbar = 1). Dispersion
// omega(k) = sqrt(k^2 + m^2); a Gaussian packet
// psi(x,0) = exp(-x^2/2 sigma0^2) e^{i k0 x} evolves as
// psi(x,t) = integral A(k) e^{i(kx - omega t)} dk with
// A(k) ~ exp(-sigma0^2 (k-k0)^2 / 2). Phase velocity omega/k > 1,
// group velocity v_g = k/omega = p/E < 1 (sub-luminal); massless is
// dispersion-free. Peskin and Schroeder; Greiner, RQM. Deterministic.

export function omega(k, m) { return Math.sqrt(k * k + m * m); }
export function groupVelocity(k, m) { return k / omega(k, m); }   // = p/E
export function phaseVelocity(k, m) { return k === 0 ? Infinity : omega(k, m) / k; }

// |psi(x,t)|^2 on an x grid, plus centroid, RMS width and norm.
export function packet(t, {
  m = 1, k0 = 3, sigma0 = 1.2, L = 60, xN = 360, kN = 256, kSpan = 6,
} = {}) {
  const x = new Float64Array(xN + 1);
  const p2 = new Float64Array(xN + 1);
  const dk = (2 * kSpan / sigma0) / kN;                  // resolve the k-Gaussian
  // precompute the k samples and complex amplitudes
  const ks = new Float64Array(kN + 1), Ar = new Float64Array(kN + 1);
  for (let j = 0; j <= kN; j += 1) {
    const k = k0 - kSpan / sigma0 + j * dk;
    ks[j] = k;
    Ar[j] = Math.exp(-sigma0 * sigma0 * (k - k0) * (k - k0) / 2);
  }
  let norm = 0, cx = 0, cxx = 0;
  for (let i = 0; i <= xN; i += 1) {
    const xx = -L + 2 * L * i / xN;
    x[i] = xx;
    let re = 0, im = 0;
    for (let j = 0; j <= kN; j += 1) {
      const ph = ks[j] * xx - omega(ks[j], m) * t;
      re += Ar[j] * Math.cos(ph);
      im += Ar[j] * Math.sin(ph);
    }
    const v = (re * re + im * im);
    p2[i] = v;
  }
  const dx = 2 * L / xN;
  for (let i = 0; i <= xN; i += 1) { norm += p2[i] * dx; cx += x[i] * p2[i] * dx; }
  cx /= norm;
  for (let i = 0; i <= xN; i += 1) cxx += (x[i] - cx) * (x[i] - cx) * p2[i] * dx;
  const width = Math.sqrt(cxx / norm);
  return { x, p2, centroid: cx, width, norm };
}

// Time series of centroid and width (one packet() per sample).
export function evolve(tEnd, steps, opts = {}) {
  const t = new Float64Array(steps + 1);
  const cen = new Float64Array(steps + 1);
  const wid = new Float64Array(steps + 1);
  const nrm = new Float64Array(steps + 1);
  for (let i = 0; i <= steps; i += 1) {
    const tt = tEnd * i / steps;
    const r = packet(tt, opts);
    t[i] = tt; cen[i] = r.centroid; wid[i] = r.width; nrm[i] = r.norm;
  }
  return { t, cen, wid, nrm };
}

// Causal (sub-luminal) test: the centroid displacement per unit time.
// For a Klein-Gordon packet this equals the group velocity
// v_g = k0/sqrt(k0^2+m^2) < 1, so the packet energy never travels
// faster than light. (A Gaussian envelope has exponentially small
// acausal tails; true microcausality is the field-commutator
// statement, not a single-packet one, so the gate is the centroid
// velocity, the physically meaningful causal speed.)
export function centroidVelocity(t1, t2, opts = {}) {
  const a = packet(t1, opts).centroid, b = packet(t2, opts).centroid;
  return (b - a) / (t2 - t1);
}
