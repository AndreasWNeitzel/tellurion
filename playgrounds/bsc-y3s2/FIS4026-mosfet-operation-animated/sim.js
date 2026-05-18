// n-channel enhancement MOSFET, square-law (level-1 / Shichman-Hodges
// 1968) model with a subthreshold exponential tail (Neamen,
// Semiconductor Physics and Devices, 4th ed., Ch. 10-11; Sze and Ng,
// Physics of Semiconductor Devices). Overdrive V_ov = V_GS - V_th.
//
//   cutoff      V_GS <= V_th : I_D = I_sub exp(V_ov / (n V_T))
//   triode      0 < V_DS < V_ov : I_D = k_n[V_ov V_DS - V_DS^2/2]
//   saturation  V_DS >= V_ov  : I_D = (k_n/2) V_ov^2 (1 + lambda V_DS)
//
// The triode/saturation boundary is V_DS = V_ov = V_GS - V_th, where
// the square law is C1 (value and slope continuous) for lambda = 0.
// Closed-form, deterministic, no RNG.

export const VT = 0.025852;                            // thermal voltage at 300 K (V)

export function overdrive(vgs, vth) { return vgs - vth; }
export function vdsSat(vgs, vth) { return Math.max(0, vgs - vth); }

// Drain current. Defaults: kn (transconductance, A/V^2), lambda
// (channel-length modulation, 1/V), isub (subthreshold prefactor, A),
// nsub (subthreshold ideality).
export function drainCurrent(vgs, vds, {
  vth = 1, kn = 1e-3, lambda = 0, isub = 1e-9, nsub = 1.5,
} = {}) {
  const vov = vgs - vth;
  if (vds < 0) return 0;
  if (vov <= 0) return isub * Math.exp(vov / (nsub * VT));   // subthreshold
  if (vds < vov) return kn * (vov * vds - 0.5 * vds * vds);   // triode
  return 0.5 * kn * vov * vov * (1 + lambda * vds);           // saturation
}

export function saturationCurrent(vgs, { vth = 1, kn = 1e-3 } = {}) {
  const vov = Math.max(0, vgs - vth);
  return 0.5 * kn * vov * vov;
}

export function region(vgs, vds, vth) {
  if (vgs - vth <= 0) return 'cutoff';
  return vds < vgs - vth ? 'triode' : 'saturation';
}

// On-resistance in deep triode (V_DS -> 0): R_on = 1 / (k_n V_ov).
export function onResistance(vgs, { vth = 1, kn = 1e-3 } = {}) {
  const vov = vgs - vth;
  return vov > 0 ? 1 / (kn * vov) : Infinity;
}

// Gradual-channel potential V(x): along the channel the constant
// drain current obeys k_n[V_ov V - V^2/2] = I_D (x/L). Solving the
// quadratic, V(x) = V_ov - sqrt(V_ov^2 - 2 I_D x /(k_n L)). Past
// pinch-off the channel ends where V = V_ov. xf in [0,1].
export function channelPotential(xf, vgs, vds, opts = {}) {
  const { vth = 1, kn = 1e-3 } = opts;
  const vov = vgs - vth;
  if (vov <= 0) return 0;
  const vEff = Math.min(vds, vov);                     // clamp at pinch-off
  const ID = kn * (vov * vEff - 0.5 * vEff * vEff);
  const disc = vov * vov - 2 * ID * xf / kn;
  return vov - Math.sqrt(Math.max(0, disc));
}

// Normalised inversion-layer thickness along the channel: 1 at the
// source, tapering toward the drain, reaching zero at the drain edge
// in saturation (channelPotential clamps V at V_ov, so this goes to
// zero exactly at x = L when V_DS >= V_ov).
export function channelThickness(xf, vgs, vds, opts = {}) {
  const { vth = 1 } = opts;
  const vov = vgs - vth;
  if (vov <= 0) return 0;
  const V = channelPotential(xf, vgs, vds, opts);
  return Math.max(0, (vov - V) / vov);
}

// Fractional channel position where the channel pinches off (V = V_ov),
// 1 if it does not pinch within the channel.
export function pinchPosition(vgs, vds, opts = {}) {
  const { vth = 1, kn = 1e-3 } = opts;
  const vov = vgs - vth;
  if (vov <= 0 || vds < vov) return 1;
  const IDsat = 0.5 * kn * vov * vov;
  const IDx = kn * (vov * vov - 0.5 * vov * vov);      // current at V = V_ov
  return Math.min(1, IDx / IDsat);                     // = 1 (exact pinch at x=L for lambda=0)
}

// Output characteristic I_D(V_DS) at fixed V_GS, and transfer
// characteristic I_D(V_GS) at fixed V_DS, sampled uniformly.
export function outputCurve(vgs, vdsMax, steps, opts = {}) {
  const vds = new Float64Array(steps + 1), id = new Float64Array(steps + 1);
  for (let i = 0; i <= steps; i += 1) {
    const v = vdsMax * i / steps;
    vds[i] = v; id[i] = drainCurrent(vgs, v, opts);
  }
  return { vds, id };
}
export function transferCurve(vds, vgsMax, steps, opts = {}) {
  const vgs = new Float64Array(steps + 1), id = new Float64Array(steps + 1);
  for (let i = 0; i <= steps; i += 1) {
    const v = vgsMax * i / steps;
    vgs[i] = v; id[i] = drainCurrent(v, vds, opts);
  }
  return { vgs, id };
}
