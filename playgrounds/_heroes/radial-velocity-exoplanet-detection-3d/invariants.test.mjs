import { describe, it, expect } from 'vitest';
import { solveKepler, trueAnomaly, rvSemiAmplitude, radialVelocity, positions } from './sim.js';

describe('radial-velocity-exoplanet-detection-3d', () => {
  it('solveKepler: circular orbit (e=0) gives E = M', () => {
    expect(solveKepler(1.0, 0)).toBeCloseTo(1.0, 9);
  });

  it('solveKepler at M=0 gives E=0 for any e', () => {
    expect(solveKepler(0, 0.3)).toBeCloseTo(0, 9);
  });

  it('Kepler equation E - e sin E = M satisfied at solution', () => {
    const M = 1.234, e = 0.4;
    const E = solveKepler(M, e);
    expect(Math.abs(E - e * Math.sin(E) - M)).toBeLessThan(1e-9);
  });

  it('trueAnomaly: at E=0 gives theta=0', () => {
    expect(trueAnomaly(0, 0.3)).toBeCloseTo(0, 9);
  });

  it('RV semi-amplitude scales linearly with m_p (small mass limit)', () => {
    const K1 = rvSemiAmplitude({ m_p: 0.001, M_star: 1, P: 1, e: 0, i: Math.PI / 2 });
    const K2 = rvSemiAmplitude({ m_p: 0.002, M_star: 1, P: 1, e: 0, i: Math.PI / 2 });
    expect(K2 / K1).toBeCloseTo(2, 2);
  });

  it('RV semi-amplitude scales as sin(i)', () => {
    const Kedge = rvSemiAmplitude({ m_p: 0.001, M_star: 1, P: 1, e: 0, i: Math.PI / 2 });
    const Kmid = rvSemiAmplitude({ m_p: 0.001, M_star: 1, P: 1, e: 0, i: Math.PI / 6 });
    expect(Kmid / Kedge).toBeCloseTo(Math.sin(Math.PI / 6), 6);
  });

  it('RV face-on (i=0): K = 0', () => {
    const K = rvSemiAmplitude({ m_p: 0.01, M_star: 1, P: 1, e: 0, i: 0 });
    expect(K).toBeCloseTo(0, 12);
  });

  it('Eccentric: K diverges as e -> 1', () => {
    const K_low = rvSemiAmplitude({ m_p: 0.01, M_star: 1, P: 1, e: 0.0, i: Math.PI / 2 });
    const K_hi = rvSemiAmplitude({ m_p: 0.01, M_star: 1, P: 1, e: 0.9, i: Math.PI / 2 });
    expect(K_hi).toBeGreaterThan(K_low);
  });

  it('positions: star and planet are on opposite sides of COM', () => {
    const p = positions(0.3, { M_star: 1, m_p: 0.01, P: 1, e: 0.0, a_planet: 1, omega: 0, t0: 0 });
    // sx/px ratio = -m_p / M_star
    expect(p.sx / p.px).toBeCloseTo(-0.01, 6);
    expect(p.sy / p.py).toBeCloseTo(-0.01, 6);
  });

  it('positions: planet orbital radius = a(1-e^2)/(1+e cos theta)', () => {
    const opts = { M_star: 1, m_p: 0.01, P: 1, e: 0.4, omega: 0, a_planet: 1, t0: 0 };
    const p = positions(0, opts);
    // At t=0 (M=0, E=0, theta=0), r = a(1-e)/(1+e cos 0) = a(1-e)/(1+e) ... wait
    // r = a(1-e^2)/(1+e cos theta) at theta=0: r = a(1-e^2)/(1+e) = a(1-e)
    const r = Math.sqrt(p.px * p.px + p.py * p.py);
    expect(r).toBeCloseTo(1 - 0.4, 4);
  });

  it('radial velocity is periodic with period P', () => {
    const opts = { M_star: 1, m_p: 0.01, P: 1.6, e: 0.2, i: Math.PI / 2, omega: 0, t0: 0 };
    const v0 = radialVelocity(0.5, opts);
    const v1 = radialVelocity(0.5 + 1.6, opts);
    expect(v0).toBeCloseTo(v1, 6);
  });

  it('radial velocity zero crossings: for e=0, omega=0, v_r=0 at quadrature points', () => {
    const opts = { M_star: 1, m_p: 0.01, P: 1.0, e: 0, i: Math.PI / 2, omega: 0, t0: 0 };
    // For circular orbit with theta(t) = 2 pi t / P, v_r = K cos(theta).
    // Zero crossings at theta = pi/2 and 3 pi/2, i.e., t = P/4 and 3P/4.
    expect(Math.abs(radialVelocity(0.25, opts))).toBeLessThan(1e-6);
    expect(Math.abs(radialVelocity(0.75, opts))).toBeLessThan(1e-6);
  });
});
