// Computed-tomography reconstruction: the Radon transform, filtered
// back-projection with the Ram-Lak ramp filter, and the MLEM iterative
// algorithm (Kak and Slaney 1988; Shepp and Vardi 1982). Parallel-beam
// geometry on an N x N grid. Pure functions, deterministic, no RNG.

// A Shepp-Logan-style phantom: a sum of uniform-density ellipses
// rasterised onto an N x N image (attenuation, arbitrary units).
const ELL = [
  // x0,  y0,  a,    b,    angle, value
  [0.0, 0.0, 0.69, 0.92, 0, 1.0],
  [0.0, -0.0184, 0.6624, 0.874, 0, -0.8],
  [0.22, 0.0, 0.11, 0.31, -0.31, -0.2],
  [-0.22, 0.0, 0.16, 0.41, 0.31, -0.2],
  [0.0, 0.35, 0.21, 0.25, 0, 0.1],
  [0.0, 0.1, 0.046, 0.046, 0, 0.1],
  [0.0, -0.1, 0.046, 0.046, 0, 0.1],
  [-0.08, -0.605, 0.046, 0.023, 0, 0.1],
  [0.06, -0.605, 0.023, 0.046, 0, 0.1],
];
export function makePhantom(N) {
  const img = new Float64Array(N * N);
  for (let j = 0; j < N; j += 1) {
    const y = 2 * (j + 0.5) / N - 1;
    for (let i = 0; i < N; i += 1) {
      const x = 2 * (i + 0.5) / N - 1;
      let v = 0;
      for (const [x0, y0, a, b, ang, val] of ELL) {
        const c = Math.cos(ang), s = Math.sin(ang);
        const xr = (x - x0) * c + (y - y0) * s;
        const yr = -(x - x0) * s + (y - y0) * c;
        if (xr * xr / (a * a) + yr * yr / (b * b) <= 1) v += val;
      }
      img[j * N + i] = v;
    }
  }
  return img;
}

function bilinear(img, N, x, y) {
  // image coordinates in [-1,1]; return 0 outside
  const fi = (x + 1) / 2 * N - 0.5, fj = (y + 1) / 2 * N - 0.5;
  const i0 = Math.floor(fi), j0 = Math.floor(fj);
  if (i0 < 0 || j0 < 0 || i0 + 1 >= N || j0 + 1 >= N) return 0;
  const tx = fi - i0, ty = fj - j0;
  const a = img[j0 * N + i0], b = img[j0 * N + i0 + 1];
  const c = img[(j0 + 1) * N + i0], d = img[(j0 + 1) * N + i0 + 1];
  return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
}

// Forward Radon transform: parallel-beam projections at the given
// angles. Returns a sinogram [nAngles][nDet].
export function radon(img, N, angles, nDet = N) {
  const nS = Math.ceil(1.5 * N);
  const sino = [];
  const ds = 2 * Math.SQRT2 / nS;
  for (let ai = 0; ai < angles.length; ai += 1) {
    const th = angles[ai], ct = Math.cos(th), sstt = Math.sin(th);
    const row = new Float64Array(nDet);
    for (let di = 0; di < nDet; di += 1) {
      const t = 2 * (di + 0.5) / nDet - 1;               // detector position in [-1,1]
      let acc = 0;
      for (let k = 0; k < nS; k += 1) {
        const s = -Math.SQRT2 + (k + 0.5) * ds;
        const x = t * ct - s * sstt;
        const y = t * sstt + s * ct;
        acc += bilinear(img, N, x, y);
      }
      row[di] = acc * ds;
    }
    sino.push(row);
  }
  return sino;
}

export function projectionAngles(n) {
  const a = new Float64Array(n);
  for (let i = 0; i < n; i += 1) a[i] = Math.PI * i / n;
  return a;
}

// Discrete Ram-Lak (Ramachandran-Lakshminarayanan) ramp kernel
// (Kak and Slaney Eq. 3.29): h[0]=1/4, h[odd]= -1/(pi^2 n^2), else 0.
export function ramLakKernel(M) {
  const h = new Float64Array(2 * M + 1);
  for (let n = -M; n <= M; n += 1) {
    let v = 0;
    if (n === 0) v = 0.25;
    else if (n % 2 !== 0) v = -1 / (Math.PI * Math.PI * n * n);
    h[n + M] = v;
  }
  return h;
}
// Filter variants: 'ramlak', 'shepp' (sinc-windowed), 'none'.
export function filterProjection(proj, kind = 'ramlak') {
  const nd = proj.length;
  if (kind === 'none') return Float64Array.from(proj);
  const M = nd;
  const h = ramLakKernel(M);
  if (kind === 'shepp') {                                 // Shepp-Logan: sinc taper
    for (let n = -M; n <= M; n += 1) {
      const a = Math.PI * n / (2 * M);
      const w = n === 0 ? 1 : Math.sin(a) / a;
      h[n + M] *= w * w;
    }
  }
  const out = new Float64Array(nd);
  for (let i = 0; i < nd; i += 1) {
    let acc = 0;
    for (let n = -M; n <= M; n += 1) {
      const j = i - n;
      if (j >= 0 && j < nd) acc += h[n + M] * proj[j];
    }
    out[i] = acc;
  }
  return out;
}

// Back-projection of a (filtered) sinogram onto an N x N image.
export function backproject(sino, N, angles, nDet) {
  const img = new Float64Array(N * N);
  for (let ai = 0; ai < angles.length; ai += 1) {
    const th = angles[ai], ct = Math.cos(th), s2 = Math.sin(th);
    const row = sino[ai];
    for (let j = 0; j < N; j += 1) {
      const y = 2 * (j + 0.5) / N - 1;
      for (let i = 0; i < N; i += 1) {
        const x = 2 * (i + 0.5) / N - 1;
        const t = x * ct + y * s2;                        // detector coordinate
        const fd = (t + 1) / 2 * nDet - 0.5;
        const d0 = Math.floor(fd);
        if (d0 >= 0 && d0 + 1 < nDet) {
          const w = fd - d0;
          img[j * N + i] += (row[d0] * (1 - w) + row[d0 + 1] * w);
        }
      }
    }
  }
  const scale = Math.PI / angles.length;
  for (let k = 0; k < img.length; k += 1) img[k] *= scale;
  return img;
}

// Filtered back-projection.
export function fbp(sino, N, angles, nDet, kind = 'ramlak') {
  const filt = sino.map((p) => filterProjection(p, kind));
  return backproject(filt, N, angles, nDet);
}

// MLEM (Shepp and Vardi 1982): x_{k+1} = x_k / (A^T 1) * A^T (b / A x_k).
export function mlem(sino, N, angles, nDet, iters, phantom = null) {
  const x = new Float64Array(N * N).fill(1e-3);
  const ones = sino.map((p) => Float64Array.from(p).fill(1));
  const sens = backproject(ones, N, angles, nDet);        // A^T 1
  const rmseHist = [];
  for (let it = 0; it < iters; it += 1) {
    const fwd = radon(x, N, angles, nDet);
    const ratio = fwd.map((row, ai) => {
      const r = new Float64Array(row.length);
      for (let d = 0; d < row.length; d += 1) r[d] = row[d] > 1e-9 ? sino[ai][d] / row[d] : 0;
      return r;
    });
    const corr = backproject(ratio, N, angles, nDet);
    for (let k = 0; k < x.length; k += 1) x[k] = sens[k] > 1e-12 ? x[k] * corr[k] / sens[k] : x[k];
    if (phantom) rmseHist.push(rmse(x, phantom));
  }
  return { image: x, rmseHist };
}

export function rmse(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i += 1) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s / a.length);
}
// Reconstruction signal-to-noise vs the phantom (dB-free ratio).
export function snr(recon, phantom) {
  let sig = 0, err = 0;
  for (let i = 0; i < phantom.length; i += 1) { sig += phantom[i] ** 2; err += (recon[i] - phantom[i]) ** 2; }
  return err > 0 ? Math.sqrt(sig / err) : Infinity;
}
