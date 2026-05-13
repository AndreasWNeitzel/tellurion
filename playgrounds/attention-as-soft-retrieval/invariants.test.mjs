import { describe, it, expect } from 'vitest';
import { softmax, attention, entropy, argmax } from './sim.js';

describe('softmax: basic properties', () => {
  it('weights sum to 1', () => {
    const w = softmax([1, 2, 3, 0.5], 0.7);
    expect(Math.abs(w.reduce((a, b) => a + b, 0) - 1)).toBeLessThan(1e-12);
  });

  it('order preserved by softmax (monotone)', () => {
    const logits = [-1, 0, 0.5, 2];
    const w = softmax(logits, 1);
    for (let i = 1; i < logits.length; i += 1) {
      expect(w[i]).toBeGreaterThan(w[i - 1]);
    }
  });

  it('tau -> 0 collapses to one-hot at argmax', () => {
    const logits = [0.3, 0.9, 0.1, 0.85];
    const w = softmax(logits, 1e-3);
    const am = argmax(logits);
    expect(w[am]).toBeGreaterThan(0.99);
    for (let i = 0; i < w.length; i += 1) if (i !== am) expect(w[i]).toBeLessThan(0.01);
  });

  it('tau -> infinity gives the uniform distribution', () => {
    const logits = [0.3, 0.9, 0.1, 0.85, -0.2];
    const w = softmax(logits, 1e8);
    for (const wi of w) expect(Math.abs(wi - 1 / w.length)).toBeLessThan(1e-6);
  });
});

describe('attention: full pipeline', () => {
  it('output = weighted sum of values', () => {
    const keys   = [[1, 0], [0, 1], [-1, 0]];
    const values = [[10], [20], [30]];
    const query  = [0.5, 0.5];
    const r = attention(query, keys, values, 0.7);
    let manual = 0;
    for (let i = 0; i < keys.length; i += 1) manual += r.weights[i] * values[i][0];
    expect(Math.abs(r.output[0] - manual)).toBeLessThan(1e-12);
  });

  it('query exactly at one key with small tau retrieves that value', () => {
    const keys   = [[1, 0], [0, 1], [-1, 0]];
    const values = [[10], [20], [30]];
    const r = attention([0, 1], keys, values, 0.05);
    // Closest key is index 1, value = 20.
    expect(Math.abs(r.output[0] - 20)).toBeLessThan(0.5);
    expect(r.weights[1]).toBeGreaterThan(0.9);
  });
});

describe('attention: entropy invariants', () => {
  it('entropy is bounded by log(N)', () => {
    const keys   = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    const values = [[1], [2], [3], [4]];
    for (const tau of [0.1, 0.5, 1, 5, 100]) {
      const r = attention([0.3, 0.4], keys, values, tau);
      const h = entropy(r.weights);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(Math.log(keys.length) + 1e-12);
    }
  });

  it('entropy monotone non-decreasing in tau', () => {
    const keys   = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    const values = [[1], [2], [3], [4]];
    const q = [0.3, 0.7];
    let prev = -Infinity;
    for (const tau of [0.05, 0.2, 0.5, 1, 2, 10]) {
      const r = attention(q, keys, values, tau);
      const h = entropy(r.weights);
      expect(h).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = h;
    }
  });
});
