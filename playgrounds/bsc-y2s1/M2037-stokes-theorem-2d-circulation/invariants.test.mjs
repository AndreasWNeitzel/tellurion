import { describe, it, expect } from 'vitest';
import { curlAtPoint, circulationRect } from './sim.js';
describe('stokes-theorem-2d-circulation', () => {
  it('unit-curl field: circulation = area', () => {
    expect(circulationRect('unit', 0, 0, 2, 3)).toBe(6);
  });
  it('shear field: circulation = -area', () => {
    expect(circulationRect('shear', 0, 0, 2, 3)).toBe(-6);
  });
  it('conservative field: zero circulation', () => {
    expect(circulationRect('conservative', 0, 0, 2, 3)).toBe(0);
  });
  it('curl is uniform for unit field', () => {
    for (const p of [[0,0],[1,1],[-2,3]]) expect(curlAtPoint('unit', ...p)).toBe(1);
  });
  it('doubling area doubles circulation', () => {
    expect(circulationRect('unit', 0, 0, 4, 3)).toBe(2 * circulationRect('unit', 0, 0, 2, 3));
  });
});
