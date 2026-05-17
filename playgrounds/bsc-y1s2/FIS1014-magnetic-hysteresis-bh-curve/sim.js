// Jiles-Atherton ferromagnetic hysteresis. Headless, deterministic.
// Anhysteretic (Langevin) magnetisation
//   M_an(He) = Ms [ coth(He/a) - a/He ],   He = H + alpha M
// with the irreversible component
//   dM_irr/dH = (M_an - M_irr) / (k*delta - alpha*(M_an - M_irr))
// and M = (1-c) M_irr + c M_an. Sweeping H around a loop yields a
// hysteresis curve whose remanence and coercivity emerge from the
// parameters; the loop area is the energy dissipated per cycle.
// Reference: Jiles and Atherton, J. Magn. Magn. Mater. 61, 48 (1986);
// Griffiths, Introduction to Electrodynamics (4th ed.), Sec. 6.

export function langevin(x) {
  if (Math.abs(x) < 1e-4) return x / 3;            // small-argument limit
  return 1 / Math.tanh(x) - 1 / x;
}
// Derivative of the Langevin function: 1/x^2 - 1/sinh^2(x).
export function dLangevinExact(x) {
  if (Math.abs(x) < 1e-3) return 1 / 3 - x * x / 15;
  const s = Math.sinh(x);
  return 1 / (x * x) - 1 / (s * s);
}

export function anhysteretic(H, M, p) {
  const He = H + p.alpha * M;
  return p.Ms * langevin(He / p.a);
}

// Sweep H over one symmetric cycle [+Hm -> -Hm -> +Hm], integrating M.
// Returns { pts:[[H,M]...], area, Mr, Hc }.
export function sweepLoop(p, Hm = 3, steps = 1200) {
  const { Ms, a, alpha, k, c } = p;
  const half = steps / 2;
  // Start saturated positive.
  let H = Hm, M = Ms * langevin((Hm) / a);
  const pts = [];
  const seq = [];
  for (let i = 0; i <= half; i += 1) seq.push(Hm - 2 * Hm * i / half);   // +Hm -> -Hm
  for (let i = 1; i <= half; i += 1) seq.push(-Hm + 2 * Hm * i / half);  // -Hm -> +Hm
  let prevH = seq[0];
  for (let idx = 0; idx < seq.length; idx += 1) {
    const Hn = seq[idx];
    const dH = Hn - prevH;
    const delta = dH >= 0 ? 1 : -1;
    // One explicit step of the J-A ODE.
    const He = prevH + alpha * M;
    const Man = Ms * langevin(He / a);
    const dManHe = (Ms / a) * dLangevinExact(He / a);
    const denom = k * delta - alpha * (Man - M);
    const dMirr = Math.abs(denom) < 1e-9 ? 0 : (Man - M) / denom;
    const dMdH = ((1 - c) * dMirr + c * dManHe) / (1 - alpha * c * dManHe || 1);
    M += dMdH * dH;
    M = Math.max(-Ms * 1.05, Math.min(Ms * 1.05, M));
    pts.push([Hn, M]);
    prevH = Hn;
  }
  // Loop area = closed integral of M dH (energy per cycle, arb units).
  let area = 0;
  for (let i = 1; i < pts.length; i += 1) area += pts[i][1] * (pts[i][0] - pts[i - 1][0]);
  area = Math.abs(area);
  // Remanence: M where H crosses 0 on the descending branch (first half).
  let Mr = 0;
  for (let i = 1; i < half; i += 1) if (pts[i - 1][0] >= 0 && pts[i][0] < 0) { Mr = pts[i][1]; break; }
  // Coercivity: |H| where M crosses 0 on the descending branch.
  let Hc = 0;
  for (let i = 1; i < half; i += 1) if (pts[i - 1][1] >= 0 && pts[i][1] < 0) { Hc = Math.abs(pts[i][0]); break; }
  return { pts, area, Mr, Hc };
}

export const PRESETS = {
  'soft iron': { Ms: 1.7, a: 0.06, alpha: 0.0008, k: 0.05, c: 0.55 },
  'hard steel': { Ms: 1.4, a: 0.25, alpha: 0.002, k: 0.95, c: 0.10 },
  ferrite: { Ms: 0.9, a: 0.14, alpha: 0.0012, k: 0.35, c: 0.30 },
};
