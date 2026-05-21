import { describe, it, expect } from 'vitest';
import { dipoleField, borisPush, stepLorentz, spawnParticle, checkAuroralExcitation, REARTH, RAURORA } from './sim.js';

describe('aurora-borealis-dipole-trap-3d', () => {
  it('dipole field zero at origin', () => {
    const [bx, by, bz] = dipoleField(0, 0, 0);
    expect(bx).toBe(0); expect(by).toBe(0); expect(bz).toBe(0);
  });

  it('dipole field on +y axis: B = (0, 2 m / y^3, 0)', () => {
    // Dipole moment is along +y (matches the render's pole axis).
    const [bx, by, bz] = dipoleField(0, 2, 0, 1);
    expect(Math.abs(bx)).toBeLessThan(1e-12);
    expect(Math.abs(bz)).toBeLessThan(1e-12);
    expect(by).toBeCloseTo(2 / 8, 12);    // 2 m / r^3 = 2 / 8
  });

  it('dipole field on equator (x-z plane): B has only y-component', () => {
    const [bx, by, bz] = dipoleField(2, 0, 0, 1);
    expect(Math.abs(bx)).toBeLessThan(1e-12);
    expect(Math.abs(bz)).toBeLessThan(1e-12);
    expect(by).toBeLessThan(0);                // anti-parallel on equator
  });

  it('Boris push conserves |v| exactly', () => {
    const v0 = [1.0, 0.5, -0.3];
    const v0mag = Math.sqrt(v0[0] ** 2 + v0[1] ** 2 + v0[2] ** 2);
    const B = [0.2, 0.5, 1.0];
    let v = v0.slice();
    for (let i = 0; i < 100; i += 1) v = borisPush(v, B, 1.0, 0.05);
    const v1mag = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
    expect(Math.abs(v1mag - v0mag)).toBeLessThan(1e-10);
  });

  it('stepLorentz preserves |v| over many steps', () => {
    const p = { x: 3, y: 0, z: 0.5, vx: 0.5, vy: 0.4, vz: 0.6 };
    const v0 = Math.sqrt(p.vx * p.vx + p.vy * p.vy + p.vz * p.vz);
    for (let i = 0; i < 200; i += 1) stepLorentz(p, 0.01, 1.0, 1.0);
    const v1 = Math.sqrt(p.vx * p.vx + p.vy * p.vy + p.vz * p.vz);
    expect(Math.abs(v1 - v0)).toBeLessThan(1e-6);
  });

  it('spawnParticle returns particles outside the inner trap region', () => {
    const rng = () => 0.5;
    for (let i = 0; i < 10; i += 1) {
      const p = spawnParticle(rng);
      const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
      expect(r).toBeGreaterThan(REARTH * 3);
    }
  });

  it('checkAuroralExcitation triggers near the magnetic pole at low altitude', () => {
    // Magnetic dipole axis is y, so the pole is along y.
    const p = { x: 0.0, y: REARTH * 1.04, z: 0.0 };
    const result = checkAuroralExcitation(p);
    expect(result).toBe('green');
  });

  it('checkAuroralExcitation does not trigger at the equator', () => {
    const p = { x: REARTH * 1.04, y: 0, z: 0 };
    const result = checkAuroralExcitation(p);
    expect(result).toBe(null);
  });

  it('green / red altitude split: low altitude is green, higher is red', () => {
    expect(checkAuroralExcitation({ x: 0, y: REARTH * 1.04, z: 0 })).toBe('green');
    expect(checkAuroralExcitation({ x: 0, y: REARTH * 1.14, z: 0 })).toBe('red');
  });
});
