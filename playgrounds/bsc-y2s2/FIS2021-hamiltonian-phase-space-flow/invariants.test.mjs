import { describe, it, expect } from 'vitest';
import { hamiltonian, leapfrog, rhs } from './sim.js';
describe('hamiltonian-phase-space-flow', () => {
  it('SHO leapfrog conserves energy over long time', () => {
    let q = 1, p = 0;
    const E0 = hamiltonian(q, p, 'sho');
    for (let i = 0; i < 10000; i += 1) ({ q, p } = leapfrog(q, p, 0.05, 'sho'));
    expect(Math.abs(hamiltonian(q, p, 'sho') - E0) / E0).toBeLessThan(0.001);
  });
  it('pendulum: small oscillation has approx period 2 pi', () => {
    let q = 0.1, p = 0; const dt = 0.01;
    for (let i = 0; i < Math.floor(2 * Math.PI / dt); i += 1) ({ q, p } = leapfrog(q, p, dt, 'pendulum'));
    expect(Math.abs(q - 0.1)).toBeLessThan(0.01);
  });
  it('pendulum: separatrix at E = 1 (max p = 2 at q = 0)', () => {
    expect(hamiltonian(Math.PI, 0, 'pendulum')).toBe(1);
    expect(hamiltonian(0, 2, 'pendulum')).toBe(1);
  });
  it('rhs sign convention right', () => {
    const r = rhs(0.5, 0, 'pendulum');
    expect(r.dp).toBeLessThan(0);
  });
});
