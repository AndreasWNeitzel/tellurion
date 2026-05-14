import { describe, it, expect } from 'vitest';
import { carnotEfficiency, ottoEfficiency, dieselEfficiency, stirlingEfficiency, ottoPVCurve } from './sim.js';
describe('engine-cycle-explorer', () => {
  it('Carnot efficiency 0 at Tc = Th', () => {
    expect(carnotEfficiency(300, 300)).toBe(0);
  });
  it('Carnot upper bound: 1 - 300/600 = 0.5', () => {
    expect(Math.abs(carnotEfficiency(300, 600) - 0.5)).toBeLessThan(1e-12);
  });
  it('Otto efficiency increases with compression ratio', () => {
    expect(ottoEfficiency(8, 1.4)).toBeLessThan(ottoEfficiency(16, 1.4));
  });
  it('Otto r=8, gamma=1.4 gives ~0.565', () => {
    expect(Math.abs(ottoEfficiency(8, 1.4) - 0.5647)).toBeLessThan(0.01);
  });
  it('Diesel < Otto for same compression ratio', () => {
    expect(dieselEfficiency(15, 2, 1.4)).toBeLessThan(ottoEfficiency(15, 1.4));
  });
  it('Ideal Stirling = Carnot efficiency', () => {
    expect(stirlingEfficiency(300, 600)).toBe(carnotEfficiency(300, 600));
  });
  it('Otto PV cycle returns a closed loop', () => {
    const c = ottoPVCurve(1, 0.5, 1, 300, 900, 1.4);
    expect(Math.abs(c[0].V - c[c.length - 1].V)).toBeLessThan(0.05);
  });
});
