// Friedmann cosmology (DOM-free engine).
//
// The scale factor a(t) of a homogeneous, isotropic universe obeys
//
//   ( a'/a )^2 = H0^2 [ Om_r a^-4 + Om_m a^-3 + Om_L + Om_k a^-2 ],
//
// with the curvature term fixed by closure Om_k = 1 - Om_r - Om_m -
// Om_L, and a = 1 today. Recession follows Hubble's law v = H d for
// every comoving pair, with no centre; light emitted at scale factor
// a_e and received at a_o is redshifted by 1 + z = a_o / a_e. A
// closed universe (Om_total > 1, Om_k < 0) reaches a maximum size,
// turns around and recollapses to a Big Crunch; dark energy makes the
// expansion accelerate without bound. All of this is the integration
// of the equation above, not a script.
//
// References: Ryden, Introduction to Cosmology, 2nd ed., CUP 2017,
// Ch. 5-6; Dodelson, Modern Cosmology, 2nd ed., Academic 2020, Ch. 2.

export function curvature(Om) {
  return 1 - (Om.r ?? 0) - (Om.m ?? 0) - (Om.L ?? 0);
}

// E(a) = (H/H0)^2. Can go negative past the turnaround of a closed
// universe; callers clamp at zero and flip the expansion sign there.
export function friedmannE(a, Om) {
  const Ok = curvature(Om);
  return (Om.r ?? 0) / (a * a * a * a) + (Om.m ?? 0) / (a * a * a)
       + (Om.L ?? 0) + Ok / (a * a);
}

export function hubble(a, Om, H0 = 1) {
  return H0 * Math.sqrt(Math.max(0, friedmannE(a, Om)));
}

// Integrate a(t) from today (a=1, t=0) both forward and backward in
// time with RK4 on da/dt = sign * a * H0 sqrt(E(a)). Detects the
// turnaround of a closed universe (E -> 0 with Om_k < 0) and the Big
// Crunch (a -> 0). Returns { t[], a[], iNow } sampled on a uniform t
// grid, plus the model summary.
export function integrateScaleFactor(Om, H0 = 1, opts = {}) {
  const dt = opts.dt ?? 0.004;
  const tMax = opts.tMax ?? 40;
  const aMin = opts.aMin ?? 1e-3;
  const aMax = opts.aMax ?? 200;

  function branch(sign) {
    const ts = [], as = [];
    let a = 1, t = 0, s = sign;
    for (let n = 0; n < tMax / dt; n += 1) {
      ts.push(t); as.push(a);
      const f = (aa) => {
        const E = friedmannE(aa, Om);
        if (E <= 0) return 0;                 // at the turnaround
        return s * aa * H0 * Math.sqrt(E);
      };
      const k1 = f(a);
      const k2 = f(a + 0.5 * dt * k1);
      const k3 = f(a + 0.5 * dt * k2);
      const k4 = f(a + dt * k3);
      let an = a + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      // Closed-universe turnaround: E(a) crossed zero while expanding.
      if (curvature(Om) < 0 && friedmannE(an, Om) <= 0 && s > 0) {
        s = -1;                               // begin recollapse
        an = a;                               // hold at a_max this step
      }
      a = an; t += dt;
      if (a <= aMin) { ts.push(t); as.push(0); break; }   // Big Bang / Crunch
      if (a >= aMax) { ts.push(t); as.push(a); break; }
    }
    return { ts, as };
  }
  const fwd = branch(+1);
  const bwd = branch(-1);
  // stitch: reversed backward branch (drop its duplicate t=0), then forward
  const t = [], a = [];
  for (let i = bwd.ts.length - 1; i >= 1; i -= 1) { t.push(-bwd.ts[i]); a.push(bwd.as[i]); }
  const iNow = t.length;
  for (let i = 0; i < fwd.ts.length; i += 1) { t.push(fwd.ts[i]); a.push(fwd.as[i]); }
  return { t, a, iNow, Om, Ok: curvature(Om), H0 };
}

// Scale factor at a given cosmic time by linear interpolation in the
// integrated table.
export function scaleAt(sol, time) {
  const { t, a } = sol;
  if (time <= t[0]) return a[0];
  if (time >= t[t.length - 1]) return a[a.length - 1];
  let lo = 0, hi = t.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (t[m] <= time) lo = m; else hi = m; }
  const f = (time - t[lo]) / (t[hi] - t[lo]);
  return a[lo] + f * (a[hi] - a[lo]);
}

// Redshift of light emitted at time t_e and observed at t_o.
export function redshift(sol, tEmit, tObs) {
  return scaleAt(sol, tObs) / scaleAt(sol, tEmit) - 1;
}

// Hubble-law recession speed of a galaxy at comoving distance dC,
// at cosmic time `time`: v = H(a) * (a * dC).  (c = 1 units.)
export function recession(sol, dC, time, H0 = 1) {
  const a = scaleAt(sol, time);
  return hubble(a, sol.Om, H0) * a * dC;
}
