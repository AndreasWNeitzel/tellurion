// sim.js
// Tiny fully-connected MLP trained on a 2D binary classification task.
// Architecture: 2 -> [H]*L -> 1, tanh hidden activations, sigmoid output.
// Loss: binary cross-entropy. Trained with full-batch gradient descent.
//
// The network generalises to L stacked hidden layers (1..3 in the UI,
// each at most 8 units). For a single hidden layer the weight-init draw
// order is identical to the original 2 -> H -> 1 net, so the invariant
// thresholds are preserved exactly.
//
// Reference: Goodfellow-Bengio-Courville 2016 Ch. 6 (backpropagation);
// Bishop-Bishop 2024 Deep Learning: Foundations and Concepts Ch. 6.

import { makeRng } from '../../../shared/js/render/rng.js';

const sigmoid = (z) => 1 / (1 + Math.exp(-z));
const tanh = (z) => Math.tanh(z);
const dtanh = (a) => 1 - a * a;

// hidden: a positive integer (single hidden layer, back-compatible) or an
// array of per-layer widths, e.g. [6, 6] for two hidden layers of 6 units.
export function createNet({ hidden = 8, seed = 0xC0FFEE } = {}) {
  const hiddenArr = Array.isArray(hidden) ? hidden.slice() : [hidden];
  const sizes = [2, ...hiddenArr, 1];           // layer widths incl. I/O
  const rng = makeRng(seed);
  function he(n) { return (rng() * 2 - 1) * Math.sqrt(2 / n); }

  // Ws[l] is an [out][in] matrix, bs[l] an [out] vector, for the weight
  // matrix mapping layer l activations to layer l+1 pre-activations.
  // Drawing order (out outer, in inner) reproduces the original W1/W2
  // sequence exactly for the single-hidden-layer case.
  const Ws = [];
  const bs = [];
  for (let l = 0; l < sizes.length - 1; l += 1) {
    const nIn = sizes[l], nOut = sizes[l + 1];
    const Wl = Array.from({ length: nOut }, () => new Float64Array(nIn));
    for (let o = 0; o < nOut; o += 1) {
      for (let i = 0; i < nIn; i += 1) Wl[o][i] = he(nIn);
    }
    Ws.push(Wl);
    bs.push(new Float64Array(nOut));
  }
  return { hidden: hiddenArr[0], arch: sizes, Ws, bs };
}

// Forward pass. Returns the per-layer activations (hidden layers only) and
// the scalar sigmoid output p. `a1` aliases the first hidden layer so any
// older caller keeps working.
export function forward(net, x) {
  const { Ws, bs, arch } = net;
  let a = Float64Array.from(x);
  const acts = [];
  const L = Ws.length;
  for (let l = 0; l < L; l += 1) {
    const W = Ws[l], b = bs[l];
    const nOut = arch[l + 1];
    const z = new Float64Array(nOut);
    for (let o = 0; o < nOut; o += 1) {
      let s = b[o];
      const Wo = W[o];
      for (let i = 0; i < a.length; i += 1) s += Wo[i] * a[i];
      z[o] = s;
    }
    if (l < L - 1) {
      const next = new Float64Array(nOut);
      for (let o = 0; o < nOut; o += 1) next[o] = tanh(z[o]);
      acts.push(next);
      a = next;
    } else {
      const p = sigmoid(z[0]);
      return { acts, a1: acts[0], p };
    }
  }
  // arch always has at least one hidden layer, so the loop returns above.
  return { acts, a1: acts[0], p: 0.5 };
}

// One full-batch gradient-descent step on the binary cross-entropy loss.
// Returns the mean loss for telemetry. lr = 0 leaves the weights untouched
// and just reports the current loss.
export function trainStep(net, X, y, lr = 0.1) {
  const { Ws, bs, arch } = net;
  const L = Ws.length;
  const N = X.length;
  let lossSum = 0;

  const dWs = Ws.map((W) => W.map((row) => new Float64Array(row.length)));
  const dbs = bs.map((b) => new Float64Array(b.length));

  for (let n = 0; n < N; n += 1) {
    // Forward, retaining every layer's activation (a[0] is the input).
    const a = [Float64Array.from(X[n])];
    for (let l = 0; l < L; l += 1) {
      const W = Ws[l], b = bs[l], nOut = arch[l + 1];
      const prev = a[l];
      const cur = new Float64Array(nOut);
      for (let o = 0; o < nOut; o += 1) {
        let s = b[o];
        const Wo = W[o];
        for (let i = 0; i < prev.length; i += 1) s += Wo[i] * prev[i];
        cur[o] = (l < L - 1) ? tanh(s) : sigmoid(s);
      }
      a.push(cur);
    }
    const p = a[L][0];
    const yn = y[n];
    lossSum += -(yn * Math.log(p + 1e-12) + (1 - yn) * Math.log(1 - p + 1e-12));

    // Backward. delta is dL/dz for the current layer's pre-activation.
    let delta = new Float64Array(1);
    delta[0] = p - yn;                                  // sigmoid + BCE
    for (let l = L - 1; l >= 0; l -= 1) {
      const prev = a[l];
      const dW = dWs[l], db = dbs[l];
      for (let o = 0; o < delta.length; o += 1) {
        db[o] += delta[o];
        const dWo = dW[o];
        for (let i = 0; i < prev.length; i += 1) dWo[i] += delta[o] * prev[i];
      }
      if (l > 0) {
        const W = Ws[l];
        const nIn = prev.length;
        const next = new Float64Array(nIn);
        for (let i = 0; i < nIn; i += 1) {
          let s = 0;
          for (let o = 0; o < delta.length; o += 1) s += delta[o] * W[o][i];
          next[i] = s * dtanh(prev[i]);                 // tanh hidden
        }
        delta = next;
      }
    }
  }

  const invN = 1 / N;
  for (let l = 0; l < L; l += 1) {
    const W = Ws[l], b = bs[l], dW = dWs[l], db = dbs[l];
    for (let o = 0; o < W.length; o += 1) {
      b[o] -= lr * db[o] * invN;
      const Wo = W[o], dWo = dW[o];
      for (let i = 0; i < Wo.length; i += 1) Wo[i] -= lr * dWo[i] * invN;
    }
  }
  return lossSum / N;
}

// Datasets. N is the total point count; default raised so the decision
// surface and the data cloud read clearly.
export function makeMoons({ N = 360, seed = 1, noise = 0.15 } = {}) {
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

export function makeXOR({ N = 360, seed = 1, noise = 0.10 } = {}) {
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

export function makeSpiral({ N = 360, seed = 1, noise = 0.15 } = {}) {
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

// Concentric circles: a dense core (class 0) inside an annulus (class 1).
// Not linearly separable; the network has to learn a closed boundary.
export function makeCircles({ N = 360, seed = 1, noise = 0.10 } = {}) {
  const rng = makeRng(seed);
  const X = [], y = [];
  const half = N / 2;
  for (let i = 0; i < half; i += 1) {
    const t = 2 * Math.PI * rng();
    const r = 0.55 * Math.sqrt(rng());
    X.push([r * Math.cos(t) + (rng() * 2 - 1) * noise, r * Math.sin(t) + (rng() * 2 - 1) * noise]);
    y.push(0);
  }
  for (let i = 0; i < half; i += 1) {
    const t = 2 * Math.PI * rng();
    const r = 1.35 + 0.35 * rng();
    X.push([r * Math.cos(t) + (rng() * 2 - 1) * noise, r * Math.sin(t) + (rng() * 2 - 1) * noise]);
    y.push(1);
  }
  return { X, y };
}

// Two anisotropic Gaussian blobs. Almost linearly separable, so a tiny
// network solves it fast: a useful contrast to moons/XOR/spiral.
export function makeGaussians({ N = 360, seed = 1, noise = 0.0 } = {}) {
  const rng = makeRng(seed);
  const g = () => {
    let s = 0;
    for (let k = 0; k < 6; k += 1) s += rng();
    return (s - 3) / 1.5;                                // ~N(0, 1)
  };
  const X = [], y = [];
  const half = N / 2;
  for (let i = 0; i < half; i += 1) {
    X.push([-0.9 + 0.45 * g() + noise * g(), 0.6 + 0.30 * g()]);
    y.push(0);
  }
  for (let i = 0; i < half; i += 1) {
    X.push([1.0 + 0.45 * g() + noise * g(), -0.5 + 0.30 * g()]);
    y.push(1);
  }
  return { X, y };
}

export const DATASETS = {
  moons: makeMoons,
  xor: makeXOR,
  spiral: makeSpiral,
  circles: makeCircles,
  gaussians: makeGaussians,
};
