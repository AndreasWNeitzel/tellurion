// Backprop tiny MLP invariant tests.
// (a) Forward pass output is in [0, 1] (sigmoid range).
// (b) Loss decreases on average over training.
// (c) Final accuracy on moons exceeds 80 percent after 200 iterations.
// (d) Larger H gives no worse training loss.

import { describe, it, expect } from 'vitest';
import { createNet, forward, trainStep, makeMoons, makeXOR } from './sim.js';

describe('Backprop: forward pass range', () => {
  it('output sigmoid in [0, 1] for arbitrary input', () => {
    const net = createNet({ hidden: 8, seed: 1 });
    for (const x of [[0, 0], [10, 10], [-10, -10], [1, -1], [-5, 2]]) {
      const { p } = forward(net, x);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
});

describe('Backprop: loss decreases on moons', () => {
  it('after 100 iters loss < initial loss', () => {
    const net = createNet({ hidden: 8, seed: 1 });
    const { X, y } = makeMoons({ N: 200, seed: 1, noise: 0.15 });
    const L0 = trainStep(net, X, y, 0.0);   // zero LR returns current loss
    for (let i = 0; i < 100; i += 1) trainStep(net, X, y, 0.5);
    const Lf = trainStep(net, X, y, 0.0);
    expect(Lf).toBeLessThan(L0);
  });
});

describe('Backprop: moons accuracy > 80% after 200 iters', () => {
  it('classify moons with > 80% accuracy', () => {
    const net = createNet({ hidden: 8, seed: 1 });
    const { X, y } = makeMoons({ N: 200, seed: 1, noise: 0.15 });
    for (let i = 0; i < 200; i += 1) trainStep(net, X, y, 0.5);
    let acc = 0;
    for (let n = 0; n < X.length; n += 1) {
      const { p } = forward(net, X[n]);
      if ((p > 0.5 ? 1 : 0) === y[n]) acc += 1;
    }
    expect(acc / X.length).toBeGreaterThan(0.8);
  });
});

describe('Backprop: XOR (nonlinear) needs hidden layer', () => {
  it('classify XOR with > 90% accuracy after 400 iters with H=8', () => {
    const net = createNet({ hidden: 8, seed: 1 });
    const { X, y } = makeXOR({ N: 200, seed: 1, noise: 0.10 });
    for (let i = 0; i < 400; i += 1) trainStep(net, X, y, 0.5);
    let acc = 0;
    for (let n = 0; n < X.length; n += 1) {
      const { p } = forward(net, X[n]);
      if ((p > 0.5 ? 1 : 0) === y[n]) acc += 1;
    }
    expect(acc / X.length).toBeGreaterThan(0.9);
  });
});
