import { describe, it, expect } from 'vitest';
import { u_v, d_v, gluon, sea } from './sim.js';
describe('parton-distribution-toy', () => {
  it('u_v integrates to 2', () => {
    let s = 0; const N = 1000;
    for (let i = 0; i < N; i += 1) s += u_v((i + 0.5) / N);
    expect(Math.abs(s / N - 2)).toBeLessThan(0.05);
  });
  it('d_v integrates to 1', () => {
    let s = 0; const N = 1000;
    for (let i = 0; i < N; i += 1) s += d_v((i + 0.5) / N);
    expect(Math.abs(s / N - 1)).toBeLessThan(0.05);
  });
  it('gluon dominates at small x', () => {
    expect(gluon(0.01)).toBeGreaterThan(u_v(0.01) + d_v(0.01));
  });
  it('valence peaks ~ 0.1-0.3', () => {
    expect(u_v(0.1) + u_v(0.2) + u_v(0.3)).toBeGreaterThan(u_v(0.7) + u_v(0.8) + u_v(0.9));
  });
  it('sea is small at large x', () => {
    expect(sea(0.5)).toBeLessThan(sea(0.05));
  });
});
