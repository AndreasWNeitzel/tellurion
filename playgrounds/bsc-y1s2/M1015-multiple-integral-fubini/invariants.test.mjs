import { describe, it, expect } from 'vitest';
import { dxDy, dyDx, exact } from './sim.js';
describe('multiple-integral-fubini', () => {
  it('dx dy and dy dx agree on the full square', () => expect(Math.abs(dxDy() - dyDx())).toBeLessThan(1e-6));
  it('matches exact value', () => expect(Math.abs(dxDy() - exact())).toBeLessThan(1e-4));
  it('shrinking domain shrinks integral proportionally', () => expect(Math.abs(dxDy(200, 0, Math.PI / 2, 0, Math.PI / 2) - exact(0, Math.PI / 2, 0, Math.PI / 2))).toBeLessThan(1e-4));
  it('exact on full domain = 0 (cos pi - cos 0 = -2, sin pi - sin 0 = 0)', () => expect(Math.abs(exact())).toBeLessThan(1e-12));
});
