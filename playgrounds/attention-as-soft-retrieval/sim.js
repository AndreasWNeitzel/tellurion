// sim.js
// Soft retrieval via softmax attention.
// Given keys {k_i} in R^d, values {v_i} in R^m, and a query Q in R^d:
//   logits_i = Q . k_i / sqrt(d)
//   w_i      = softmax_i(logits / tau)
//   out      = sum_i w_i v_i
// As tau -> 0 the weights collapse onto argmax_i (Q . k_i); large tau gives
// the uniform mixture.

export function softmax(logits, tau = 1) {
  const z = logits.map(l => l / tau);
  const mx = Math.max(...z);
  const ex = z.map(v => Math.exp(v - mx));
  const sum = ex.reduce((a, b) => a + b, 0);
  return ex.map(v => v / sum);
}

export function attention(query, keys, values, tau = 1) {
  const d = query.length;
  const logits = keys.map(k => {
    let s = 0; for (let i = 0; i < d; i += 1) s += query[i] * k[i];
    return s / Math.sqrt(d);
  });
  const w = softmax(logits, tau);
  const m = values[0].length;
  const out = new Array(m).fill(0);
  for (let i = 0; i < keys.length; i += 1) {
    for (let j = 0; j < m; j += 1) out[j] += w[i] * values[i][j];
  }
  return { logits, weights: w, output: out };
}

// Entropy of a discrete distribution (nats).
export function entropy(p) {
  let h = 0;
  for (const pi of p) if (pi > 0) h -= pi * Math.log(pi);
  return h;
}

// Argmax index of a vector.
export function argmax(xs) {
  let bi = 0, bv = xs[0];
  for (let i = 1; i < xs.length; i += 1) if (xs[i] > bv) { bv = xs[i]; bi = i; }
  return bi;
}
