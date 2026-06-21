import { describe, it, expect } from 'vitest';
import {
  createBoxState, stepBox, kineticEnergy, directChecks, buildQuadtree, quadtreeCells,
} from './sim.js';

function clone(s) {
  return { N: s.N, x: Float64Array.from(s.x), v: Float64Array.from(s.v), r: s.r, checks: 0, collisions: 0 };
}

describe('quadtree-collisions-2d', () => {
  it('initial layout is reproducible from the seed', () => {
    const a = createBoxState(128, { seed: 0xC0FFEE });
    const b = createBoxState(128, { seed: 0xC0FFEE });
    for (let i = 0; i < 2 * 128; i += 1) expect(a.x[i]).toBe(b.x[i]);
  });

  it('disks stay inside the box', () => {
    const s = createBoxState(400, { seed: 1 });
    for (let k = 0; k < 200; k += 1) stepBox(s, 1 / 120, 'tree');
    for (let i = 0; i < s.N; i += 1) {
      expect(s.x[2 * i]).toBeGreaterThanOrEqual(s.r - 1e-9);
      expect(s.x[2 * i]).toBeLessThanOrEqual(1 - s.r + 1e-9);
      expect(s.x[2 * i + 1]).toBeGreaterThanOrEqual(s.r - 1e-9);
      expect(s.x[2 * i + 1]).toBeLessThanOrEqual(1 - s.r + 1e-9);
    }
  });

  it('elastic collisions and walls conserve kinetic energy', () => {
    const s = createBoxState(400, { seed: 2 });
    for (let k = 0; k < 30; k += 1) stepBox(s, 1 / 120, 'tree');   // relax
    const e0 = kineticEnergy(s);
    for (let k = 0; k < 600; k += 1) stepBox(s, 1 / 120, 'tree');
    const e1 = kineticEnergy(s);
    expect(Math.abs(e1 - e0) / e0).toBeLessThan(1e-6);
  });

  it('quadtree finds the same collisions as the all-pairs check', () => {
    const base = createBoxState(500, { seed: 3 });
    for (let k = 0; k < 20; k += 1) stepBox(base, 1 / 120, 'tree');
    const a = clone(base), b = clone(base);
    const ra = stepBox(a, 1 / 120, 'direct');
    const rb = stepBox(b, 1 / 120, 'tree');
    // Both methods must detect and resolve the same set of overlapping pairs.
    expect(rb.collisions).toBe(ra.collisions);
  });

  it('quadtree does far fewer checks than all-pairs at large N', () => {
    const s = createBoxState(1200, { seed: 4 });
    for (let k = 0; k < 10; k += 1) stepBox(s, 1 / 120, 'tree');
    const r = stepBox(s, 1 / 120, 'tree');
    expect(r.checks).toBeLessThan(directChecks(1200) / 5);
  });

  it('quadtree leaves tile the unit box', () => {
    const s = createBoxState(300, { seed: 5 });
    for (let k = 0; k < 5; k += 1) stepBox(s, 1 / 120, 'tree');
    const cells = quadtreeCells(buildQuadtree(s));
    let area = 0;
    for (const [x0, y0, x1, y1] of cells) area += (x1 - x0) * (y1 - y0);
    expect(Math.abs(area - 1)).toBeLessThan(1e-9);
  });
});
