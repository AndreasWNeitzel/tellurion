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
