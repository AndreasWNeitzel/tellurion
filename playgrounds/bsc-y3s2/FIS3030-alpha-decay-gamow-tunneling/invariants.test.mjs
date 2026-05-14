import { describe, it, expect } from 'vitest';
import { geigerNuttallLogT, gamowExponent } from './sim.js';
describe('alpha-decay-gamow-tunneling', () => {
  it('Geiger-Nuttall increases with Z', () => {
    expect(geigerNuttallLogT(90, 5)).toBeLessThan(geigerNuttallLogT(95, 5));
  });
  it('Geiger-Nuttall decreases with Q', () => {
    expect(geigerNuttallLogT(90, 4)).toBeGreaterThan(geigerNuttallLogT(90, 6));
  });
  it('U-238: Z_d=90, Q=4.27 MeV: log10(T/s) ~ 17', () => {
    const v = geigerNuttallLogT(90, 4.27);
    expect(v).toBeGreaterThan(12);
    expect(v).toBeLessThan(30);
  });
  it('Po-212: Z_d=82, Q=8.95 MeV: short half-life log10 < 0', () => {
    expect(geigerNuttallLogT(82, 8.95)).toBeLessThan(0);
  });
  it('Gamow exponent positive', () => {
    expect(gamowExponent(82, 5)).toBeGreaterThan(0);
  });
});
