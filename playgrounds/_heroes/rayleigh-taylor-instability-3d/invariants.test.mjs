import { describe, it, expect } from 'vitest';
import {
  atwoodNumber, growthRate, bubbleVelocity, linearVelocity,
  nonlinearVelocity, rk4Step, BOX_X, BOX_Y_HALF, mostUnstableK,
} from './sim.js';

describe('rayleigh-taylor-instability-3d', () => {
  it('Atwood: equal densities gives A = 0', () => {
    expect(atwoodNumber(1, 1)).toBeCloseTo(0, 9);
  });

  it('Atwood: heavy dense gives A approaching 1', () => {
    expect(atwoodNumber(1e9, 1)).toBeGreaterThan(0.99);
  });

  it('Atwood: stable (light on top) gives A < 0', () => {
    expect(atwoodNumber(1, 2)).toBeCloseTo(-1 / 3, 6);
  });

  it('growth rate sigma = sqrt(A k g)', () => {
    expect(growthRate(2, 0.5, 1, 0, 1)).toBeCloseTo(Math.sqrt(0.5 * 2 * 1), 6);
  });

  it('growth rate vanishes at A = 0', () => {
    expect(growthRate(1, 0, 1)).toBeCloseTo(0, 9);
  });

  it('growth rate vanishes for stable stratification (A < 0)', () => {
    expect(growthRate(1, -0.5, 1)).toBe(0);     // sqrt(negative) -> 0 in our function
  });

  it('growth rate scales as sqrt(k)', () => {
    const s1 = growthRate(1, 0.5, 1);
    const s4 = growthRate(4, 0.5, 1);
    expect(s4 / s1).toBeCloseTo(2, 6);
  });

  it('growth rate scales as sqrt(g)', () => {
    const s1 = growthRate(1, 0.5, 1);
    const s4 = growthRate(1, 0.5, 4);
    expect(s4 / s1).toBeCloseTo(2, 6);
  });

  it('growth rate scales as sqrt(A)', () => {
    const s1 = growthRate(1, 0.25, 1);
    const s4 = growthRate(1, 1.00, 1);
    expect(s4 / s1).toBeCloseTo(2, 6);
  });

  it('surface tension stabilizes high k', () => {
    const without_T = growthRate(50, 0.5, 1, 0, 1);
    const with_T = growthRate(50, 0.5, 1, 0.5, 1);
    expect(with_T).toBeLessThan(without_T);
  });

  it('most-unstable k is finite at non-zero surface tension', () => {
    const k_max = mostUnstableK(0.5, 1, 0.1, 1);
    expect(k_max).toBeGreaterThan(0);
    expect(isFinite(k_max)).toBe(true);
  });

  it('bubble velocity vanishes at A = 0', () => {
    expect(bubbleVelocity(0, 1, 1)).toBeCloseTo(0, 9);
  });

  it('bubble velocity scales as sqrt(A g R)', () => {
    expect(bubbleVelocity(0.5, 2, 1)).toBeCloseTo(Math.sqrt(0.5 * 2), 6);
  });

  it('linear velocity at y = 0 is zero (interface remains pinned in linear theory)', () => {
    expect(linearVelocity(0.5, 0, 1, 0.1).u).toBeCloseTo(0, 9);
  });

  it('linear velocity at x = 0 has v != 0 (bubble center)', () => {
    expect(linearVelocity(0, 0.5, 2, 0.1).v).not.toBeCloseTo(0, 6);
  });

  it('RK4 step preserves periodic x boundary', () => {
    const r = rk4Step(BOX_X * Math.PI - 0.01, 0.5, 0.1, () => ({ u: 1, v: 0 }));
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.x).toBeLessThan(BOX_X * Math.PI);
  });

  it('RK4 step clamps y to box', () => {
    const r = rk4Step(0, BOX_Y_HALF - 0.001, 0.1, () => ({ u: 0, v: 5 }));
    expect(r.y).toBeLessThanOrEqual(BOX_Y_HALF);
  });
});
