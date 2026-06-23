// sim.js
// Three dimensionality-reduction methods on a synthetic 3D dataset:
//   1. PCA               (closed form via covariance eigendecomposition)
//   2. Isomap            (geodesic distances on a k-NN graph, then MDS)
//   3. t-SNE-lite        (KL gradient descent in 2D against Gaussian
//                         affinities in 3D)
// All three are implemented from scratch. This is a teaching reference,
// not a production t-SNE.

import { makeRng, gaussian } from '../../../shared/js/render/rng.js';

// ==== datasets ============================================================

// Torus surface in 3D: intrinsically 2D (S^1 x S^1) but topologically a torus,
// so it has a hole and cannot be flattened by a single linear projection.
// PCA produces a disc; Isomap recovers something close to the periodic
// (theta, phi) parameterization; t-SNE preserves local neighborhoods. The
// label is the toroidal angle theta in [0, 2 pi).
export function torus({ N = 500, seed = 0xC0FFEE, R = 2.0, r = 0.7 } = {}) {
  const rng = makeRng(seed);
  const X = new Float64Array(N * 3);
  const labels = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const theta = 2 * Math.PI * rng();    // toroidal (around the hole)
    const phi   = 2 * Math.PI * rng();    // poloidal (around the tube)
    X[i * 3]     = (R + r * Math.cos(phi)) * Math.cos(theta);
    X[i * 3 + 1] = (R + r * Math.cos(phi)) * Math.sin(theta);
    X[i * 3 + 2] = r * Math.sin(phi);
    labels[i] = theta;
  }
  return { X, labels, N, D: 3 };
}

// Hopf link: two interlocked circles in 3D. Each ring is intrinsically 1D
// but the two rings are topologically linked so they cannot be separated
// in 3-space without passing through each other. The label distinguishes
// the two rings, then varies along each circle.
export function hopfLink({ N = 500, seed = 0xC0FFEE } = {}) {
  const rng = makeRng(seed);
  const X = new Float64Array(N * 3);
  const labels = new Float64Array(N);
  const halfN = Math.floor(N / 2);
  const R = 2.0;     // ring radius
  const eps = 0.10;  // thickness of each ring (so rings are quasi-1D but with width)
  for (let i = 0; i < N; i += 1) {
    const onRingA = i < halfN;
    const u = 2 * Math.PI * rng();
    const dx = gaussian(rng, 0, eps);
    const dy = gaussian(rng, 0, eps);
    const dz = gaussian(rng, 0, eps);
    if (onRingA) {
      // Ring A in the xy plane, centered at origin.
      X[i * 3]     = R * Math.cos(u) + dx;
      X[i * 3 + 1] = R * Math.sin(u) + dy;
      X[i * 3 + 2] = 0 + dz;
      labels[i] = u / (2 * Math.PI);  // [0, 1)
    } else {
      // Ring B in the xz plane, offset so the two rings link through each other.
      X[i * 3]     = R + R * Math.cos(u) + dx;
      X[i * 3 + 1] = 0 + dy;
      X[i * 3 + 2] = R * Math.sin(u) + dz;
      labels[i] = 1 + u / (2 * Math.PI);  // [1, 2)
    }
  }
  return { X, labels, N, D: 3 };
}

// Five Gaussian clusters arranged around a circle in dim-D (default 5D).
// The signal lives in dims 0, 1 (the ring); dims 2..D-1 are pure noise.
// A useful DR method should recover five tight clumps and ignore the noise.
// Canonical "intrinsic dimension 0, ambient dimension 5" toy.
export function fiveClustersRing({ N = 500, seed = 0xC0FFEE, dim = 5 } = {}) {
  const rng = makeRng(seed);
  const K = 5;
  const X = new Float64Array(N * dim);
  const labels = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const k = i % K;
    const theta = 2 * Math.PI * k / K;
    X[i * dim]     = 3 * Math.cos(theta) + gaussian(rng, 0, 0.4);
    X[i * dim + 1] = 3 * Math.sin(theta) + gaussian(rng, 0, 0.4);
    for (let d = 2; d < dim; d += 1) X[i * dim + d] = gaussian(rng, 0, 0.8);
    labels[i] = k;
  }
  return { X, labels, N, D: dim };
}

// Kept for backward compatibility with the invariants test which imports
// swissRoll and sCurve. Not exposed in the playground dropdown.
export function swissRoll({ N = 400, seed = 0xC0FFEE } = {}) {
  const rng = makeRng(seed);
  const X = new Float64Array(N * 3);
  const labels = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const t = 1.5 * Math.PI * (1 + 2 * rng());
    const h = 20 * rng();
    X[i * 3]     = t * Math.cos(t);
    X[i * 3 + 1] = h;
    X[i * 3 + 2] = t * Math.sin(t);
    labels[i] = t;
  }
  return { X, labels, N, D: 3 };
}
export function sCurve({ N = 400, seed = 0xC0FFEE } = {}) {
  const rng = makeRng(seed);
  const X = new Float64Array(N * 3);
  const labels = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const t = (-1.5 + 3 * rng()) * Math.PI;
    const h = 4 * rng() - 2;
    X[i * 3]     = Math.sin(t);
    X[i * 3 + 1] = h;
    X[i * 3 + 2] = Math.sign(t) * (1 - Math.cos(t));
    labels[i] = t;
  }
  return { X, labels, N, D: 3 };
}

// Two interleaved moons: the classic ML test set. The two crescents
// share a half-overlap so linear methods cannot separate them but
// neighbourhood-preserving methods can.
export function twoMoons({ N = 500, seed = 0xC0FFEE, noise = 0.1 } = {}) {
  const rng = makeRng(seed);
  const X = new Float64Array(N * 3);
  const labels = new Float64Array(N);
  const halfN = Math.floor(N / 2);
  for (let i = 0; i < N; i += 1) {
    const isUpper = i < halfN;
    const t = Math.PI * rng();
    if (isUpper) {
      X[i * 3]     = Math.cos(t) + gaussian(rng, 0, noise);
      X[i * 3 + 1] = Math.sin(t) + gaussian(rng, 0, noise);
      X[i * 3 + 2] = gaussian(rng, 0, noise);
      labels[i] = 0;
    } else {
      X[i * 3]     = 1 - Math.cos(t) + gaussian(rng, 0, noise);
      X[i * 3 + 1] = -Math.sin(t) + 0.5 + gaussian(rng, 0, noise);
      X[i * 3 + 2] = gaussian(rng, 0, noise);
      labels[i] = 1;
    }
  }
  return { X, labels, N, D: 3 };
}

// Pinwheel: K = 5 spiral arms in 2D embedded in 3D ambient. Each
// arm is a stretched Gaussian rotated into place. Tests whether DR
// preserves the curved cluster shapes.
export function pinwheel({ N = 500, seed = 0xC0FFEE, K = 5 } = {}) {
  const rng = makeRng(seed);
  const X = new Float64Array(N * 3);
  const labels = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const k = i % K;
    const armAngle = 2 * Math.PI * k / K;
    const r = 0.3 + 1.5 * rng();
    const swirl = armAngle + 1.4 * r + gaussian(rng, 0, 0.18);
    X[i * 3]     = r * Math.cos(swirl) + gaussian(rng, 0, 0.05);
    X[i * 3 + 1] = r * Math.sin(swirl) + gaussian(rng, 0, 0.05);
    X[i * 3 + 2] = gaussian(rng, 0, 0.1);
    labels[i] = k;
  }
  return { X, labels, N, D: 3 };
}

// Spheres: K = 3 concentric spherical shells in 3D. Linear methods
// project them on top of each other; geodesic methods (Isomap) keep
// them separable.
export function concentricSpheres({ N = 500, seed = 0xC0FFEE, K = 3 } = {}) {
  const rng = makeRng(seed);
  const X = new Float64Array(N * 3);
  const labels = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const k = i % K;
    const R = 0.7 + 0.7 * k;
    const u = 2 * rng() - 1, phi = 2 * Math.PI * rng();
    const s = Math.sqrt(1 - u * u);
    X[i * 3]     = R * s * Math.cos(phi) + gaussian(rng, 0, 0.03);
    X[i * 3 + 1] = R * u + gaussian(rng, 0, 0.03);
    X[i * 3 + 2] = R * s * Math.sin(phi) + gaussian(rng, 0, 0.03);
    labels[i] = k;
  }
  return { X, labels, N, D: 3 };
}

export const DATASETS = {
  'torus':              torus,
  'hopf-link':          hopfLink,
  'clusters-5d':        fiveClustersRing,
  'swiss-roll':         swissRoll,
  's-curve':            sCurve,
  'two-moons':          twoMoons,
  'pinwheel':           pinwheel,
  'concentric-spheres': concentricSpheres,
};

// ==== linear algebra helpers ==============================================

function sqDist(X, D, i, j) {
  let s = 0;
  for (let d = 0; d < D; d += 1) {
    const v = X[i * D + d] - X[j * D + d];
    s += v * v;
  }
  return s;
}

function meanColumns(X, N, D) {
  const mu = new Float64Array(D);
  for (let i = 0; i < N; i += 1) {
    for (let d = 0; d < D; d += 1) mu[d] += X[i * D + d];
  }
  for (let d = 0; d < D; d += 1) mu[d] /= N;
  return mu;
}

function topEigen(M, D, k = 2, maxIter = 500, tol = 1e-10) {
  function copyM(M) {
    const out = new Float64Array(D * D);
    for (let i = 0; i < D * D; i += 1) out[i] = M[i];
    return out;
  }
  function matvec(M, v) {
    const out = new Float64Array(D);
    for (let i = 0; i < D; i += 1) {
      let s = 0;
      for (let j = 0; j < D; j += 1) s += M[i * D + j] * v[j];
      out[i] = s;
    }
    return out;
  }
  function dot(a, b) { let s = 0; for (let i = 0; i < D; i += 1) s += a[i] * b[i]; return s; }
  function normalize(v) {
    const n = Math.sqrt(dot(v, v));
    if (n === 0) return v;
    const out = new Float64Array(D);
    for (let i = 0; i < D; i += 1) out[i] = v[i] / n;
    return out;
  }
  const vecs = [];
  const vals = [];
  const A = copyM(M);
  const rng = makeRng(7);
  for (let m = 0; m < k; m += 1) {
    let v = new Float64Array(D);
    for (let i = 0; i < D; i += 1) v[i] = rng() - 0.5;
    v = normalize(v);
    let lambda = 0;
    for (let it = 0; it < maxIter; it += 1) {
      const w = matvec(A, v);
      const newLambda = dot(v, w);
      const wn = normalize(w);
      const diff = Math.abs(newLambda - lambda);
      lambda = newLambda;
      v = wn;
      if (diff < tol) break;
    }
    vecs.push(v);
    vals.push(lambda);
    for (let i = 0; i < D; i += 1) {
      for (let j = 0; j < D; j += 1) {
        A[i * D + j] -= lambda * v[i] * v[j];
      }
    }
  }
  return { vecs, vals };
}

// ==== PCA =================================================================

export function pca(X, N, D) {
  const mu = meanColumns(X, N, D);
  const C = new Float64Array(D * D);
  for (let i = 0; i < N; i += 1) {
    for (let a = 0; a < D; a += 1) {
      const va = X[i * D + a] - mu[a];
      for (let b = 0; b < D; b += 1) {
        const vb = X[i * D + b] - mu[b];
        C[a * D + b] += va * vb;
      }
    }
  }
  for (let i = 0; i < D * D; i += 1) C[i] /= (N - 1);
  const { vecs } = topEigen(C, D, 2);
  const Y = new Float64Array(N * 2);
  for (let i = 0; i < N; i += 1) {
    let p1 = 0, p2 = 0;
    for (let d = 0; d < D; d += 1) {
      p1 += (X[i * D + d] - mu[d]) * vecs[0][d];
      p2 += (X[i * D + d] - mu[d]) * vecs[1][d];
    }
    Y[i * 2]     = p1;
    Y[i * 2 + 1] = p2;
  }
  return Y;
}

// ==== Isomap-lite =========================================================

export function isomap(X, N, D, k = 8) {
  const dist = new Float64Array(N * N);
  for (let i = 0; i < N * N; i += 1) dist[i] = Infinity;
  for (let i = 0; i < N; i += 1) dist[i * N + i] = 0;
  for (let i = 0; i < N; i += 1) {
    const d2 = new Float64Array(N);
    for (let j = 0; j < N; j += 1) d2[j] = Math.sqrt(sqDist(X, D, i, j));
    const idx = Array.from({ length: N }, (_, j) => j);
    idx.sort((a, b) => d2[a] - d2[b]);
    for (let n = 0; n <= k; n += 1) {
      const j = idx[n];
      dist[i * N + j] = d2[j];
      dist[j * N + i] = d2[j];
    }
  }
  // Guarantee the neighbour graph is a single connected component by adding
  // minimum-spanning-tree edges (Prim on the full Euclidean distances). A
  // manifold with a gap otherwise splits into pieces, and filling the missing
  // geodesics with a huge constant dominates the MDS and collapses the whole
  // embedding to a line plus an outlier. The MST bridges each gap with one
  // real edge, so the geodesics stay meaningful.
  {
    const inTree = new Uint8Array(N);
    const best = new Float64Array(N).fill(Infinity);
    const bestFrom = new Int32Array(N).fill(-1);
    best[0] = 0;
    for (let it = 0; it < N; it += 1) {
      let u = -1, bu = Infinity;
      for (let v = 0; v < N; v += 1) if (!inTree[v] && best[v] < bu) { bu = best[v]; u = v; }
      if (u < 0) break;
      inTree[u] = 1;
      const f = bestFrom[u];
      if (f >= 0) {
        const d = Math.sqrt(sqDist(X, D, u, f));
        if (d < dist[u * N + f]) { dist[u * N + f] = d; dist[f * N + u] = d; }
      }
      for (let v = 0; v < N; v += 1) if (!inTree[v]) {
        const d2v = sqDist(X, D, u, v);
        if (d2v < best[v]) { best[v] = d2v; bestFrom[v] = u; }
      }
    }
  }
  for (let m = 0; m < N; m += 1) {
    for (let i = 0; i < N; i += 1) {
      const dim = dist[i * N + m];
      if (dim === Infinity) continue;
      for (let j = 0; j < N; j += 1) {
        const candidate = dim + dist[m * N + j];
        if (candidate < dist[i * N + j]) dist[i * N + j] = candidate;
      }
    }
  }
  // If the k-NN graph is disconnected (well-separated clusters with k less
  // than the largest cluster), some entries remain Infinity. Replace those
  // with 2x the largest finite geodesic so MDS centering stays defined and
  // the cluster topology is preserved.
  let maxFinite = 0;
  for (let i = 0; i < N * N; i += 1) {
    if (dist[i] !== Infinity && dist[i] > maxFinite) maxFinite = dist[i];
  }
  const bigD = (maxFinite > 0 ? maxFinite : 1) * 2;
  for (let i = 0; i < N * N; i += 1) if (dist[i] === Infinity) dist[i] = bigD;
  const D2 = new Float64Array(N * N);
  for (let i = 0; i < N * N; i += 1) D2[i] = dist[i] * dist[i];
  const rowMean = new Float64Array(N), colMean = new Float64Array(N);
  let grand = 0;
  for (let i = 0; i < N; i += 1) {
    for (let j = 0; j < N; j += 1) { rowMean[i] += D2[i * N + j]; colMean[j] += D2[i * N + j]; }
  }
  for (let i = 0; i < N; i += 1) { rowMean[i] /= N; colMean[i] /= N; grand += rowMean[i]; }
  grand /= N;
  const B = new Float64Array(N * N);
  for (let i = 0; i < N; i += 1) for (let j = 0; j < N; j += 1) {
    B[i * N + j] = -0.5 * (D2[i * N + j] - rowMean[i] - colMean[j] + grand);
  }
  const { vecs, vals } = topEigen(B, N, 2);
  const Y = new Float64Array(N * 2);
  for (let i = 0; i < N; i += 1) {
    Y[i * 2]     = vecs[0][i] * Math.sqrt(Math.max(0, vals[0]));
    Y[i * 2 + 1] = vecs[1][i] * Math.sqrt(Math.max(0, vals[1]));
  }
  return Y;
}

// ==== t-SNE-lite ==========================================================

export function tsne(X, N, D, { perplexity = 30, nIter = 250, lr = 100, seed = 1 } = {}) {
  const rng = makeRng(seed);
  const dist = new Float64Array(N * N);
  for (let i = 0; i < N; i += 1)
    for (let j = 0; j < N; j += 1)
      dist[i * N + j] = sqDist(X, D, i, j);

  const targetH = Math.log(perplexity);
  const P = new Float64Array(N * N);
  for (let i = 0; i < N; i += 1) {
    let lo = 1e-9, hi = 1e9, beta = 1.0;
    for (let it = 0; it < 50; it += 1) {
      let sum = 0;
      for (let j = 0; j < N; j += 1) {
        if (i === j) continue;
        P[i * N + j] = Math.exp(-dist[i * N + j] * beta);
        sum += P[i * N + j];
      }
      let H = 0;
      for (let j = 0; j < N; j += 1) {
        if (i === j) continue;
        const p = P[i * N + j] / sum;
        if (p > 0) H -= p * Math.log(p);
      }
      const diff = H - targetH;
      if (Math.abs(diff) < 1e-3) break;
      if (diff > 0) { lo = beta; beta = hi === 1e9 ? beta * 2 : (beta + hi) / 2; }
      else          { hi = beta; beta = (beta + lo) / 2; }
    }
    let sum = 0;
    for (let j = 0; j < N; j += 1) if (i !== j) sum += P[i * N + j];
    for (let j = 0; j < N; j += 1) if (i !== j) P[i * N + j] /= sum;
  }
  for (let i = 0; i < N; i += 1) for (let j = i + 1; j < N; j += 1) {
    const v = (P[i * N + j] + P[j * N + i]) / (2 * N);
    P[i * N + j] = v;
    P[j * N + i] = v;
  }
  for (let i = 0; i < N * N; i += 1) if (P[i] < 1e-12) P[i] = 1e-12;

  const Y = new Float64Array(N * 2);
  for (let i = 0; i < N * 2; i += 1) Y[i] = gaussian(rng, 0, 1e-2);
  const dY = new Float64Array(N * 2);
  const yPrev = new Float64Array(N * 2);
  let momentum = 0.5;

  for (let it = 0; it < nIter; it += 1) {
    const Q = new Float64Array(N * N);
    const num = new Float64Array(N * N);
    let qSum = 0;
    for (let i = 0; i < N; i += 1) {
      for (let j = 0; j < N; j += 1) {
        if (i === j) { num[i * N + j] = 0; continue; }
        const dx = Y[i * 2] - Y[j * 2];
        const dy = Y[i * 2 + 1] - Y[j * 2 + 1];
        const v = 1 / (1 + dx * dx + dy * dy);
        num[i * N + j] = v;
        qSum += v;
      }
    }
    for (let i = 0; i < N * N; i += 1) Q[i] = Math.max(num[i] / qSum, 1e-12);
    for (let i = 0; i < N * 2; i += 1) dY[i] = 0;
    for (let i = 0; i < N; i += 1) {
      for (let j = 0; j < N; j += 1) {
        if (i === j) continue;
        const factor = (P[i * N + j] - Q[i * N + j]) * num[i * N + j];
        dY[i * 2]     += 4 * factor * (Y[i * 2]     - Y[j * 2]);
        dY[i * 2 + 1] += 4 * factor * (Y[i * 2 + 1] - Y[j * 2 + 1]);
      }
    }
    if (it === 50) momentum = 0.8;
    for (let i = 0; i < N * 2; i += 1) {
      const step = -lr * dY[i] + momentum * (Y[i] - yPrev[i]);
      yPrev[i] = Y[i];
      Y[i] += step;
    }
    let mx = 0, my = 0;
    for (let i = 0; i < N; i += 1) { mx += Y[i * 2]; my += Y[i * 2 + 1]; }
    mx /= N; my /= N;
    for (let i = 0; i < N; i += 1) { Y[i * 2] -= mx; Y[i * 2 + 1] -= my; }
  }
  return Y;
}
