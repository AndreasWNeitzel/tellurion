// Coherent 4f optical processor. A lens performs a 2D Fourier
// transform in its back focal plane; a mask there filters spatial
// frequencies; a second lens transforms back. Object -> FFT ->
// (filter) -> IFFT -> image. In-line iterative radix-2 Cooley-Tukey
// FFT (power-of-two sizes), row-column 2D. Headless and deterministic
// (no RNG). Reference: Goodman, Introduction to Fourier Optics
// (4th ed.), Ch. 5-6 (`goodman-fourier`); Hecht, Optics (5th ed.),
// Ch. 13 (`hecht2017`).

// In-place iterative FFT on interleaved [re, im, re, im, ...].
// sign = -1 forward, +1 inverse (inverse also divides by N).
export function fft1(a, sign) {
  const n = a.length / 2;
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const ar = a[2 * i], ai = a[2 * i + 1];
      a[2 * i] = a[2 * j]; a[2 * i + 1] = a[2 * j + 1];
      a[2 * j] = ar; a[2 * j + 1] = ai;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = sign * 2 * Math.PI / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k += 1) {
        const ur = a[2 * (i + k)], ui = a[2 * (i + k) + 1];
        const vr0 = a[2 * (i + k + len / 2)], vi0 = a[2 * (i + k + len / 2) + 1];
        const vr = vr0 * cr - vi0 * ci, vi = vr0 * ci + vi0 * cr;
        a[2 * (i + k)] = ur + vr; a[2 * (i + k) + 1] = ui + vi;
        a[2 * (i + k + len / 2)] = ur - vr; a[2 * (i + k + len / 2) + 1] = ui - vi;
        const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr;
      }
    }
  }
  if (sign > 0) for (let i = 0; i < 2 * n; i += 1) a[i] /= n;
}

// 2D FFT by the row-column method on an N x N interleaved buffer.
export function fft2(buf, N, sign) {
  const row = new Float64Array(2 * N);
  for (let y = 0; y < N; y += 1) {
    for (let x = 0; x < N; x += 1) { row[2 * x] = buf[2 * (y * N + x)]; row[2 * x + 1] = buf[2 * (y * N + x) + 1]; }
    fft1(row, sign);
    for (let x = 0; x < N; x += 1) { buf[2 * (y * N + x)] = row[2 * x]; buf[2 * (y * N + x) + 1] = row[2 * x + 1]; }
  }
  const col = new Float64Array(2 * N);
  for (let x = 0; x < N; x += 1) {
    for (let y = 0; y < N; y += 1) { col[2 * y] = buf[2 * (y * N + x)]; col[2 * y + 1] = buf[2 * (y * N + x) + 1]; }
    fft1(col, sign);
    for (let y = 0; y < N; y += 1) { buf[2 * (y * N + x)] = col[2 * y]; buf[2 * (y * N + x) + 1] = col[2 * y + 1]; }
  }
}

export function toComplex(real, N) {
  const b = new Float64Array(2 * N * N);
  for (let i = 0; i < N * N; i += 1) b[2 * i] = real[i];
  return b;
}
export function magnitude(buf, N) {
  const m = new Float64Array(N * N);
  for (let i = 0; i < N * N; i += 1) m[i] = Math.hypot(buf[2 * i], buf[2 * i + 1]);
  return m;
}

// Centered radius for filtering: distance from the DC corner with
// wraparound (so frequency 0 is at index 0, the FFT convention).
function freqRadius(x, y, N) {
  const fx = x > N / 2 ? x - N : x;
  const fy = y > N / 2 ? y - N : y;
  return Math.hypot(fx, fy);
}

// Filter masks over the (unshifted) frequency grid. kind in
// {'none','low','high','slit'}; rc in pixels of radius.
export function filterMask(N, kind, rc) {
  const m = new Float64Array(N * N);
  for (let y = 0; y < N; y += 1) {
    for (let x = 0; x < N; x += 1) {
      const r = freqRadius(x, y, N);
      let v = 1;
      if (kind === 'low') v = r <= rc ? 1 : 0;
      else if (kind === 'high') v = r > rc ? 1 : 0;
      else if (kind === 'slit') { const fx = x > N / 2 ? x - N : x; v = Math.abs(fx) <= rc ? 1 : 0; }
      m[y * N + x] = v;
    }
  }
  return m;
}

// The 4f processor: object (real, length N*N) -> FFT -> multiply by
// mask -> inverse FFT -> intensity image (|field|^2, length N*N).
// Returns { spectrum (log-magnitude, fftshifted for display), image }.
export function propagate4f(object, N, mask) {
  const buf = toComplex(object, N);
  fft2(buf, N, -1);
  const specMag = new Float64Array(N * N);
  for (let i = 0; i < N * N; i += 1) specMag[i] = Math.hypot(buf[2 * i], buf[2 * i + 1]);
  if (mask) for (let i = 0; i < N * N; i += 1) { buf[2 * i] *= mask[i]; buf[2 * i + 1] *= mask[i]; }
  fft2(buf, N, 1);
  const image = new Float64Array(N * N);
  for (let i = 0; i < N * N; i += 1) image[i] = buf[2 * i] * buf[2 * i] + buf[2 * i + 1] * buf[2 * i + 1];
  // fftshift the spectrum magnitude for display (DC to centre)
  const spec = new Float64Array(N * N), h = N / 2;
  for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) {
    spec[((y + h) % N) * N + ((x + h) % N)] = Math.log1p(specMag[y * N + x]);
  }
  return { spectrum: spec, image };
}

// Object generators (real transmittance in [0,1], N x N).
export function makeObject(kind, N) {
  const o = new Float64Array(N * N);
  const c = N / 2;
  if (kind === 'grating') {
    const p = Math.max(4, Math.round(N / 16));
    for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) o[y * N + x] = (Math.floor(x / p) % 2 === 0) ? 1 : 0;
  } else if (kind === 'aperture') {
    const R = N * 0.18;
    for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) o[y * N + x] = Math.hypot(x - c, y - c) <= R ? 1 : 0;
  } else if (kind === 'doubleslit') {
    const w = Math.max(2, Math.round(N / 40)), d = Math.round(N / 8);
    for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) {
      const inY = Math.abs(y - c) < N * 0.3;
      o[y * N + x] = (inY && (Math.abs(x - (c - d)) < w || Math.abs(x - (c + d)) < w)) ? 1 : 0;
    }
  } else { // 'bars': a blocky letter-like pattern with sharp edges
    for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) {
      const gx = Math.floor((x / N) * 6), gy = Math.floor((y / N) * 6);
      o[y * N + x] = ((gx + gy) % 2 === 0 && gx > 0 && gx < 5 && gy > 0 && gy < 5) ? 1 : 0;
    }
  }
  return o;
}

export function meanOf(arr) { let s = 0; for (let i = 0; i < arr.length; i += 1) s += arr[i]; return s / arr.length; }

// Total squared gradient (a smoothness / edge-energy proxy).
export function gradientEnergy(img, N) {
  let g = 0;
  for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) {
    const dx = img[y * N + ((x + 1) % N)] - img[y * N + x];
    const dy = img[((y + 1) % N) * N + x] - img[y * N + x];
    g += dx * dx + dy * dy;
  }
  return g;
}
