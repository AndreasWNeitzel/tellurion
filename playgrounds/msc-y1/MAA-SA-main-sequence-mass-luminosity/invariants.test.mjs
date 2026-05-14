import { describe, it, expect } from 'vitest';
import { L_solar, MS_lifetime_Gyr } from './sim.js';
describe('main-sequence-mass-luminosity', () => {
  it('Sun: L = 1', () => {
    expect(Math.abs(L_solar(1) - 1)).toBeLessThan(0.01);
  });
  it('M-dwarf 0.5 Msun: L ~ 0.06', () => {
    const L = L_solar(0.5);
    expect(L).toBeGreaterThan(0.04); expect(L).toBeLessThan(0.07);
  });
  it('Lifetime decreases with M', () => {
    expect(MS_lifetime_Gyr(2)).toBeLessThan(MS_lifetime_Gyr(1));
  });
  it('Sun lifetime ~ 10 Gyr', () => {
    expect(Math.abs(MS_lifetime_Gyr(1) - 10)).toBeLessThan(0.5);
  });
  it('Massive star lifetime in Myr', () => {
    expect(MS_lifetime_Gyr(20) * 1e3).toBeLessThan(50);
  });
});
