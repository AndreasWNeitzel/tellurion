// sim.js
// Empirical Big-O comparison. We don't actually time real sorts in the
// browser; instead we compute the canonical complexity counts for
// inputs of size N: N log_2 N, N^2, N^3. The user-set "trial" N (up
// to 100 000) gives the comparison values; the plot shows the curves.
//
// Reference: Newman, Computational Physics Ch. 2 (`newman2013`).

export function counts(N) {
  return {
    linear:  N,
    nlogn:   N * Math.log2(Math.max(N, 2)),
    quadratic: N * N,
    cubic:   N * N * N,
  };
}

// Approximate time per operation in microseconds (rough modern CPU).
const T_PER_OP_US = 0.005;

export function approxSeconds(opCount) {
  return opCount * T_PER_OP_US * 1e-6;
}

export const SCALES = ['linear', 'nlogn', 'quadratic', 'cubic'];
