// Shared 256-sample colormap LUTs. Each function maps t in [0,1] to [r,g,b]
// in [0,1]. The cubic-polynomial fits are good to ~3/255 vs the matplotlib
// canonical samples (sufficient for browser visualization).

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

export function viridis(t) {
  t = clamp01(t);
  return [
    clamp01(0.267 + 0.105 * t - 0.330 * t * t + 1.000 * t * t * t),
    clamp01(0.005 + 1.404 * t - 0.479 * t * t),
    clamp01(0.329 + 0.749 * t - 0.972 * t * t),
  ];
}

export function magma(t) {
  t = clamp01(t);
  return [
    clamp01(-0.003 + 1.34 * t + 1.07 * t * t - 1.5 * t * t * t + 0.09 * t * t * t * t),
    clamp01(-0.01 + 0.45 * t * t + 0.4 * t * t * t),
    clamp01(0.014 + 2.59 * t - 4.45 * t * t + 2.7 * t * t * t - 0.16 * t * t * t * t),
  ];
}

export function cividis(t) {
  t = clamp01(t);
  return [
    clamp01(-0.03 + 0.92 * t),
    clamp01(0.13 + 0.83 * t),
    clamp01(0.32 + 0.65 * t - 1.5 * t * t + 0.99 * t * t * t),
  ];
}

// Diverging blue->white->red. Used by the wave hero on signed height.
export function coolwarm(t) {
  t = clamp01(t);
  const x = t * 2 - 1; // -1..1
  if (x < 0) {
    const a = -x; // 0..1
    return [
      clamp01(1 - a * (1 - 0.23)),
      clamp01(1 - a * (1 - 0.30)),
      clamp01(1 - a * (1 - 0.75)),
    ];
  }
  return [
    clamp01(1 - x * (1 - 0.71)),
    clamp01(1 - x * (1 - 0.02)),
    clamp01(1 - x * (1 - 0.15)),
  ];
}

// Cyclic. Used for complex phase. Approximated from the matplotlib twilight LUT.
export function twilight(t) {
  t = clamp01(t);
  const x = t * 2 * Math.PI;
  const a = 0.5 + 0.5 * Math.cos(x);
  const b = 0.5 + 0.5 * Math.cos(x + 2 * Math.PI / 3);
  const c = 0.5 + 0.5 * Math.cos(x - 2 * Math.PI / 3);
  return [
    clamp01(0.10 + 0.85 * a),
    clamp01(0.12 + 0.70 * b),
    clamp01(0.20 + 0.70 * c),
  ];
}

// Build a 256x1 RGBA8 Uint8Array LUT from any of the above.
export function buildLUT256(fn) {
  const out = new Uint8Array(256 * 4);
  for (let i = 0; i < 256; i += 1) {
    const c = fn(i / 255);
    out[4 * i] = Math.round(c[0] * 255);
    out[4 * i + 1] = Math.round(c[1] * 255);
    out[4 * i + 2] = Math.round(c[2] * 255);
    out[4 * i + 3] = 255;
  }
  return out;
}
