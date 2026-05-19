// Fourier epicycle core (no DOM), shared by playground.js and
// invariants.test.mjs. The discrete Fourier transform of a closed
// planar path z_j = x_j + i y_j, and the truncated reconstruction
// (the epicycle-chain tip) at parameter t.
//
//   C_k = (1/N) sum_j z_j exp(-2 pi i k j / N)
//   z(t) ~ sum_{|k| small} C_k exp(2 pi i k t)
//
// Bins above the Nyquist frequency are mapped to negative k so each
// epicycle spins at its true signed rate. Reference: Bracewell, The
// Fourier Transform and Its Applications (3rd ed.), Chapters 2 and 18.

export function samplePath(name, n) {
  const out = new Array(n);
  for (let i = 0; i < n; i += 1) {
    const t = i / n;
    let x, y;
    switch (name) {
      case 'heart': {
        const a = 2 * Math.PI * t;
        x = 16 * Math.pow(Math.sin(a), 3);
        y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
        x *= 0.05; y *= 0.05;
        break;
      }
      case 'figure-eight': {
        const a = 2 * Math.PI * t;
        x = Math.sin(a);
        y = Math.sin(2 * a) * 0.6;
        break;
      }
      case 'star-5': {
        const a = 2 * Math.PI * t;
        const r = 0.6 + 0.3 * Math.cos(5 * a);
        x = r * Math.cos(a);
        y = r * Math.sin(a);
        break;
      }
      case 'letter-A': {
        // y-up: apex at the TOP (+0.8), feet at the bottom (-0.8). The
        // old coords had the apex at -0.8, so the A drew upside down.
        const segs = [
          [-0.6, -0.8], [0, 0.8], [0.6, -0.8], [-0.6, -0.8],
          [-0.3, 0.0], [0.3, 0.0], [-0.3, 0.0], [-0.6, -0.8],
        ];
        const segCount = segs.length - 1;
        const sf = t * segCount;
        const k = Math.floor(sf);
        const u = sf - k;
        const a = segs[k], b = segs[k + 1];
        x = a[0] + (b[0] - a[0]) * u;
        y = a[1] + (b[1] - a[1]) * u;
        break;
      }
      case 'circle': {
        const a = 2 * Math.PI * t;
        x = Math.cos(a); y = Math.sin(a);
        break;
      }
      case 'earth':
      default: {
        const a = 2 * Math.PI * t;
        const r = 0.7 + 0.05 * Math.sin(7 * a + 0.4) + 0.04 * Math.cos(11 * a + 1.1);
        x = r * Math.cos(a);
        y = r * Math.sin(a);
        break;
      }
    }
    out[i] = { x, y };
  }
  return out;
}

export function dft(path) {
  const n = path.length;
  const coeffs = [];
  for (let k = 0; k < n; k += 1) {
    let re = 0, im = 0;
    for (let j = 0; j < n; j += 1) {
      const ph = -2 * Math.PI * k * j / n;
      const c = Math.cos(ph), s = Math.sin(ph);
      re += path[j].x * c - path[j].y * s;
      im += path[j].x * s + path[j].y * c;
    }
    const kSigned = k <= n / 2 ? k : k - n;
    coeffs.push({ k: kSigned, re: re / n, im: im / n, amp: Math.hypot(re / n, im / n) });
  }
  coeffs.sort((a, b) => b.amp - a.amp);
  return coeffs;
}

export function reconstruct(coeffs, M, tFrac) {
  let x = 0, y = 0;
  for (let i = 0; i < Math.min(M, coeffs.length); i += 1) {
    const c = coeffs[i];
    const ph = 2 * Math.PI * c.k * tFrac;
    const co = Math.cos(ph), si = Math.sin(ph);
    x += c.re * co - c.im * si;
    y += c.re * si + c.im * co;
  }
  return { x, y };
}

export function rmsError(coeffs, M, path) {
  let s = 0;
  for (let i = 0; i < path.length; i += 1) {
    const t = i / path.length;
    const z = reconstruct(coeffs, M, t);
    s += (z.x - path[i].x) ** 2 + (z.y - path[i].y) ** 2;
  }
  return Math.sqrt(s / path.length);
}
