import { describe, it, expect } from 'vitest';
import { init, step, meanKE } from './sim.js';
describe('equipartition-from-collisions', () => {
  it('total energy conserved (elastic collisions, no walls)', () => {
    const s = init(40, 0.5, 0xABCD);
    const KE0 = meanKE(s);
    for (let i = 0; i < 200; i += 1) step(s);
    const KE1 = meanKE(s);
    expect(Math.abs(KE1 - KE0) / KE0).toBeLessThan(0.02);
  });
  it('mean KE ~ T per particle (units: KE = kT in 2D)', () => {
    const T = 0.7;
    const s = init(40, T, 0xCAFE);
    const KE = meanKE(s);
    expect(Math.abs(KE - T) / T).toBeLessThan(0.05);
  });
  it('init places all particles within the box', () => {
    const s = init(30, 0.5);
    for (let i = 0; i < 30; i += 1) {
      expect(Math.abs(s.pos[2 * i])).toBeLessThan(0.5);
      expect(Math.abs(s.pos[2 * i + 1])).toBeLessThan(0.5);
    }
  });
  it('deterministic for fixed seed', () => {
    const s1 = init(20, 0.5, 0x1234);
    const s2 = init(20, 0.5, 0x1234);
    for (let i = 0; i < 50; i += 1) { step(s1); step(s2); }
    let diff = 0;
    for (let i = 0; i < 40; i += 1) diff += (s1.pos[i] - s2.pos[i]) ** 2;
    expect(diff).toBeLessThan(1e-20);
  });
});
