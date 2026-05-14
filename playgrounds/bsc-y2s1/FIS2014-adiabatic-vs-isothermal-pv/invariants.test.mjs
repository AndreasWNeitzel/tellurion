import { describe, it, expect } from 'vitest';
import { isothermalPressure, adiabaticPressure, adiabaticTemperature, workIsothermal, R } from './sim.js';
describe('adiabatic-vs-isothermal-pv', () => {
  it('isothermal P V = nRT', () => {
    expect(Math.abs(isothermalPressure(0.05, 300) * 0.05 - R * 300)).toBeLessThan(1e-6);
  });
  it('adiabatic P V^gamma = const', () => {
    const gamma = 5 / 3, V0 = 1, P0 = 1;
    const V1 = 0.5;
    const P1 = adiabaticPressure(V1, V0, P0, gamma);
    expect(Math.abs(P1 * Math.pow(V1, gamma) - P0 * Math.pow(V0, gamma))).toBeLessThan(1e-12);
  });
  it('adiabatic T V^(gamma-1) = const', () => {
    const gamma = 7 / 5, V0 = 1, T0 = 300;
    const T1 = adiabaticTemperature(0.5, V0, T0, gamma);
    expect(Math.abs(T1 * Math.pow(0.5, gamma - 1) - T0 * Math.pow(V0, gamma - 1))).toBeLessThan(1e-9);
  });
  it('compression heats adiabatic gas', () => {
    expect(adiabaticTemperature(0.5, 1, 300, 5/3)).toBeGreaterThan(300);
  });
  it('expansion cools adiabatic gas', () => {
    expect(adiabaticTemperature(2, 1, 300, 5/3)).toBeLessThan(300);
  });
  it('isothermal expansion does positive work', () => {
    expect(workIsothermal(1, 2, 300)).toBeGreaterThan(0);
  });
  it('isothermal compression does negative work', () => {
    expect(workIsothermal(2, 1, 300)).toBeLessThan(0);
  });
});
