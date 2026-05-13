import { describe, it, expect } from 'vitest';
import { torus, hopfLink, fiveClustersRing, swissRoll, sCurve, pca, isomap, tsne } from './sim.js';

describe('dr-comparator: dataset generators', () => {
  it('torus returns N x 3 array; all points lie on torus surface', () => {
    const d = torus({ N: 200, seed: 1, R: 2.0, r: 0.7 });
    expect(d.X.length).toBe(600);
    expect(d.D).toBe(3);
    expect(d.N).toBe(200);
    // Torus surface check: distance from generic point (x, y, z) to torus
    // axis r_axis = sqrt(x^2 + y^2) - R; distance to surface = sqrt(r_axis^2 + z^2) - r.
    // We expect this to be 0 within numerical tolerance for all points.
    for (let i = 0; i < d.N; i += 1) {
      const x = d.X[i * 3], y = d.X[i * 3 + 1], z = d.X[i * 3 + 2];
      const rAxis = Math.sqrt(x * x + y * y) - 2.0;
      const dSurface = Math.sqrt(rAxis * rAxis + z * z) - 0.7;
      expect(Math.abs(dSurface)).toBeLessThan(1e-10);
    }
  });

  it('hopfLink has two linked rings (half of points on each)', () => {
    const d = hopfLink({ N: 200, seed: 1 });
    let countA = 0, countB = 0;
    for (let i = 0; i < d.N; i += 1) {
      if (d.labels[i] < 1) countA += 1; else countB += 1;
    }
    expect(countA).toBe(100);
    expect(countB).toBe(100);
  });

  it('fiveClustersRing has 5 clusters with N/5 points each', () => {
    const d = fiveClustersRing({ N: 250, seed: 1 });
    expect(d.D).toBe(5);
    const counts = [0, 0, 0, 0, 0];
    for (let i = 0; i < d.N; i += 1) counts[Math.round(d.labels[i])] += 1;
    for (let k = 0; k < 5; k += 1) expect(counts[k]).toBe(50);
  });
});

function clusterCentroids(Y, labels, K, N) {
  const cx = new Float64Array(K), cy = new Float64Array(K), cn = new Float64Array(K);
  for (let i = 0; i < N; i += 1) {
    const k = Math.round(labels[i]);
    cx[k] += Y[i * 2]; cy[k] += Y[i * 2 + 1]; cn[k] += 1;
  }
  for (let k = 0; k < K; k += 1) { cx[k] /= cn[k]; cy[k] /= cn[k]; }
  return { cx, cy };
}

function minPairDistance(cx, cy, K) {
  let d = Infinity;
  for (let i = 0; i < K; i += 1) for (let j = i + 1; j < K; j += 1) {
    const r = Math.hypot(cx[i] - cx[j], cy[i] - cy[j]);
    if (r < d) d = r;
  }
  return d;
}

describe('dr-comparator: each method separates the 5D cluster ring', () => {
  it('PCA produces 5 well-separated cluster centroids in 2D', () => {
    const d = fiveClustersRing({ N: 200, seed: 1 });
    const Y = pca(d.X, d.N, d.D);
    const { cx, cy } = clusterCentroids(Y, d.labels, 5, d.N);
    expect(minPairDistance(cx, cy, 5)).toBeGreaterThan(1.5);
  });

  it('Isomap also separates the 5D clusters (k = 20 needed for connectivity at N = 200)', () => {
    const d = fiveClustersRing({ N: 200, seed: 1 });
    const Y = isomap(d.X, d.N, d.D, 20);
    const { cx, cy } = clusterCentroids(Y, d.labels, 5, d.N);
    expect(minPairDistance(cx, cy, 5)).toBeGreaterThan(0.5);
  });

  it('t-SNE produces 5 visually disjoint clumps', () => {
    const d = fiveClustersRing({ N: 150, seed: 1 });
    const Y = tsne(d.X, d.N, d.D, { perplexity: 20, nIter: 200, seed: 0 });
    const { cx, cy } = clusterCentroids(Y, d.labels, 5, d.N);
    expect(minPairDistance(cx, cy, 5)).toBeGreaterThan(2.0);
  }, 60_000);
});

describe('dr-comparator: PCA output shape', () => {
  it('PCA on torus returns 2N entries', () => {
    const d = torus({ N: 50, seed: 0 });
    const Y = pca(d.X, d.N, d.D);
    expect(Y.length).toBe(100);
  });
});

describe('dr-comparator: legacy datasets (kept exported)', () => {
  it('swissRoll still works (kept for backward compatibility)', () => {
    const d = swissRoll({ N: 50, seed: 0 });
    expect(d.D).toBe(3);
    expect(d.X.length).toBe(150);
  });
  it('sCurve still works', () => {
    const d = sCurve({ N: 50, seed: 0 });
    expect(d.D).toBe(3);
  });
});
