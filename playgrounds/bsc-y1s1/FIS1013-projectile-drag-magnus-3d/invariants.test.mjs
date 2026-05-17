// Projectile with drag and Magnus: the vacuum analytic limit, the
// geometric property of the Magnus force, and the qualitative effects
// of drag and spin.

import { describe, it, expect } from 'vitest';
import { trajectory, magnusForce, vacuumRange, vacuumApex, spinVector } from './sim.js';

describe('projectile-drag-magnus-3d invariants', () => {
  it('vacuum trajectory matches the analytic range and apex within 0.2%', () => {
    const r = trajectory({ speed: 30, elevDeg: 40, c: 0, cM: 0 });
    expect(Math.abs(r.range - vacuumRange(30, 40)) / vacuumRange(30, 40)).toBeLessThan(2e-3);
    expect(Math.abs(r.apex - vacuumApex(30, 40)) / vacuumApex(30, 40)).toBeLessThan(2e-3);
  });

  it('Magnus force is perpendicular to both v and omega', () => {
    const omega = [1.3, -2.1, 0.7], v = [12, -4, 9];
    const F = magnusForce(omega, v, 0.05);
    const dotV = F[0] * v[0] + F[1] * v[1] + F[2] * v[2];
    const dotW = F[0] * omega[0] + F[1] * omega[1] + F[2] * omega[2];
    expect(Math.abs(dotV)).toBeLessThan(1e-12);
    expect(Math.abs(dotW)).toBeLessThan(1e-12);
  });

  it('quadratic drag shortens the range', () => {
    const vac = trajectory({ speed: 35, elevDeg: 35, c: 0, cM: 0 }).range;
    const drag = trajectory({ speed: 35, elevDeg: 35, c: 0.01, cM: 0 }).range;
    expect(drag).toBeLessThan(vac);
  });

  it('sidespin deflects laterally; topspin/backspin do not', () => {
    const side = trajectory({ speed: 30, elevDeg: 30, omega: spinVector(40, 'side'), c: 0.004, cM: 0.0016 });
    const top = trajectory({ speed: 30, elevDeg: 30, omega: spinVector(40, 'top'), c: 0.004, cM: 0.0016 });
    expect(Math.abs(side.side)).toBeGreaterThan(1.0);
    expect(Math.abs(top.side)).toBeLessThan(1e-6);
  });

  it('backspin gives more range than topspin (lift vs down-force)', () => {
    const back = trajectory({ speed: 30, elevDeg: 20, omega: spinVector(50, 'back'), c: 0.004, cM: 0.0018 });
    const top = trajectory({ speed: 30, elevDeg: 20, omega: spinVector(50, 'top'), c: 0.004, cM: 0.0018 });
    expect(back.range).toBeGreaterThan(top.range);
  });

  it('drag-free, spin-free flight conserves energy along the path', () => {
    const r = trajectory({ speed: 28, elevDeg: 45, c: 0, cM: 0 });
    // 1/2 v^2 + g z is constant; check apex KE+PE vs launch.
    const E0 = 0.5 * 28 * 28;
    const Eapex = 9.81 * r.apex + 0.5 * (28 * Math.cos(45 * Math.PI / 180)) ** 2;
    expect(Math.abs(Eapex - E0) / E0).toBeLessThan(1e-3);
  });
});
