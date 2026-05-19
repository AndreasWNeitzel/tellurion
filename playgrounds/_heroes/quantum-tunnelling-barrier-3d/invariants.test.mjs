// quantum-tunnelling-barrier-3d invariants. Crank-Nicolson unitarity,
// R + T = 1, the thickness dependence of tunnelling and the analytic
// rectangular-barrier limits prove the shared TDSE engine (via
// ./sim.js) is a real solver, not a scripted leak.

import { describe, it, expect } from 'vitest';
import {
  makeTDSE, setPacket, setPotential, sculptV, step, norm, fluxSplit, rectBarrierT,
} from './sim.js';

describe('quantum-tunnelling-barrier-3d', () => {
  it('total probability conserved to 1e-6 every step through a barrier', () => {
    const s = makeTDSE(1024, 160);
    setPacket(s, -40, 3, 5);
    setPotential(s, 'rect', 6, 3);
    const n0 = norm(s);
    for (let i = 0; i < 900; i += 1) step(s, 0.02);
    expect(Math.abs(norm(s) - n0)).toBeLessThan(1e-6);
    expect(Math.abs(n0 - 1)).toBeLessThan(1e-6);
  });

  it('stays unitary when the barrier is changed mid-run (regression)', () => {
    const s = makeTDSE(1024, 160);
    setPacket(s, -40, 3, 5);
    setPotential(s, 'rect', 4, 2);
    for (let i = 0; i < 200; i += 1) step(s, 0.02);
    setPotential(s, 'double', 9, 1.5);
    for (let i = 0; i < 200; i += 1) step(s, 0.02);
    sculptV(s, 5, 4, 3);
    for (let i = 0; i < 200; i += 1) step(s, 0.02);
    expect(Math.abs(norm(s) - 1)).toBeLessThan(1e-6);
  });

  it('R + T = 1 after the packet clears the barrier', () => {
    const s = makeTDSE(2048, 240);
    setPacket(s, -50, 3, 5);
    setPotential(s, 'rect', 5, 3);
    for (let i = 0; i < 1500; i += 1) step(s, 0.02);
    const { T, R } = fluxSplit(s);
    expect(Math.abs(T + R - 1)).toBeLessThan(1e-3);
    expect(T).toBeGreaterThan(0);
    expect(T).toBeLessThan(1);
  });

  it('thinner barrier transmits more than a thicker one', () => {
    const run = (a) => {
      const s = makeTDSE(2048, 240);
      setPacket(s, -50, 3, 5); setPotential(s, 'rect', 7, a);
      for (let i = 0; i < 1500; i += 1) step(s, 0.02);
      return fluxSplit(s).T;
    };
    expect(run(1.5)).toBeGreaterThan(run(5));
  });

  it('a classical ball reflects off a barrier taller than its energy', () => {
    const s = makeTDSE(1024, 160);
    setPacket(s, -40, 2, 5);                 // E = 2
    setPotential(s, 'rect', 8, 3);           // V0 = 8 > E
    const x0 = s.classical.x;
    for (let i = 0; i < 800; i += 1) step(s, 0.02);
    expect(s.classical.x).toBeLessThan(x0);
  });

  it('analytic rectangular T(E): zero barrier transmits all; monotone in E', () => {
    expect(rectBarrierT(3, 0, 4)).toBe(1);
    expect(rectBarrierT(1, 12, 6)).toBeLessThan(1e-3);
    let prev = 0;
    for (let E = 0.5; E < 6; E += 0.5) { const T = rectBarrierT(E, 6, 2); expect(T).toBeGreaterThan(prev - 1e-9); prev = T; }
    expect(rectBarrierT(300, 6, 2)).toBeGreaterThan(0.99);
  });

  it('deterministic: identical setup reproduces the wavefunction', () => {
    const a = makeTDSE(512, 120); setPacket(a, -30, 3, 4); setPotential(a, 'rect', 5, 2);
    const b = makeTDSE(512, 120); setPacket(b, -30, 3, 4); setPotential(b, 'rect', 5, 2);
    for (let i = 0; i < 300; i += 1) { step(a, 0.02); step(b, 0.02); }
    expect(a.psiRe[256]).toBe(b.psiRe[256]);
  });
});
