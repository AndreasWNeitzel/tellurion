// TDSE / Crank-Nicolson: norm conservation (unitarity), unconditional
// stability, free-packet group velocity and Ehrenfest, the harmonic
// coherent-state oscillation, energy conservation, the stationary
// ground state, and tunnelling probability conservation.

import { describe, it, expect } from 'vitest';
import {
  makeState, setPotential, setGaussian, step,
  norm, expectationX, expectationP, energy, probRightOf, probLeftOf, barrierT,
} from './sim.js';

function run(N, L, pot, opts, x0, k0, sig, dt, nstep) {
  const s = makeState(N, L);
  setPotential(s, pot, opts);
  setGaussian(s, x0, k0, sig);
  for (let k = 0; k < nstep; k += 1) step(s, dt);
  return s;
}

describe('tdse-wavepacket-sculptor invariants', () => {
  it('Crank-Nicolson conserves the norm to 1e-6 over thousands of steps', () => {
    for (const pot of ['free', 'harmonic', 'barrier']) {
      const s = makeState(512, 60);
      setPotential(s, pot, { omega: 1, V0: 8, width: 1.5 });
      setGaussian(s, -8, 1.5, 1.5);
      for (let k = 0; k < 2500; k += 1) step(s, 0.012);
      expect(Math.abs(norm(s) - 1)).toBeLessThan(1e-6);
    }
  });

  it('is unconditionally stable: huge dt does not blow up the norm', () => {
    const s = makeState(512, 60);
    setPotential(s, 'harmonic', { omega: 1 });
    setGaussian(s, 4, 0, 0.7);
    for (let k = 0; k < 400; k += 1) step(s, 1.0);            // explicit Euler would explode
    let finite = true; for (let i = 0; i < s.N; i += 1) if (!Number.isFinite(s.re[i])) finite = false;
    expect(finite).toBe(true);
    expect(Math.abs(norm(s) - 1)).toBeLessThan(1e-4);
  });

  it('free packet moves at the lattice group velocity sin(k0 dx)/dx', () => {
    const s = makeState(700, 80);
    setPotential(s, 'free', {});
    const k0 = 2.0;
    setGaussian(s, -12, k0, 1.6);
    const x0 = expectationX(s);
    for (let k = 0; k < 600; k += 1) step(s, 0.01);          // t = 6
    const xt = expectationX(s);
    // the discretized Hamiltonian has group velocity sin(k0 dx)/dx,
    // ~1% below the continuum k0 here (the exact FD dispersion)
    const vg = Math.sin(k0 * s.dx) / s.dx;
    expect(Math.abs((xt - x0) - vg * 6)).toBeLessThan(0.08);
    expect(vg).toBeLessThan(k0);                              // lattice slows it slightly
    expect(Math.abs((xt - x0) - k0 * 6) / (k0 * 6)).toBeLessThan(0.015);  // ~continuum
    expect(Math.abs(expectationP(s) - k0)).toBeLessThan(0.05);
  });

  it('Ehrenfest: d<x>/dt equals <p> for the free packet', () => {
    const s = makeState(700, 80);
    setPotential(s, 'free', {});
    setGaussian(s, -10, 1.4, 1.8);
    const xA = expectationX(s);
    for (let k = 0; k < 300; k += 1) step(s, 0.01);
    const xB = expectationX(s), pB = expectationP(s);
    const v = (xB - xA) / 3.0;                                // average d<x>/dt over t=3
    expect(Math.abs(v - pB)).toBeLessThan(0.03);
  });

  it('harmonic coherent state oscillates as x0 cos(omega t)', () => {
    const w = 1.0, x0 = 4, sig = 1 / Math.sqrt(2 * w);
    const s = makeState(640, 60);
    setPotential(s, 'harmonic', { omega: w });
    setGaussian(s, x0, 0, sig);
    const dt = 0.008, half = Math.round((Math.PI / w) / dt);
    for (let k = 0; k < half; k += 1) step(s, dt);
    expect(expectationX(s)).toBeCloseTo(-x0, 0);              // half period -> -x0
    for (let k = 0; k < half; k += 1) step(s, dt);
    expect(expectationX(s)).toBeCloseTo(x0, 0);               // full period -> +x0
    expect(Math.abs(expectationX(s) - x0) / x0).toBeLessThan(0.05);
  });

  it('energy is conserved for a stationary potential', () => {
    const s = makeState(600, 60);
    setPotential(s, 'harmonic', { omega: 1.2 });
    setGaussian(s, 3, 0.5, 0.9);
    const E0 = energy(s);
    for (let k = 0; k < 1500; k += 1) step(s, 0.01);
    expect(Math.abs(energy(s) - E0) / Math.abs(E0)).toBeLessThan(2e-3);
  });

  it('the harmonic ground state is stationary with E = omega/2', () => {
    const w = 1.5, s = makeState(640, 50);
    setPotential(s, 'harmonic', { omega: w });
    // ground state psi0 ~ exp(-w x^2 / 2); setGaussian with sigma so
    // exp(-(x)^2/(4 sigma^2)) = exp(-w x^2/2) => sigma = 1/sqrt(2w)
    setGaussian(s, 0, 0, 1 / Math.sqrt(2 * w));
    expect(energy(s)).toBeCloseTo(w / 2, 1);
    const x2a = (() => { let m = 0; for (let i = 0; i < s.N; i += 1) m += s.x[i] ** 2 * (s.re[i] ** 2 + s.im[i] ** 2); return m * s.dx; })();
    for (let k = 0; k < 1200; k += 1) step(s, 0.01);
    const x2b = (() => { let m = 0; for (let i = 0; i < s.N; i += 1) m += s.x[i] ** 2 * (s.re[i] ** 2 + s.im[i] ** 2); return m * s.dx; })();
    expect(Math.abs(x2b - x2a) / x2a).toBeLessThan(0.02);     // |psi|^2 stationary
    expect(Math.abs(expectationX(s))).toBeLessThan(0.05);
  });

  it('tunnelling conserves probability (R + T = 1) and rises with energy', () => {
    const split = (k0) => {
      const s = makeState(900, 120);
      setPotential(s, 'barrier', { V0: 8, width: 1.5 });
      setGaussian(s, -20, k0, 2.0);
      for (let k = 0; k < 2600; k += 1) step(s, 0.01);        // long enough to clear the barrier
      const T = probRightOf(s, 2.5), R = probLeftOf(s, -2.5);
      return { T, R, tot: norm(s) };
    };
    const lo = split(2.4), hi = split(4.0);
    for (const r of [lo, hi]) {
      expect(Math.abs(r.tot - 1)).toBeLessThan(1e-5);          // unitary
      expect(r.R + r.T).toBeGreaterThan(0.97);                 // packet has cleared the barrier
      expect(r.T).toBeGreaterThan(0); expect(r.T).toBeLessThan(1);
    }
    expect(hi.T).toBeGreaterThan(lo.T);                        // higher energy tunnels more
    // analytic rectangular-barrier T is also monotone in E
    expect(barrierT(8, 8, 1.5)).toBeGreaterThan(barrierT(2.88, 8, 1.5));
    expect(barrierT(2.88, 8, 1.5)).toBeGreaterThan(0);
  });
});
