// sim.js
// Tiny 2-input MLP trained on a 2D binary classification task.
// Architecture: 2 -> H -> 1 with tanh hidden activation and sigmoid output.
// Loss: binary cross-entropy. Trained with vanilla SGD or mini-batch SGD.
//
// Reference: Goodfellow-Bengio-Courville 2016 Ch. 6 (backpropagation);
// Bishop-Bishop 2024 PRML 2e Ch. 6.

import { makeRng } from '../../shared/js/render/rng.js';

const sigmoid = (z) => 1 / (1 + Math.exp(-z));
const tanh = (z) => Math.tanh(z);
const dtanh = (a) => 1 - a * a;

export function createNet({ hidden = 8, seed = 0xC0FFEE } = {}) {
  const rng = makeRng(seed);
  function he(n) { return (rng() * 2 - 1) * Math.sqrt(2 / n); }
  // Input dim 2 -> hidden -> 1
  const W1 = Array.from({ length: hidden }, () => [he(2), he(2)]);
  const b1 = Array.from({ length: hidden }, () => 0);
  const W2 = Array.from({ length: hidden }, () => he(hidden));
  let b2 = 0;
  return { hidden, W1, b1, W2, b2 };
}

export function forward(net, x) {
  const { hidden, W1, b1, W2, b2 } = net;
  const a1 = new Float64Array(hidden);
  for (let i = 0; i < hidden; i += 1) {
    a1[i] = tanh(W1[i][0] * x[0] + W1[i][1] * x[1] + b1[i]);
  }
  let z2 = b2;
  for (let i = 0; i < hidden; i += 1) z2 += W2[i] * a1[i];
  return { a1, p: sigmoid(z2) };
}

// One mini-batch SGD step on the binary cross-entropy loss.
// Returns the loss for telemetry.
export function trainStep(net, X, y, lr = 0.1) {
  const { hidden, W1, b1, W2 } = net;
  let lossSum = 0;
  // Accumulate gradients across the batch.
  const dW1 = Array.from({ length: hidden }, () => [0, 0]);
  const db1 = new Float64Array(hidden);
  const dW2 = new Float64Array(hidden);
  let db2 = 0;
  const N = X.length;
  for (let n = 0; n < N; n += 1) {
    const { a1, p } = forward(net, X[n]);
    const yn = y[n];
    // BCE loss: -y log p - (1-y) log (1-p)
    lossSum += -(yn * Math.log(p + 1e-12) + (1 - yn) * Math.log(1 - p + 1e-12));
    // dL/dz2 = p - y
    const dz2 = p - yn;
    db2 += dz2;
    for (let i = 0; i < hidden; i += 1) {
      dW2[i] += dz2 * a1[i];
      // dL/da1_i = dz2 * W2[i]
      const da1 = dz2 * W2[i];
      // dL/dz1_i = da1 * dtanh(a1)
      const dz1 = da1 * dtanh(a1[i]);
      db1[i] += dz1;
      dW1[i][0] += dz1 * X[n][0];
      dW1[i][1] += dz1 * X[n][1];
    }
  }
  // Apply gradient
  const invN = 1 / N;
  for (let i = 0; i < hidden; i += 1) {
    W1[i][0] -= lr * dW1[i][0] * invN;
    W1[i][1] -= lr * dW1[i][1] * invN;
    b1[i] -= lr * db1[i] * invN;
    W2[i] -= lr * dW2[i] * invN;
  }
  net.b2 -= lr * db2 * invN;
  return lossSum / N;
}

// Datasets
export function makeMoons({ N = 200, seed = 1, noise = 0.15 } = {}) {
  const rng = makeRng(seed);
  const X = [], y = [];
  const half = N / 2;
  for (let i = 0; i < half; i += 1) {
    const t = Math.PI * (i / half);
    X.push([Math.cos(t) + (rng() * 2 - 1) * noise, Math.sin(t) + (rng() * 2 - 1) * noise]);
    y.push(0);
  }
  for (let i = 0; i < half; i += 1) {
    const t = Math.PI * (i / half);
    X.push([1 - Math.cos(t) + (rng() * 2 - 1) * noise, -Math.sin(t) + 0.5 + (rng() * 2 - 1) * noise]);
    y.push(1);
  }
  return { X, y };
}

export function makeXOR({ N = 200, seed = 1, noise = 0.10 } = {}) {
  const rng = makeRng(seed);
  const X = [], y = [];
  for (let i = 0; i < N; i += 1) {
    const xq = (rng() < 0.5 ? -1 : 1) + (rng() * 2 - 1) * noise;
    const yq = (rng() < 0.5 ? -1 : 1) + (rng() * 2 - 1) * noise;
    X.push([xq, yq]);
    y.push(xq * yq > 0 ? 0 : 1);
  }
  return { X, y };
}

export function makeSpiral({ N = 200, seed = 1, noise = 0.15 } = {}) {
  const rng = makeRng(seed);
  const X = [], y = [];
  const half = N / 2;
  for (let cls = 0; cls < 2; cls += 1) {
    for (let i = 0; i < half; i += 1) {
      const r = 0.5 + 1.5 * (i / half);
      const t = 2 * Math.PI * (i / half) * 2 + cls * Math.PI;
      X.push([r * Math.cos(t) + (rng() * 2 - 1) * noise, r * Math.sin(t) + (rng() * 2 - 1) * noise]);
      y.push(cls);
    }
  }
  return { X, y };
}

export const DATASETS = {
  moons: makeMoons,
  xor: makeXOR,
  spiral: makeSpiral,
};
