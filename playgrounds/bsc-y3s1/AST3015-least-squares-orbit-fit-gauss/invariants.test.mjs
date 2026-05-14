import { describe, it, expect } from 'vitest';
import { generateData, fitCircle, rms } from './sim.js';
describe('least-squares-orbit-fit-gauss', () => {
  it('fitCircle exact on 3 noiseless points', () => {
    const data = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
    const f = fitCircle(data);
    expect(Math.abs(f.x0)).toBeLessThan(1e-6);
    expect(Math.abs(f.y0)).toBeLessThan(1e-6);
    expect(Math.abs(f.r - 1)).toBeLessThan(1e-6);
  });
  it('rms is zero on noiseless circle', () => {
    const data = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];
    const f = fitCircle(data);
    expect(rms(data, f)).toBeLessThan(1e-6);
  });
  it('Fitting noisy circular orbit recovers radius to within 5%', () => {
    const times = Array.from({ length: 30 }, (_, i) => i / 30);
    const data = generateData(1, 0, 0, 1, times, 0.05, 0xABCD);
    const f = fitCircle(data);
    expect(Math.abs(f.r - 1)).toBeLessThan(0.05);
  });
});
