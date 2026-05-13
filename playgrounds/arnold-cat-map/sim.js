// sim.js
// Arnold's cat map on the unit torus T^2 = [0, 1)^2:
//   x' = (2 x + y) mod 1
//   y' = (x + y)   mod 1
// Equivalently, multiply by the matrix [[2, 1], [1, 1]] with determinant 1.
// Eigenvalues: (3 +/- sqrt(5)) / 2; max Lyapunov = log((3 + sqrt 5) / 2).
// On an N x N pixel grid the map is exactly invertible and the system
// recurs in a finite number of steps T(N) that depends on N (Periods for
// 16, 32, 64, 128 are 12, 24, 48, 96 respectively, then 192, ...).

export function catMapForward(x, y) {
  const xn = (2 * x + y) % 1;
  const yn = (x + y) % 1;
  return { x: (xn + 1) % 1, y: (yn + 1) % 1 };   // guard against negative-modulo
}

export const LYAP_EXACT = Math.log((3 + Math.sqrt(5)) / 2);

// Iterate the cat map on a pixel grid by mapping pixel (i, j) to a new pixel.
// applyForward(grid, dst) applies one cat-map iteration to the grid.
export function applyForwardPixel(srcGrid, N, dstGrid) {
  // For each destination pixel (i', j'), find the source (i, j) by inverting:
  //   [i ] = [[1, -1], [-1, 2]] [i']
  //   [j ]   [          ]      [j']
  for (let jp = 0; jp < N; jp += 1) {
    for (let ip = 0; ip < N; ip += 1) {
      let i = (ip - jp) % N; if (i < 0) i += N;
      let j = (-ip + 2 * jp) % N; if (j < 0) j += N;
      dstGrid[jp * N + ip] = srcGrid[j * N + i];
    }
  }
}

// Iterate the forward map nIter times. Returns the new grid.
export function iterate(grid, N, nIter) {
  let a = new Uint8Array(grid);
  let b = new Uint8Array(N * N);
  for (let k = 0; k < nIter; k += 1) {
    applyForwardPixel(a, N, b);
    const t = a; a = b; b = t;
  }
  return a;
}

// Estimate the recurrence period by iterating until the grid matches the
// initial one. Bounded by `maxIter`.
export function recurrencePeriod(grid, N, maxIter = 1024) {
  const init = new Uint8Array(grid);
  let cur = new Uint8Array(grid);
  let nxt = new Uint8Array(N * N);
  for (let k = 1; k <= maxIter; k += 1) {
    applyForwardPixel(cur, N, nxt);
    if (sameGrid(nxt, init)) return k;
    const t = cur; cur = nxt; nxt = t;
  }
  return -1;
}

function sameGrid(a, b) {
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
}
