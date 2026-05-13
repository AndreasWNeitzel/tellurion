// sim.js
// Doppler effect for a 2D moving source emitting circular wavefronts.
//
// Model: at integer multiples of the source-frame period T = 1 / f, the
// source emits a circular wavefront from its current position. Each
// wavefront expands at speed c. Observed frequency by a stationary
// observer at angle theta from the velocity vector is
//
//   f_obs = f / (1 - (v / c) cos(theta))    (non-relativistic, source-moving form)
//
// For a stationary observer in front of the source (theta = 0):
//   f_obs = f / (1 - v / c)
// For a stationary observer behind the source (theta = pi):
//   f_obs = f / (1 + v / c)
//
// Reference: Crawford, Waves and Oscillations Ch. 4 (`crawford-waves`).

export const SOURCE_FREQ = 1.0;          // Hz, source-frame
export const WAVE_SPEED  = 1.0;          // c, units of (length / time)
export const PERIOD      = 1 / SOURCE_FREQ;

export function createDoppler({ v = 0.4, x0 = 0.0, y0 = 0.0 } = {}) {
  return {
    sourceX: x0,
    sourceY: y0,
    v,                 // source speed in +x direction
    t: 0,
    nSteps: 0,
    wavefronts: [],    // {x_emit, y_emit, t_emit}
  };
}

// Emit a wavefront and store its emission point and time. Source moves at
// velocity (v, 0).
export function stepDoppler(s, dt = 0.01) {
  const tNext = s.t + dt;
  // Emit wavefronts at multiples of PERIOD in source-frame time.
  const lastEmitN = Math.floor(s.t / PERIOD);
  const nextEmitN = Math.floor(tNext / PERIOD);
  for (let n = lastEmitN + 1; n <= nextEmitN; n += 1) {
    const tEmit = n * PERIOD;
    const xEmit = s.sourceX + s.v * (tEmit - s.t);
    s.wavefronts.push({ xEmit, yEmit: s.sourceY, tEmit });
  }
  // Advance source
  s.sourceX += s.v * dt;
  s.t = tNext;
  s.nSteps += 1;
  // Prune wavefronts that have left the visible region (radius > 20).
  s.wavefronts = s.wavefronts.filter(wf => (s.t - wf.tEmit) * WAVE_SPEED < 20);
}

// Observed frequency for a stationary observer at angle theta from
// velocity vector. Non-relativistic source-moving form.
export function observedFreq(v, theta) {
  return SOURCE_FREQ / (1 - (v / WAVE_SPEED) * Math.cos(theta));
}

// Period of wavefront arrivals at a stationary point (x_o, y_o).
// Two consecutive wavefronts emitted at times t and t + T_s arrive at
// times t + r(t)/c and t + T_s + r(t + T_s)/c, where
// r(t) = distance from emission point to observer.
// The difference simplifies (for non-relativistic source) to
// T_obs = T_s (1 - (v / c) cos(theta_emit)).
export function observedPeriod(v, theta) {
  return PERIOD * (1 - (v / WAVE_SPEED) * Math.cos(theta));
}

export function radius(wf, currentT) {
  return (currentT - wf.tEmit) * WAVE_SPEED;
}
