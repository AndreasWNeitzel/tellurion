// Projectile invariants.
// (a) Vacuum: range = v0^2 sin(2 theta) / g.
// (b) Drag shortens range.
// (c) Stokes terminal velocity: vt = m g / b. Dropped from rest reaches vt.
// (d) Quadratic terminal velocity: vt = sqrt(m g / c).
// (e) 45 deg maximizes vacuum range.

import { describe, it, expect } from 'vitest';
import {
  createProjectile, stepProjectile, vacuumRange, vacuumPeak,
  terminalVelocityStokes, terminalVelocityQuadratic, G, M,
} from './sim.js';

function runRange(opts) {
  const s = createProjectile(opts);
  const dt = 0.005;
  let prevY, prevX;
  for (let i = 0; i < 200000; i += 1) {
    prevY = s.y; prevX = s.x;
    stepProjectile(s, dt);
    if (i > 5 && prevY > 0 && s.y <= 0) {
      const frac = prevY / (prevY - s.y);
      return prevX + frac * (s.x - prevX);
    }
  }
  return s.x;
}

describe('Projectile: vacuum range', () => {
  it('range = v0^2 sin(2 theta) / g within 1 percent', () => {
    for (const angle of [30, 45, 60]) {
      const numerical = runRange({ v0: 20, angleDeg: angle, dragMode: 'none' });
      const analytic = vacuumRange(20, angle);
      expect(Math.abs(numerical - analytic) / analytic).toBeLessThan(0.01);
    }
  }, 30_000);
});

describe('Projectile: drag shortens range', () => {
  it('Stokes drag reduces range below vacuum', () => {
    const vac = runRange({ v0: 20, angleDeg: 45, dragMode: 'none' });
    const sto = runRange({ v0: 20, angleDeg: 45, dragMode: 'stokes', b: 0.3 });
    expect(sto).toBeLessThan(vac);
  });
  it('Quadratic drag reduces range below vacuum', () => {
    const vac = runRange({ v0: 20, angleDeg: 45, dragMode: 'none' });
    const qua = runRange({ v0: 20, angleDeg: 45, dragMode: 'quadratic', c: 0.02 });
    expect(qua).toBeLessThan(vac);
  });
});

describe('Projectile: Stokes terminal velocity', () => {
  it('vt = m g / b exact', () => {
    expect(terminalVelocityStokes(0.1)).toBeCloseTo(M * G / 0.1, 12);
  });
  it('object dropped from rest under Stokes drag reaches vt within 5 percent', () => {
    const b = 0.5;
    const vt = terminalVelocityStokes(b);
    const s = createProjectile({ v0: 0, angleDeg: 0, dragMode: 'stokes', b });
    s.y = 100;
    const dt = 0.005;
    for (let i = 0; i < 20000; i += 1) stepProjectile(s, dt);
    expect(Math.abs(Math.abs(s.vy) - vt) / vt).toBeLessThan(0.05);
  });
});

describe('Projectile: quadratic terminal velocity', () => {
  it('vt = sqrt(m g / c) exact', () => {
    expect(terminalVelocityQuadratic(0.02)).toBeCloseTo(Math.sqrt(M * G / 0.02), 12);
  });
});

describe('Projectile: 45 deg maximizes vacuum range', () => {
  it('vacuumRange(v0, 45) > vacuumRange(v0, 30) and > vacuumRange(v0, 60)', () => {
    const v0 = 20;
    expect(vacuumRange(v0, 45)).toBeGreaterThan(vacuumRange(v0, 30));
    expect(vacuumRange(v0, 45)).toBeGreaterThan(vacuumRange(v0, 60));
  });
});

describe('Projectile: peak height', () => {
  it('vacuumPeak = v0^2 sin^2(theta) / (2 g) exact', () => {
    for (const angle of [30, 45, 60]) {
      const theta = (angle * Math.PI) / 180;
      expect(vacuumPeak(20, angle)).toBeCloseTo(20 * 20 * Math.sin(theta) ** 2 / (2 * G), 12);
    }
  });
});
