// Invariants for hydrogen: the radial density normalizes, has n-l-1 nodes, the
// energies depend only on n (l-degenerate), and the most-probable and mean radii
// match the known values.

import { describe, it, expect } from 'vitest';
import { R_nl, radialProb, energy, radialNodes, meanRadius, mostProbableRadius, orbitalLabel } from './sim.js';

function integrate(n, l, fn, N = 12000) { const rmax = 4 * n * n + 12, dr = rmax / N; let s = 0; for (let i = 0; i < N; i += 1) { const r = (i + 0.5) * dr; s += fn(r) * radialProb(n, l, r) * dr; } return s; }

describe('The radial density is normalized', () => {
  it('integral P(r) dr = 1', () => {
    for (const [n, l] of [[1, 0], [2, 0], [2, 1], [3, 1], [4, 2]]) expect(integrate(n, l, () => 1)).toBeCloseTo(1, 2);
  });
});

describe('Nodes', () => {
  it('R_nl has n-l-1 radial nodes', () => {
    for (const [n, l] of [[1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [3, 2], [4, 1]]) {
      // midpoint sampling so no point lands exactly on a node.
      const rmax = 4 * n * n + 12, N = 6000; let nodes = 0, prev = R_nl(n, l, rmax * 0.5 / N);
      for (let i = 1; i < N; i += 1) { const r = rmax * (i + 0.5) / N; const v = R_nl(n, l, r); if (prev * v < 0) nodes += 1; prev = v; }
      expect(nodes).toBe(radialNodes(n, l));
    }
  });
});

describe('Energy levels', () => {
  it('E_n = -13.6 eV / n^2, independent of l', () => {
    expect(energy(1)).toBeCloseTo(-13.6057, 3);
    expect(energy(2)).toBeCloseTo(-3.4014, 3);
    expect(energy(3)).toBeCloseTo(-1.5117, 3);
  });
});

describe('Radii', () => {
  it('the 1s most probable radius is the Bohr radius a_0 = 1', () => {
    expect(mostProbableRadius(1, 0)).toBeCloseTo(1, 1);
  });
  it('the 2p most probable radius is 4 a_0', () => {
    expect(mostProbableRadius(2, 1)).toBeCloseTo(4, 0);
  });
  it('the mean radius is (3 n^2 - l(l+1)) / 2', () => {
    for (const [n, l] of [[1, 0], [2, 0], [2, 1], [3, 2]]) expect(integrate(n, l, (r) => r)).toBeCloseTo(meanRadius(n, l), 1);
  });
});

describe('Orbital labels', () => {
  it('match spectroscopic notation', () => {
    expect(orbitalLabel(1, 0)).toBe('1s'); expect(orbitalLabel(2, 1)).toBe('2p'); expect(orbitalLabel(3, 2)).toBe('3d');
  });
});
