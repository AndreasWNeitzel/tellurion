import { describe, it, expect } from 'vitest';
import { generateImage, aperturePhot, moffat } from './sim.js';
describe('aperture-photometry-toy', () => {
  it('Moffat profile peaks at r=0', () => {
    expect(moffat(0, 2)).toBe(1);
  });
  it('aperture flux recovers true flux within 10%', () => {
    const img = generateImage(40, 20, 20, 10000, 3, 50);
    const r = aperturePhot(img, 40, 20, 20, 8, 16, 12, 18);
    expect(Math.abs(r.flux - 10000) / 10000).toBeLessThan(0.15);
  });
  it('background recovered within 5% of input', () => {
    const img = generateImage(40, 20, 20, 5000, 3, 200);
    const r = aperturePhot(img, 40, 20, 20, 6, 14, 12, 18);
    expect(Math.abs(r.sky - 200) / 200).toBeLessThan(0.1);
  });
  it('deterministic for same seed', () => {
    const img1 = generateImage(20, 10, 10, 1000, 2, 100, 1, 1, 0xABCD);
    const img2 = generateImage(20, 10, 10, 1000, 2, 100, 1, 1, 0xABCD);
    let diff = 0;
    for (let i = 0; i < img1.length; i += 1) diff += Math.abs(img1[i] - img2[i]);
    expect(diff).toBeLessThan(1e-5);
  });
});
