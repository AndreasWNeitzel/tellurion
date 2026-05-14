import { describe, it, expect } from 'vitest';
import { rayPlaneIntersect, rayHeightfieldCell } from './raycast.js';

describe('raycast', () => {
  it('straight-down ray onto y=0 plane hits expected point', () => {
    const ray = { origin: [3, 5, -2], dir: [0, -1, 0] };
    const hit = rayPlaneIntersect(ray, [0, 0, 0], [0, 1, 0]);
    expect(hit[0]).toBeCloseTo(3, 6);
    expect(hit[1]).toBeCloseTo(0, 6);
    expect(hit[2]).toBeCloseTo(-2, 6);
  });

  it('oblique ray hits the expected heightfield cell', () => {
    // Eye at (0, 5, 0), looking straight down, grid half-extent L=2, N=10.
    // Cell width = 0.4. Origin (0, 5, 0) with dir (0.2, -1, 0.0) hits y=0 at t=5,
    // giving (1.0, 0, 0). i = floor((1 + 2)/4 * 10) = floor(7.5) = 7.
    const ray = { origin: [0, 5, 0], dir: [0.2, -1, 0] };
    const cell = rayHeightfieldCell(ray, { halfExtent: 2, N: 10 });
    expect(cell.i).toBe(7);
    expect(cell.j).toBe(5);
  });

  it('ray missing the plane returns null', () => {
    const ray = { origin: [0, 5, 0], dir: [1, 0, 0] }; // parallel to plane
    const hit = rayPlaneIntersect(ray, [0, 0, 0], [0, 1, 0]);
    expect(hit).toBeNull();
  });
});
