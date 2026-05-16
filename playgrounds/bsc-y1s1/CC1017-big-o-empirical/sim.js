// sim.js
// Empirical Big-O. Two parts:
//
// 1. Canonical complexity counts for an input of size N (the original
//    log-log reference curves): N, N log2 N, N^2, N^3.
//
// 2. Instrumented comparison sorts. We run real algorithms (bubble /
//    insertion, O(N^2), and merge sort, O(N log N)) on a shuffled
//    array, recording every comparison and write as a replayable event
//    stream. The *measured* comparison count is what gets plotted
//    against the theoretical curves: the abstract Big-O plot is then
//    tied to a mechanism the viewer can watch.
//
// Reference: Newman, Computational Physics Ch. 2 (`newman2013`);
// Cormen et al., Introduction to Algorithms, 3rd ed., Ch. 2.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

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

// Fisher-Yates shuffle of [1..n] with the project's seeded RNG (no
// Math.random). Same seed -> same permutation, so every run and every
// deterministic capture is reproducible.
export function shuffledArray(n, seed = DEFAULT_SEED) {
  const a = new Float64Array(n);
  for (let i = 0; i < n; i += 1) a[i] = i + 1;
  const rng = makeRng(seed);
  for (let i = n - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// Event codes for the replay stream.
export const EV_CMP = 0;   // [EV_CMP, i, j]    compared slots i and j
export const EV_SWAP = 1;  // [EV_SWAP, i, j]   swapped slots i and j
export const EV_SET = 2;   // [EV_SET, i, val]  wrote val into slot i

// Run a sort on a copy of arr0, recording the comparison/write events
// so the UI can replay it at any speed. Returns the event list, the
// total comparison count (the empirical Big-O measurement), and the
// sorted array (for the correctness invariant).
export function recordSort(kind, arr0) {
  const a = Array.from(arr0);
  const ev = [];
  let comparisons = 0;

  if (kind === 'bubble') {
    for (let i = 0; i < a.length; i += 1) {
      let swapped = false;
      for (let j = 0; j < a.length - 1 - i; j += 1) {
        ev.push([EV_CMP, j, j + 1]); comparisons += 1;
        if (a[j] > a[j + 1]) {
          const t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
          ev.push([EV_SWAP, j, j + 1]); swapped = true;
        }
      }
      if (!swapped) break;                 // already sorted: stop early
    }
  } else if (kind === 'insertion') {
    for (let i = 1; i < a.length; i += 1) {
      const key = a[i];
      let j = i - 1;
      while (j >= 0) {
        ev.push([EV_CMP, j, i]); comparisons += 1;
        if (a[j] > key) { a[j + 1] = a[j]; ev.push([EV_SET, j + 1, a[j + 1]]); j -= 1; }
        else break;
      }
      a[j + 1] = key; ev.push([EV_SET, j + 1, key]);
    }
  } else if (kind === 'merge') {
    const aux = a.slice();
    const sort = (lo, hi) => {
      if (hi - lo < 2) return;
      const mid = (lo + hi) >> 1;
      sort(lo, mid); sort(mid, hi);
      for (let k = lo; k < hi; k += 1) aux[k] = a[k];
      let i = lo, j = mid;
      for (let k = lo; k < hi; k += 1) {
        if (i >= mid) { a[k] = aux[j]; j += 1; }
        else if (j >= hi) { a[k] = aux[i]; i += 1; }
        else {
          ev.push([EV_CMP, i, j]); comparisons += 1;
          if (aux[i] <= aux[j]) { a[k] = aux[i]; i += 1; }
          else { a[k] = aux[j]; j += 1; }
        }
        ev.push([EV_SET, k, a[k]]);
      }
    };
    sort(0, a.length);
  } else {
    throw new Error(`unknown sort kind: ${kind}`);
  }

  return { events: ev, comparisons, sorted: a };
}

// Comparison count alone, for the empirical-vs-theory scatter.
export function comparisonCount(kind, n, seed = DEFAULT_SEED) {
  return recordSort(kind, shuffledArray(n, seed)).comparisons;
}

export const SORT_KINDS = ['bubble', 'insertion', 'merge'];
