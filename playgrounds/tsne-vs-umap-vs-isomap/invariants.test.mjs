import { describe, it, expect } from 'vitest';
import { swissRoll, twoBlobs, pca, isomap, tsne } from './sim.js';

describe('dr-comparator: dataset generators', () => {
  it('swissRoll returns N x 3 array with N labels', () => {
    const d = swissRoll({ N: 100, seed: 1 });
    expect(d.X.length).toBe(300);
    expect(d.labels.length).toBe(100);
    expect(d.D).toBe(3);
    expect(d.N).toBe(100);
  });

  it('twoBlobs has roughly half points at each cluster', () => {
    const d = twoBlobs({ N: 200, seed: 1 });
    let zero = 0, one = 0;
    for (let i = 0; i < d.N; i += 1) { if (d.labels[i] === 0) zero += 1; else one += 1; }
    expect(zero).toBe(100);
    expect(one).toBe(100);
  });
});

describe('dr-comparator: PCA correctness', () => {
  it('PCA of two clearly separated blobs places them on opposite sides of the first PC', () => {
    const d = twoBlobs({ N: 80, seed: 1 });
    const Y = pca(d.X, d.N, d.D);
    let leftMean = 0, rightMean = 0, lc = 0, rc = 0;
    for (let i = 0; i < d.N; i += 1) {
      if (d.labels[i] === 0) { leftMean += Y[i * 2]; lc += 1; }
      else                    { rightMean += Y[i * 2]; rc += 1; }
    }
    leftMean /= lc; rightMean /= rc;
    expect(Math.abs(rightMean - leftMean)).toBeGreaterThan(1);
  });

  it('PCA output has 2N entries', () => {
    const d = twoBlobs({ N: 50, seed: 0 });
    const Y = pca(d.X, d.N, d.D);
    expect(Y.length).toBe(100);
  });
});

describe('dr-comparator: Isomap roughly preserves cluster structure', () => {
  it('Isomap of two blobs keeps the labels separable in the first coordinate', () => {
    const d = twoBlobs({ N: 60, seed: 1 });
    const Y = isomap(d.X, d.N, d.D, 6);
    let leftMean = 0, rightMean = 0, lc = 0, rc = 0;
    for (let i = 0; i < d.N; i += 1) {
      if (d.labels[i] === 0) { leftMean += Y[i * 2]; lc += 1; }
      else                    { rightMean += Y[i * 2]; rc += 1; }
    }
    leftMean /= lc; rightMean /= rc;
    expect(Math.abs(rightMean - leftMean)).toBeGreaterThan(0.5);
  });
});

describe('dr-comparator: t-SNE separates the two-blob clusters', () => {
  it('t-SNE post-200-iter places labels in disjoint regions on the first coord', () => {
    const d = twoBlobs({ N: 60, seed: 1 });
    const Y = tsne(d.X, d.N, d.D, { perplexity: 20, nIter: 200, seed: 0 });
    let leftMean = 0, rightMean = 0, lc = 0, rc = 0;
    for (let i = 0; i < d.N; i += 1) {
      if (d.labels[i] === 0) { leftMean += Y[i * 2]; lc += 1; }
      else                    { rightMean += Y[i * 2]; rc += 1; }
    }
    leftMean /= lc; rightMean /= rc;
    expect(Math.abs(rightMean - leftMean)).toBeGreaterThan(1);
  }, 60_000);
});
