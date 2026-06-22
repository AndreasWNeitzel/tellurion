// Invariants for the finite square well: the matching conditions hold at each
// level, energies are ordered and bound, parity alternates from an even ground
// state, the count matches z0, and there is always at least one bound state.

import { describe, it, expect } from 'vitest';
import { z0of, boundStates, countStates, waveAt } from './sim.js';

const HALF = Math.PI / 2;
function w(z, z0) { return Math.sqrt(z0 * z0 - z * z); }

describe('The transcendental matching condition holds at each level', () => {
  it('even: z tan z = w; odd: z cot z = -w', () => {
    const V0 = 20, L = 2; const z0 = z0of(V0, L);
    for (const s of boundStates(V0, L)) {
      if (s.parity === 'even') expect(s.z * Math.tan(s.z)).toBeCloseTo(w(s.z, z0), 5);
      else expect(s.z / Math.tan(s.z)).toBeCloseTo(-w(s.z, z0), 5);
    }
  });
});

describe('Energies are ordered and strictly bound', () => {
  it('0 < E_n < V0 and increasing', () => {
    const states = boundStates(18, 2.4); let prev = 0;
    for (const s of states) { expect(s.EoverV0).toBeGreaterThan(0); expect(s.EoverV0).toBeLessThan(1); expect(s.E).toBeGreaterThan(prev); prev = s.E; }
  });
  it('parity alternates starting from an even ground state', () => {
    const states = boundStates(40, 2);
    states.forEach((s, i) => expect(s.parity).toBe(i % 2 === 0 ? 'even' : 'odd'));
  });
});

describe('The number of bound states follows z0', () => {
  it('count = floor(z0 / (pi/2)) + 1', () => {
    for (const [V0, L] of [[1, 1], [5, 2], [20, 2], [50, 3]]) {
      expect(boundStates(V0, L).length).toBe(countStates(V0, L));
      expect(boundStates(V0, L).length).toBe(Math.floor(z0of(V0, L) / HALF) + 1);
    }
  });
  it('a shallow well still binds exactly one state', () => {
    const V0 = 0.05, L = 1; // z0 small but positive
    expect(z0of(V0, L)).toBeLessThan(HALF);
    expect(boundStates(V0, L).length).toBe(1);
    expect(boundStates(V0, L)[0].parity).toBe('even');
  });
});

describe('The wavefunction decays outside and is continuous at the wall', () => {
  it('matches across the wall and decays beyond it', () => {
    const V0 = 25, L = 2; const s = boundStates(V0, L)[0]; const h = L / 2;
    const inAtWall = waveAt(s, h - 1e-6, V0, L), outAtWall = waveAt(s, h + 1e-6, V0, L);
    expect(inAtWall).toBeCloseTo(outAtWall, 4);
    expect(Math.abs(waveAt(s, h + 1.0, V0, L))).toBeLessThan(Math.abs(waveAt(s, h + 1e-6, V0, L)));
  });
  it('the n-th state has n interior nodes', () => {
    const V0 = 60, L = 2; const states = boundStates(V0, L);
    for (const s of states.slice(0, 3)) {
      // sample at cell midpoints so no point lands exactly on the x = 0 node.
      let nodes = 0, prev = waveAt(s, -L / 2 + L * 0.5 / 400, V0, L);
      for (let i = 1; i < 400; i += 1) { const x = -L / 2 + L * (i + 0.5) / 400; const v = waveAt(s, x, V0, L); if (prev * v < 0) nodes += 1; prev = v; }
      expect(nodes).toBe(s.n);
    }
  });
});
