// Shared-engine tests for shared/js/engine/tdse-cn-cpu.js (built
// before the quantum-tunnelling-barrier-3d hero). Crank-Nicolson is
// unitary, so probability is conserved to round-off; reflection plus
// transmission sum to one; tunnelling falls with barrier thickness;
// and the closed-form rectangular-barrier T(E) has the right limits.

import { describe, it, expect } from 'vitest';
import {
  makeTDSE, setPacket, setPotential, sculptV, step, norm, fluxSplit,
  rectBarrierT,
} from '../shared/js/engine/tdse-cn-cpu.js';

describe('Crank-Nicolson unitarity', () => {
  it('total probability conserved to 1e-6 every step (free packet)', () => {
    const s = makeTDSE(1024, 160);
    setPacket(s, -40, 3, 5);
    const n0 = norm(s);
    for (let i = 0; i < 400; i += 1) step(s, 0.02);
    expect(Math.abs(norm(s) - n0)).toBeLessThan(1e-6);
    expect(Math.abs(n0 - 1)).toBeLessThan(1e-6);     // started normalised
  });

  it('stays unitary when the potential is changed mid-run (regression)', () => {
    const s = makeTDSE(1024, 160);
    setPacket(s, -40, 3, 5);
    setPotential(s, 'rect', 4, 2);
    for (let i = 0; i < 200; i += 1) step(s, 0.02);
    setPotential(s, 'double', 9, 1.5);            // change V between steps
    for (let i = 0; i < 200; i += 1) step(s, 0.02);
    sculptV(s, 5, 4, 3);                          // sculpt between steps
    for (let i = 0; i < 200; i += 1) step(s, 0.02);
    expect(Math.abs(norm(s) - 1)).toBeLessThan(1e-6);
  });

  it('conserved through a barrier interaction too', () => {
    const s = makeTDSE(1024, 160);
    setPacket(s, -40, 3, 5);
    setPotential(s, 'rect', 6, 3);
    const n0 = norm(s);
    for (let i = 0; i < 900; i += 1) step(s, 0.02);
    expect(Math.abs(norm(s) - n0)).toBeLessThan(1e-6);
  });
});

describe('reflection + transmission', () => {
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

  it('tunnelling decreases with barrier thickness', () => {
    function runT(a) {
      const s = makeTDSE(2048, 240);
      setPacket(s, -50, 3, 5);
      setPotential(s, 'rect', 7, a);
      for (let i = 0; i < 1500; i += 1) step(s, 0.02);
      return fluxSplit(s).T;
    }
    const thin = runT(1.5), thick = runT(5.0);
    expect(thin).toBeGreaterThan(thick);
    expect(thick).toBeLessThan(0.3);                 // a thick high wall mostly reflects
  });
});

describe('closed-form rectangular barrier T(E)', () => {
  it('no barrier transmits perfectly; high thick barrier is tiny', () => {
    expect(rectBarrierT(2, 0, 4)).toBe(1);
    expect(rectBarrierT(1, 10, 6)).toBeLessThan(1e-3);
  });
  it('T increases monotonically with energy below the barrier', () => {
    let prev = 0;
    for (let E = 0.5; E < 5; E += 0.5) {
      const T = rectBarrierT(E, 5, 2);
      expect(T).toBeGreaterThan(prev - 1e-9);
      prev = T;
    }
  });
  it('T -> 1 as E far exceeds the barrier', () => {
    expect(rectBarrierT(200, 5, 2)).toBeGreaterThan(0.99);
  });
});

describe('classical contrast and sculpting', () => {
  it('a classical ball reflects off a barrier taller than its energy', () => {
    const s = makeTDSE(1024, 160);
    setPacket(s, -40, 2, 5);            // E = 2
    setPotential(s, 'rect', 8, 3);      // V0 = 8 > E
    const x0 = s.classical.x;
    for (let i = 0; i < 800; i += 1) step(s, 0.02);
    expect(s.classical.x).toBeLessThan(x0);          // bounced back
  });

  it('sculptV raises the potential locally and stays non-negative', () => {
    const s = makeTDSE(256, 80);
    setPotential(s, 'free', 0, 0);
    sculptV(s, 0, 5, 3);
    let mx = 0, mn = 0;
    for (let i = 0; i < s.N; i += 1) { mx = Math.max(mx, s.V[i]); mn = Math.min(mn, s.V[i]); }
    expect(mx).toBeGreaterThan(2);
    expect(mn).toBeGreaterThanOrEqual(0);
  });

  it('deterministic: identical setup reproduces the wavefunction', () => {
    const a = makeTDSE(512, 120); setPacket(a, -30, 3, 4); setPotential(a, 'rect', 5, 2);
    const b = makeTDSE(512, 120); setPacket(b, -30, 3, 4); setPotential(b, 'rect', 5, 2);
    for (let i = 0; i < 300; i += 1) { step(a, 0.02); step(b, 0.02); }
    expect(a.psiRe[256]).toBe(b.psiRe[256]);
  });
});
