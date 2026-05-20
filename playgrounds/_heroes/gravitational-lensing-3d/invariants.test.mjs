import { describe, it, expect } from 'vitest';
import { lensPointMass, solvePointMassImages, sourcePattern } from './sim.js';

describe('gravitational-lensing-3d', () => {
  it('lensPointMass: theta = (1, 0) -> beta = (0, 0) (Einstein ring point)', () => {
    const [bx, by] = lensPointMass(1, 0);
    expect(Math.abs(bx)).toBeLessThan(1e-9);
    expect(Math.abs(by)).toBeLessThan(1e-9);
  });

  it('lensPointMass: theta = (2, 0) -> beta = (2 - 1/2, 0) = (1.5, 0)', () => {
    const [bx, by] = lensPointMass(2, 0);
    expect(bx).toBeCloseTo(1.5, 9);
    expect(by).toBeCloseTo(0, 9);
  });

  it('solvePointMassImages at beta=(0,0): two images at +/- 1 (Einstein ring radial sample)', () => {
    const imgs = solvePointMassImages(0, 0);
    expect(imgs).toHaveLength(2);
    expect(Math.abs(imgs[0].x)).toBeCloseTo(1, 9);
    expect(Math.abs(imgs[1].x)).toBeCloseTo(1, 9);
  });

  it('solvePointMassImages at beta=(2, 0): primary image outside Einstein ring', () => {
    const imgs = solvePointMassImages(2, 0);
    const rp = Math.sqrt(imgs[0].x ** 2 + imgs[0].y ** 2);
    expect(rp).toBeGreaterThan(1);
  });

  it('solvePointMassImages: lens equation closes (back-substitute beta)', () => {
    const beta = [0.4, 0.2];
    const imgs = solvePointMassImages(beta[0], beta[1]);
    for (const im of imgs) {
      const [bx, by] = lensPointMass(im.x, im.y);
      expect(Math.abs(bx - beta[0])).toBeLessThan(1e-9);
      expect(Math.abs(by - beta[1])).toBeLessThan(1e-9);
    }
  });

  it('sourcePattern stripes is bounded in [-1, 1]', () => {
    for (let i = 0; i < 100; i += 1) {
      const v = sourcePattern((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, 'stripes');
      expect(v).toBeGreaterThanOrEqual(-1.0001);
      expect(v).toBeLessThanOrEqual(1.0001);
    }
  });

  it('magnification grows as source approaches the Einstein ring', () => {
    const imgsFar = solvePointMassImages(1.5, 0);
    const imgsNear = solvePointMassImages(0.05, 0);
    const muFar = imgsFar.reduce((s, im) => s + im.mag, 0);
    const muNear = imgsNear.reduce((s, im) => s + im.mag, 0);
    expect(muNear).toBeGreaterThan(muFar);
  });
});
