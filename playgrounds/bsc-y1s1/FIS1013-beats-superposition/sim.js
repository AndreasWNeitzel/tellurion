// sim.js
// Beats from superposition of two cosines:
//
//   y(t) = cos(2 pi f1 t) + cos(2 pi f2 t)
//        = 2 cos(2 pi f_bar t) cos(2 pi f_b t)
//
// with carrier f_bar = (f1 + f2) / 2 and beat envelope frequency
// f_b = abs(f1 - f2) / 2 (so the audible beat rate is 2 f_b = abs(f1 - f2)).
//
// Reference: Crawford, Waves and Oscillations, Berkeley Physics Vol. 3
// Ch. 1 (`crawford-waves`).

export const T_MIN = 0, T_MAX = 8.0;

export function y1(t, f1) { return Math.cos(2 * Math.PI * f1 * t); }
export function y2(t, f2) { return Math.cos(2 * Math.PI * f2 * t); }
export function ySum(t, f1, f2) { return y1(t, f1) + y2(t, f2); }
export function envelope(t, f1, f2) {
  return 2 * Math.cos(Math.PI * (f1 - f2) * t);
}

export function beatRate(f1, f2)   { return Math.abs(f1 - f2); }
export function carrierFreq(f1, f2) { return (f1 + f2) / 2; }
export function envelopeFreq(f1, f2) { return Math.abs(f1 - f2) / 2; }

// --- Spatial picture: the same two close frequencies travelling in a
// dispersive medium (deep-water ripples, omega = sqrt(g k)). Superposition
// then gives a travelling beat whose crests (phase velocity) outrun the
// group (group velocity). For deep water v_group is exactly v_phase / 2.
//
//   y(x, t) = cos(k1 x - w1 t) + cos(k2 x - w2 t)
//
// with k_i = w_i^2 / g and w_i = 2 pi f_i. This is the spatial counterpart of
// the temporal beat above; listening at a fixed point recovers y(t).

export const G_GRAV = 9.81;                       // m/s^2
export function omega(f) { return 2 * Math.PI * f; }
export function waveK(f) { const w = omega(f); return (w * w) / G_GRAV; }

export function yField(x, t, f1, f2) {
  return Math.cos(waveK(f1) * x - omega(f1) * t)
       + Math.cos(waveK(f2) * x - omega(f2) * t);
}
// Spatial beat envelope: 2 cos((dk x - dw t) / 2), |.| <= 2.
export function envelopeField(x, t, f1, f2) {
  const dk = waveK(f1) - waveK(f2), dw = omega(f1) - omega(f2);
  return 2 * Math.cos(0.5 * (dk * x - dw * t));
}
// Carrier phase velocity v_p = wbar / kbar = g / wbar (deep water).
export function phaseVel(f1, f2) {
  const kbar = 0.5 * (waveK(f1) + waveK(f2));
  const wbar = 0.5 * (omega(f1) + omega(f2));
  return kbar > 1e-9 ? wbar / kbar : 0;
}
// Group velocity v_g = dw/dk; for two close points the secant gives the
// exact deep-water result g/(w1+w2) = v_p/2.
export function groupVel(f1, f2) {
  const dk = waveK(f1) - waveK(f2), dw = omega(f1) - omega(f2);
  if (Math.abs(dk) < 1e-9) return 0.5 * phaseVel(f1, f2);
  return dw / dk;
}
// Carrier and beat (group) wavelengths in space.
export function carrierWavelength(f1, f2) {
  const kbar = 0.5 * (waveK(f1) + waveK(f2));
  return kbar > 1e-9 ? (2 * Math.PI) / kbar : Infinity;
}
export function beatWavelength(f1, f2) {
  const dk = Math.abs(waveK(f1) - waveK(f2));
  return dk > 1e-9 ? (2 * Math.PI) / dk : Infinity;
}

// Sample on a uniform grid for plotting.
export function sample(f1, f2, N = 800) {
  const t = new Float64Array(N);
  const y = new Float64Array(N);
  const env = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const ti = T_MIN + (T_MAX - T_MIN) * i / (N - 1);
    t[i] = ti;
    y[i] = ySum(ti, f1, f2);
    env[i] = envelope(ti, f1, f2);
  }
  return { t, y, env };
}
