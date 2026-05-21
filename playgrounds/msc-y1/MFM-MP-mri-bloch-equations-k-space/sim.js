// MRI physics: the Bloch equations, the spin-echo and spoiled
// gradient-echo signal equations, and k-space imaging via the 2D
// Fourier transform (Bloch 1946; Liang and Lauterbur 2000). Analytic
// where possible, deterministic, no RNG. Times in ms.

// Radix-2 iterative FFT on interleaved [re, im, re, im, ...].
export function fft(buf, inverse = false) {
  const n = buf.length / 2;
  for (let i = 1, j = 0; i < n; i += 1) {              // bit reversal
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [buf[2 * i], buf[2 * j]] = [buf[2 * j], buf[2 * i]];
      [buf[2 * i + 1], buf[2 * j + 1]] = [buf[2 * j + 1], buf[2 * i + 1]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inverse ? 2 : -2) * Math.PI / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k += 1) {
        const a = i + k, b = i + k + len / 2;
        const ur = buf[2 * a], ui = buf[2 * a + 1];
        const vr0 = buf[2 * b], vi0 = buf[2 * b + 1];
        const vr = vr0 * cr - vi0 * ci, vi = vr0 * ci + vi0 * cr;
        buf[2 * a] = ur + vr; buf[2 * a + 1] = ui + vi;
        buf[2 * b] = ur - vr; buf[2 * b + 1] = ui - vi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr; cr = ncr;
      }
    }
  }
  if (inverse) for (let i = 0; i < 2 * n; i += 1) buf[i] /= n;
  return buf;
}
// 2D FFT of an N x N real image -> interleaved complex Float64Array.
export function fft2(real, N, inverse = false) {
  const buf = new Float64Array(2 * N * N);
  if (real.length === N * N) for (let k = 0; k < N * N; k += 1) buf[2 * k] = real[k];
  else buf.set(real);
  const row = new Float64Array(2 * N);
  for (let r = 0; r < N; r += 1) {
    for (let c = 0; c < N; c += 1) { row[2 * c] = buf[2 * (r * N + c)]; row[2 * c + 1] = buf[2 * (r * N + c) + 1]; }
    fft(row, inverse);
    for (let c = 0; c < N; c += 1) { buf[2 * (r * N + c)] = row[2 * c]; buf[2 * (r * N + c) + 1] = row[2 * c + 1]; }
  }
  const col = new Float64Array(2 * N);
  for (let c = 0; c < N; c += 1) {
    for (let r = 0; r < N; r += 1) { col[2 * r] = buf[2 * (r * N + c)]; col[2 * r + 1] = buf[2 * (r * N + c) + 1]; }
    fft(col, inverse);
    for (let r = 0; r < N; r += 1) { buf[2 * (r * N + c)] = col[2 * r]; buf[2 * (r * N + c) + 1] = col[2 * r + 1]; }
  }
  return buf;
}
export function magnitude(buf, N) {
  const m = new Float64Array(N * N);
  for (let k = 0; k < N * N; k += 1) m[k] = Math.hypot(buf[2 * k], buf[2 * k + 1]);
  return m;
}

// Bloch evolution in the rotating frame: exact free precession at
// offset omega (rad/ms) with T1 recovery to M0 and T2 decay.
export function blochEvolve(m, M0, T1, T2, omega, t) {
  const e2 = Math.exp(-t / T2), e1 = Math.exp(-t / T1);
  const c = Math.cos(omega * t), s = Math.sin(omega * t);
  return {
    mx: e2 * (m.mx * c - m.my * s),
    my: e2 * (m.mx * s + m.my * c),
    mz: M0 + (m.mz - M0) * e1,
  };
}
export const mag = (m) => Math.hypot(m.mx, m.my, m.mz);

// Free induction decay after a 90-degree pulse: complex samples.
export function fid(A, T2star, omega, n, dt) {
  const re = new Float64Array(n), im = new Float64Array(n);
  for (let k = 0; k < n; k += 1) {
    const tt = k * dt, env = A * Math.exp(-tt / T2star);
    re[k] = env * Math.cos(omega * tt);
    im[k] = env * Math.sin(omega * tt);
  }
  return { re, im };
}
// Spectrum: FFT magnitude of the FID (Lorentzian, FWHM = 2/T2*).
export function spectrum(f) {
  const n = f.re.length, buf = new Float64Array(2 * n);
  for (let k = 0; k < n; k += 1) { buf[2 * k] = f.re[k]; buf[2 * k + 1] = f.im[k]; }
  fft(buf, false);
  const mg = new Float64Array(n);
  for (let k = 0; k < n; k += 1) mg[k] = Math.hypot(buf[2 * k], buf[2 * k + 1]);
  return mg;
}

// Signal equations (Liang and Lauterbur). Spin echo:
export const seSignal = (rho, T1, T2, TR, TE) =>
  rho * (1 - Math.exp(-TR / T1)) * Math.exp(-TE / T2);
// Spoiled gradient echo (the Ernst-angle equation):
export function greSignal(rho, T1, T2s, TR, TE, flip) {
  const E1 = Math.exp(-TR / T1);
  return rho * Math.sin(flip) * (1 - E1) / (1 - Math.cos(flip) * E1) * Math.exp(-TE / T2s);
}
export const ernstAngle = (T1, TR) => Math.acos(Math.exp(-TR / T1));

// Tissue presets at ~1.5 T (T1, T2, T2*, proton density, label).
export const TISSUES = {
  csf: { T1: 4000, T2: 2000, T2s: 1000, rho: 1.00, name: 'CSF' },
  gm: { T1: 1000, T2: 100, T2s: 60, rho: 0.85, name: 'grey matter' },
  wm: { T1: 600, T2: 80, T2s: 50, rho: 0.70, name: 'white matter' },
  fat: { T1: 250, T2: 70, T2s: 40, rho: 0.90, name: 'fat' },
};

// A simple brain-like phantom: concentric regions tagged by tissue.
export function brainPhantom(N) {
  const tag = new Int8Array(N * N);                     // 0 air,1 csf,2 gm,3 wm,4 fat
  for (let j = 0; j < N; j += 1) {
    const y = 2 * (j + 0.5) / N - 1;
    for (let i = 0; i < N; i += 1) {
      const x = 2 * (i + 0.5) / N - 1;
      const r = Math.hypot(x, y);
      let t = 0;
      if (r < 0.92) t = 4;                               // scalp/fat ring
      if (r < 0.84) t = 1;                               // CSF
      if (r < 0.72) t = 2;                               // grey matter
      if (r < 0.5) t = 3;                                // white matter
      if (Math.hypot(x - 0.18, y + 0.1) < 0.12) t = 1;   // a ventricle
      if (Math.hypot(x + 0.18, y + 0.1) < 0.12) t = 1;
      tag[j * N + i] = t;
    }
  }
  return tag;
}

// Abdomen phantom: an outer fat ring, large liver and stomach, a
// vertebra and aorta cross-sections; useful to show different
// T1/T2 contrast distributions.
export function abdomenPhantom(N) {
  const tag = new Int8Array(N * N);
  for (let j = 0; j < N; j += 1) {
    const y = 2 * (j + 0.5) / N - 1;
    for (let i = 0; i < N; i += 1) {
      const x = 2 * (i + 0.5) / N - 1;
      const r = Math.hypot(x, y);
      let t = 0;
      if (r < 0.95) t = 4;                                       // fat layer
      if (r < 0.86) t = 2;                                       // soft tissue (grey-matter T values)
      if (Math.hypot(x + 0.30, y - 0.10) < 0.35) t = 3;          // liver (white-matter-like)
      if (Math.hypot(x - 0.25, y + 0.15) < 0.20) t = 1;          // stomach (CSF/fluid)
      if (Math.hypot(x, y + 0.40) < 0.08) t = 3;                 // vertebra
      if (Math.hypot(x + 0.05, y + 0.30) < 0.05) t = 1;          // aorta
      tag[j * N + i] = t;
    }
  }
  return tag;
}

// Knee phantom: femur, tibia, patella with synovial fluid in between.
export function kneePhantom(N) {
  const tag = new Int8Array(N * N);
  for (let j = 0; j < N; j += 1) {
    const y = 2 * (j + 0.5) / N - 1;
    for (let i = 0; i < N; i += 1) {
      const x = 2 * (i + 0.5) / N - 1;
      const r = Math.hypot(x, y);
      let t = 0;
      if (r < 0.92) t = 4;                                       // fat outer layer
      if (r < 0.80) t = 2;                                       // muscle
      if (Math.hypot(x, y - 0.40) < 0.30) t = 3;                 // femur
      if (Math.hypot(x, y + 0.40) < 0.30) t = 3;                 // tibia
      if (Math.hypot(x - 0.30, y) < 0.18) t = 3;                 // patella
      if (Math.abs(y) < 0.10 && r < 0.70) t = 1;                 // joint fluid
      tag[j * N + i] = t;
    }
  }
  return tag;
}

// Modified Shepp-Logan phantom: classic MRI reconstruction test.
export function sheppLoganPhantom(N) {
  // Simplified ellipsoid stack with the canonical intensities mapped
  // onto our 5-tissue tag set. (Not a full SL but reads as the
  // "head with structures" canonical phantom.)
  const tag = new Int8Array(N * N);
  const ells = [
    { a: 0.69, b: 0.92, x: 0,     y: 0,    th: 0,  t: 4 },
    { a: 0.66, b: 0.87, x: 0,     y: 0,    th: 0,  t: 2 },
    { a: 0.11, b: 0.31, x: -0.22, y: 0,    th: 1.2, t: 3 },
    { a: 0.16, b: 0.41, x: 0.22,  y: 0,    th: -1.2, t: 3 },
    { a: 0.21, b: 0.25, x: 0,     y: 0.35, th: 0,  t: 1 },
    { a: 0.046, b: 0.046, x: 0,   y: 0.10, th: 0, t: 3 },
  ];
  for (let j = 0; j < N; j += 1) {
    const y = 2 * (j + 0.5) / N - 1;
    for (let i = 0; i < N; i += 1) {
      const x = 2 * (i + 0.5) / N - 1;
      let t = 0;
      for (const e of ells) {
        const dx = x - e.x, dy = y - e.y;
        const c = Math.cos(e.th), s = Math.sin(e.th);
        const xp = c * dx + s * dy, yp = -s * dx + c * dy;
        if ((xp * xp) / (e.a * e.a) + (yp * yp) / (e.b * e.b) < 1) t = e.t;
      }
      tag[j * N + i] = t;
    }
  }
  return tag;
}

// Dispatch by name.
export function phantomByName(name, N) {
  if (name === 'abdomen') return abdomenPhantom(N);
  if (name === 'knee') return kneePhantom(N);
  if (name === 'shepp') return sheppLoganPhantom(N);
  return brainPhantom(N);
}
const TBY = [null, 'csf', 'gm', 'wm', 'fat'];
// Weighted image from the chosen sequence and parameters.
export function mrImage(tag, N, seq, TR, TE, flip = Math.PI / 2) {
  const img = new Float64Array(N * N);
  for (let k = 0; k < N * N; k += 1) {
    const id = tag[k];
    if (id === 0) { img[k] = 0; continue; }
    const T = TISSUES[TBY[id]];
    img[k] = seq === 'gre'
      ? greSignal(T.rho, T.T1, T.T2s, TR, TE, flip)
      : seSignal(T.rho, T.T1, T.T2, TR, TE);
  }
  return img;
}

// k-space of an image, and a low-pass reconstruction keeping only the
// central fraction of k-space lines (partial-acquisition blur).
export function imageToK(img, N) { return fft2(img, N, false); }
export function reconFromK(kbuf, N, keepFrac = 1) {
  const f = Float64Array.from(kbuf);
  if (keepFrac < 1) {
    const half = N / 2, keep = Math.max(1, Math.floor(half * keepFrac));
    for (let r = 0; r < N; r += 1) {
      const rr = r < half ? r : N - r;
      for (let c = 0; c < N; c += 1) {
        const cc = c < half ? c : N - c;
        if (rr > keep || cc > keep) { f[2 * (r * N + c)] = 0; f[2 * (r * N + c) + 1] = 0; }
      }
    }
  }
  const out = fft2(f, N, true);
  return magnitude(out, N);
}
