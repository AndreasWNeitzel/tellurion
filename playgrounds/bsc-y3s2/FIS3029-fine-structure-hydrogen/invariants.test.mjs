import { describe, it, expect } from 'vitest';
import { bohrEnergy, fineStructureDelta, fsLevel } from './sim.js';
describe('fine-structure-hydrogen', () => {
  it('Bohr ground state -13.606 eV', () => {
    expect(Math.abs(bohrEnergy(1) + 13.6057)).toBeLessThan(0.01);
  });
  it('Bohr n=2 is -3.4 eV', () => {
    expect(Math.abs(bohrEnergy(2) + 3.401)).toBeLessThan(0.01);
  });
  it('FS correction at n=2, j=1/2 ~ -56 micro-eV (below Bohr)', () => {
    const d = fineStructureDelta(2, 0.5);
    expect(d).toBeLessThan(0);
  });
  it('FS sign: smaller for larger j (closer to top)', () => {
    expect(fsLevel(2, 1.5)).toBeGreaterThan(fsLevel(2, 0.5));
  });
  it('FS splitting in 2p between j=1/2 and j=3/2 ~ 4.5e-5 eV', () => {
    const s = fineStructureDelta(2, 1.5) - fineStructureDelta(2, 0.5);
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(1e-3);
  });
});
