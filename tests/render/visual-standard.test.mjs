import { describe, it, expect } from 'vitest';
import { planckTempToSRGB } from '../../shared/js/render/blackbody.js';
import { acesFilmic } from '../../shared/js/render/aces.js';
import { complexPhaseToRGB } from '../../shared/js/render/phase-hsv.js';
import { blueNoise256 } from '../../shared/js/render/dither.js';

describe('visual standard modules', () => {
  it('Planck at 6500 K is near white', () => {
    const rgb = planckTempToSRGB(6500);
    expect(rgb[0]).toBeGreaterThan(0.9);
    expect(rgb[1]).toBeGreaterThan(0.9);
    expect(rgb[2]).toBeGreaterThan(0.9);
  });
  it('Planck at 3000 K is warm (red > blue)', () => {
    const rgb = planckTempToSRGB(3000);
    expect(rgb[0]).toBeGreaterThan(rgb[2]);
  });
  it('Planck at 20000 K is cool (blue > red)', () => {
    const rgb = planckTempToSRGB(20000);
    expect(rgb[2]).toBeGreaterThan(rgb[0]);
  });
  it('ACES at 0 maps to 0 (black point)', () => {
    expect(acesFilmic([0, 0, 0])[0]).toBeCloseTo(0, 5);
  });
  it('ACES is monotonic', () => {
    const lo = acesFilmic([0.2, 0.2, 0.2]);
    const hi = acesFilmic([0.8, 0.8, 0.8]);
    expect(hi[0]).toBeGreaterThan(lo[0]);
  });
  it('Phase 0 (positive real) is red-ish', () => {
    const rgb = complexPhaseToRGB(1, 0);
    expect(rgb[0]).toBeGreaterThan(rgb[1]);
  });
  it('Blue noise array size 65536, all bytes', () => {
    const a = blueNoise256();
    expect(a.length).toBe(65536);
    for (let i = 0; i < 100; i += 1) { const v = a[Math.floor(i * 655)]; expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(256); }
  });
});
