// sim.js
// 1D wave equation y_tt = c^2 y_xx, finite-difference on a uniform grid.
//   Three-point stencil: y_new = 2 y - y_old + (c dt/dx)^2 (y_{x+1} - 2 y + y_{x-1})
// CFL: c dt / dx <= 1.
//
// Boundary conditions:
//   * fixed end: y(0, t) = y(L, t) = 0; pulses INVERT on reflection.
//   * free end: y_x(0, t) = y_x(L, t) = 0; pulses PRESERVE sign.
//
// Reference: French, Vibrations and Waves Ch. 7 (`french-vibrations`).

export const N = 200;
export const L_X = 4.0;
export const DX = L_X / (N - 1);
export const C = 1.0;
export const DT = 0.5 * DX / C;     // CFL safe

export function createString({ bc = 'fixed' } = {}) {
  const y = new Float64Array(N);
  const yOld = new Float64Array(N);
  // Gaussian pulse near the left end moving right.
  const x0 = L_X * 0.3, sigma = 0.15;
  for (let i = 0; i < N; i += 1) {
    const x = i * DX;
    y[i] = Math.exp(-((x - x0) ** 2) / (2 * sigma * sigma));
    // Initialize y_old so the pulse moves rightward.
    const x_prev = x + C * DT;
    yOld[i] = Math.exp(-((x_prev - x0) ** 2) / (2 * sigma * sigma));
  }
  return { y, yOld, t: 0, nSteps: 0, bc };
}

export function stepString(s) {
  const factor = (C * DT / DX) ** 2;
  const yNew = new Float64Array(N);
  for (let i = 1; i < N - 1; i += 1) {
    yNew[i] = 2 * s.y[i] - s.yOld[i] + factor * (s.y[i + 1] - 2 * s.y[i] + s.y[i - 1]);
  }
  // Boundaries
  if (s.bc === 'fixed') {
    yNew[0] = 0; yNew[N - 1] = 0;
  } else {
    // Free end: y'_x = 0 -> reflective (mirror) boundary.
    yNew[0] = yNew[1];
    yNew[N - 1] = yNew[N - 2];
  }
  s.yOld.set(s.y);
  s.y.set(yNew);
  s.t += DT;
  s.nSteps += 1;
}

// Peak position (location of max |y|) for tracking.
export function peakX(s) {
  let maxAbs = 0, idx = 0;
  for (let i = 0; i < N; i += 1) {
    if (Math.abs(s.y[i]) > maxAbs) { maxAbs = Math.abs(s.y[i]); idx = i; }
  }
  return { x: idx * DX, y: s.y[idx] };
}

// Total wave energy on the string (kinetic + elastic) in arbitrary
// units. The conserved quantity for an ideal wave equation with
// reflecting boundaries; the user reads it as a live invariant.
export function totalEnergy(s) {
  let E = 0;
  for (let i = 1; i < N - 1; i += 1) {
    // Kinetic from finite-difference time derivative
    const vt = (s.y[i] - s.yOld[i]) / DT;
    E += 0.5 * vt * vt;
    // Elastic from c^2 (y_x)^2 (use forward difference)
    const yx = (s.y[i + 1] - s.y[i]) / DX;
    E += 0.5 * C * C * yx * yx;
  }
  return E * DX;
}

// Inject a Gaussian pulse at the user-clicked position x0 with
// configurable amplitude. Sets y and yOld so the pulse moves
// rightward (toward +x).
export function injectPulse(s, x0, amplitude = 1.0, sigma = 0.12) {
  for (let i = 0; i < N; i += 1) {
    const x = i * DX;
    s.y[i] = amplitude * Math.exp(-((x - x0) ** 2) / (2 * sigma * sigma));
    const x_prev = x + C * DT;
    s.yOld[i] = amplitude * Math.exp(-((x_prev - x0) ** 2) / (2 * sigma * sigma));
  }
  s.t = 0; s.nSteps = 0;
}
