import { describe, it, expect } from 'vitest';
import { wedgeCharges, sphereCharges, potentialAt, imageChargeSum, fieldAt, R_SPHERE } from './sim.js';

const R = R_SPHERE;

describe('method of images: V = 0 on the conductor', () => {
  it('plane: potential vanishes along y = 0', () => {
    const cs = wedgeCharges(1, 1.4, 1.1, 1);   // charge in the upper half plane
    for (let x = -3; x <= 3; x += 0.3) expect(Math.abs(potentialAt(cs, x, 0))).toBeLessThan(1e-9);
  });
  it('corner: potential vanishes on both walls (+x and +y axes)', () => {
    const cs = wedgeCharges(2, 1.5, Math.PI / 5, 1);
    for (let t = 0.05; t <= 3; t += 0.25) {
      expect(Math.abs(potentialAt(cs, t, 0))).toBeLessThan(1e-9);   // +x wall
      expect(Math.abs(potentialAt(cs, 0, t))).toBeLessThan(1e-9);   // +y wall
    }
  });
  it('wedge (60 deg): potential vanishes on both walls phi = 0 and phi = pi/3', () => {
    const beta = Math.PI / 3;
    const cs = wedgeCharges(3, 1.6, beta / 2, 1);
    for (let r = 0.1; r <= 3; r += 0.2) {
      expect(Math.abs(potentialAt(cs, r, 0))).toBeLessThan(1e-9);
      expect(Math.abs(potentialAt(cs, r * Math.cos(beta), r * Math.sin(beta)))).toBeLessThan(1e-9);
    }
  });
  it('sphere: potential vanishes on the surface r = R', () => {
    const cs = sphereCharges(R, 1.9, 0.7, 1);
    for (let th = 0; th < 2 * Math.PI; th += 0.2) expect(Math.abs(potentialAt(cs, R * Math.cos(th), R * Math.sin(th)))).toBeLessThan(1e-9);
  });
});

describe('method of images: image counts and charge rules', () => {
  it('plane has 1 image, corner 3, wedge 5', () => {
    expect(wedgeCharges(1, 1.4, 1, 1).length - 1).toBe(1);
    expect(wedgeCharges(2, 1.5, 0.6, 1).length - 1).toBe(3);
    expect(wedgeCharges(3, 1.6, 0.5, 1).length - 1).toBe(5);
  });
  it("sphere image is q' = -(R/d) q at R^2/d^2 (Griffiths)", () => {
    const a = 1.9, b = 0.7, d = Math.hypot(a, b);
    const cs = sphereCharges(R, a, b, 1);
    const img = cs.find((c) => c.image);
    expect(img.q).toBeCloseTo(-(R / d), 12);
    expect(Math.hypot(img.x, img.y)).toBeCloseTo(R * R / d, 12);
  });
  it('net induced charge: -q for plane and corner, -(R/d)q for sphere', () => {
    expect(imageChargeSum(wedgeCharges(1, 1.4, 1, 1))).toBeCloseTo(-1, 12);
    expect(imageChargeSum(wedgeCharges(2, 1.5, 0.6, 1))).toBeCloseTo(-1, 12);
    const a = 1.9, b = 0.7, d = Math.hypot(a, b);
    expect(imageChargeSum(sphereCharges(R, a, b, 1))).toBeCloseTo(-(R / d), 12);
  });
  it('field just outside the plane is purely normal (no tangential component)', () => {
    const cs = wedgeCharges(1, 1.0, Math.PI / 2, 1);   // charge straight above origin
    const f = fieldAt(cs, 0.7, 1e-4);
    expect(Math.abs(f.ex)).toBeLessThan(1e-2 * Math.abs(f.ey));
  });
});
