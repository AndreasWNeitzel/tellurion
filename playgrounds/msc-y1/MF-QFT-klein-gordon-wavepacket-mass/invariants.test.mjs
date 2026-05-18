import { describe, it, expect } from 'vitest';
import {
  omega, groupVelocity, phaseVelocity, packet, evolve, centroidVelocity,
} from './sim.js';

describe('klein-gordon-wavepacket-mass invariants', () => {
  it('the dispersion is omega^2 = k^2 + m^2 with v_g v_p = 1', () => {
    for (const [k, m] of [[3, 1], [0.5, 1], [10, 2], [1, 0]]) {
      expect(omega(k, m) ** 2).toBeCloseTo(k * k + m * m, 9);
      if (k !== 0) expect(groupVelocity(k, m) * phaseVelocity(k, m)).toBeCloseTo(1, 9);
    }
  });

  it('the group velocity is sub-luminal for m > 0 and equals 1 for m = 0', () => {
    for (const k of [0.2, 1, 3, 8, 30]) {
      expect(groupVelocity(k, 1)).toBeLessThan(1);                    // v_g < c
      expect(groupVelocity(k, 1)).toBeGreaterThan(0);
      expect(phaseVelocity(k, 1)).toBeGreaterThan(1);                 // v_p > c
      expect(groupVelocity(k, 0)).toBeCloseTo(1, 12);                 // massless: v_g = c
    }
    expect(groupVelocity(1e6, 1)).toBeGreaterThan(0.999);             // -> c at high k
  });

  it('the massless packet is dispersion-free and moves at c', () => {
    const a = packet(0, { m: 0, k0: 3 });
    const b = packet(9, { m: 0, k0: 3 });
    expect(b.width / a.width).toBeCloseTo(1, 2);                       // width constant
    expect(b.centroid - a.centroid).toBeCloseTo(9, 1);                // v = c = 1
    expect(centroidVelocity(0, 9, { m: 0, k0: 3 })).toBeCloseTo(1, 2);
  });

  it('a massive packet disperses (spreads) and its centroid is sub-luminal', () => {
    const opt = { m: 2, k0: 1, sigma0: 1.0 };
    const a = packet(0, opt), b = packet(10, opt);
    expect(b.width).toBeGreaterThan(a.width * 1.05);                   // clear spreading
    const vg = groupVelocity(1, 2);                                   // = 1/sqrt(5) ~ 0.447
    expect(centroidVelocity(0, 10, opt)).toBeCloseTo(vg, 1);           // peak moves at v_g
    expect(centroidVelocity(0, 10, opt)).toBeLessThan(1);             // causal: sub-luminal
    expect(b.centroid).toBeLessThan(10);                              // inside the light cone
  });

  it('the norm is conserved under free Klein-Gordon evolution', () => {
    for (const m of [0, 1, 3]) {
      const e = evolve(12, 6, { m, k0: 2 });
      for (let i = 1; i < e.nrm.length; i += 1) {
        expect(e.nrm[i] / e.nrm[0]).toBeCloseTo(1, 3);                 // unitary
      }
    }
  });

  it('heavier mass means a slower packet (v_g decreases with m at fixed k)', () => {
    expect(groupVelocity(2, 0)).toBeGreaterThan(groupVelocity(2, 1));
    expect(groupVelocity(2, 1)).toBeGreaterThan(groupVelocity(2, 4));
    expect(centroidVelocity(0, 8, { m: 0.5, k0: 2 }))
      .toBeGreaterThan(centroidVelocity(0, 8, { m: 4, k0: 2 }));
  });

  it('the centroid advances monotonically (the packet propagates forward)', () => {
    const e = evolve(10, 10, { m: 1, k0: 3 });
    for (let i = 1; i < e.cen.length; i += 1) expect(e.cen[i]).toBeGreaterThan(e.cen[i - 1]);
  });

  it('deterministic: identical inputs reproduce the packet', () => {
    const a = packet(4.5, { m: 1.5, k0: 2 }), b = packet(4.5, { m: 1.5, k0: 2 });
    expect(a.centroid).toBe(b.centroid);
    expect(a.width).toBe(b.width);
    for (let i = 0; i < a.p2.length; i += 1) expect(a.p2[i]).toBe(b.p2[i]);
  });
});
