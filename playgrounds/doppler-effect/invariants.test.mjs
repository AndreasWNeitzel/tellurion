// Doppler-effect invariant tests.
// (a) For v = 0 the observed frequency equals the source frequency at all angles.
// (b) f_obs(theta = 0) = f / (1 - v/c) within machine precision.
// (c) f_obs(theta = pi) = f / (1 + v/c) within machine precision.
// (d) f_obs(theta = pi/2) = f (no Doppler at 90 degrees in the non-relativistic form).
// (e) Subsonic v < c: all wavefronts remain bounded radius circles.
// (f) Wavefront radius grows at exactly c per unit time.

import { describe, it, expect } from 'vitest';
import {
  createDoppler, stepDoppler, observedFreq, observedPeriod, radius,
  SOURCE_FREQ, WAVE_SPEED, PERIOD,
} from './sim.js';

describe('Doppler: zero source velocity', () => {
  it('f_obs = f at every angle when v = 0', () => {
    for (let i = 0; i < 12; i += 1) {
      const theta = (i / 11) * Math.PI;
      expect(observedFreq(0, theta)).toBeCloseTo(SOURCE_FREQ, 12);
    }
  });
});

describe('Doppler: front and back limits', () => {
  it('theta = 0 (in front): f_obs = f / (1 - v/c)', () => {
    const v = 0.4;
    expect(observedFreq(v, 0)).toBeCloseTo(SOURCE_FREQ / (1 - v / WAVE_SPEED), 12);
  });
  it('theta = pi (behind): f_obs = f / (1 + v/c)', () => {
    const v = 0.4;
    expect(observedFreq(v, Math.PI)).toBeCloseTo(SOURCE_FREQ / (1 + v / WAVE_SPEED), 12);
  });
});

describe('Doppler: perpendicular has no Doppler in non-relativistic form', () => {
  it('theta = pi / 2 yields f_obs = f', () => {
    expect(observedFreq(0.4, Math.PI / 2)).toBeCloseTo(SOURCE_FREQ, 12);
  });
});

describe('Doppler: observed period and frequency are reciprocals', () => {
  it('observedPeriod * observedFreq = 1', () => {
    for (let i = 0; i < 10; i += 1) {
      const theta = (i / 9) * Math.PI;
      const f = observedFreq(0.4, theta);
      const T = observedPeriod(0.4, theta);
      expect(Math.abs(f * T - 1)).toBeLessThan(1e-12);
    }
  });
});

describe('Doppler: wavefront radius', () => {
  it('after N steps of dt, wavefront emitted at t_e has radius (t - t_e) c', () => {
    const s = createDoppler({ v: 0.3 });
    for (let i = 0; i < 200; i += 1) stepDoppler(s, 0.01);
    // Should have emitted wavefronts at t = 1, 2 (PERIOD = 1).
    expect(s.wavefronts.length).toBeGreaterThan(0);
    for (const wf of s.wavefronts) {
      const r = radius(wf, s.t);
      expect(r).toBeGreaterThan(0);
      expect(r).toBeCloseTo((s.t - wf.tEmit) * WAVE_SPEED, 10);
    }
  });
});

describe('Doppler: subsonic stability', () => {
  it('wavefronts stay finite for v < c', () => {
    const s = createDoppler({ v: 0.5 });
    for (let i = 0; i < 500; i += 1) stepDoppler(s, 0.01);
    for (const wf of s.wavefronts) {
      expect(radius(wf, s.t)).toBeLessThan(20);
    }
  });
});
