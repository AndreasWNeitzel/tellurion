// Billiard invariant tests.
// (a) Speed conservation: |v| = 1 forever.
// (b) Position stays on the boundary at bounce time.
// (c) Circle: angle of incidence invariant (integrability).
// (d) Stadium: angular spread > 2 rad over 200 bounces (chaos).

import { describe, it, expect } from 'vitest';
import { createBilliard, step, SINAI_R } from './sim.js';

describe('Billiards: speed conservation', () => {
  for (const geom of ['circle', 'stadium', 'sinai']) {
    it(`${geom}: |v| stays = 1 over 500 bounces`, () => {
      const b = createBilliard({ geom, x: 0.3, y: 0.2, vx: 0.7, vy: 0.5 });
      for (let i = 0; i < 500; i += 1) {
        step(b);
        const v = Math.hypot(b.vx, b.vy);
        expect(Math.abs(v - 1)).toBeLessThan(1e-10);
      }
    });
  }
});

describe('Billiards: position stays inside boundary', () => {
  it('circle: every bounce point on unit circle', () => {
    const b = createBilliard({ geom: 'circle', x: 0.3, y: 0.2, vx: 0.7, vy: 0.5 });
    for (let i = 0; i < 200; i += 1) {
      step(b);
      const r = Math.hypot(b.x, b.y);
      expect(Math.abs(r - 1)).toBeLessThan(1e-9);
    }
  });

  it('sinai: bounce point on outer square or inner disc', () => {
    const b = createBilliard({ geom: 'sinai', x: 0.55, y: 0.55, vx: 1, vy: 0.6 });
    for (let i = 0; i < 500; i += 1) {
      step(b);
      const onSquare = Math.abs(Math.abs(b.x) - 1) < 1e-9 || Math.abs(Math.abs(b.y) - 1) < 1e-9;
      const onDisc = Math.abs(Math.hypot(b.x, b.y) - SINAI_R) < 1e-9;
      expect(onSquare || onDisc).toBe(true);
    }
  });
});

describe('Billiards: circle integrability', () => {
  it('angle of incidence relative to outward radial is invariant', () => {
    const b = createBilliard({ geom: 'circle', x: 0.4, y: 0.0, vx: 0.6, vy: 0.8 });
    step(b);
    const angles = [];
    for (let i = 0; i < 50; i += 1) {
      const rHat = { x: b.x, y: b.y };
      const cos = (b.vx * rHat.x + b.vy * rHat.y);
      angles.push(Math.acos(Math.max(-1, Math.min(1, cos))));
      step(b);
    }
    const a0 = angles[0];
    for (const a of angles) expect(Math.abs(a - a0)).toBeLessThan(1e-6);
  });
});

describe('Billiards: stadium and Sinai are chaotic (angular spread)', () => {
  it('stadium: bounce-velocity angles span > 2 rad over 200 bounces', () => {
    const b = createBilliard({ geom: 'stadium', x: 0.1, y: 0.2, vx: 1, vy: 0.7 });
    const angles = [];
    for (let i = 0; i < 200; i += 1) {
      step(b);
      angles.push(Math.atan2(b.vy, b.vx));
    }
    let aMin = Infinity, aMax = -Infinity;
    for (const a of angles) { if (a < aMin) aMin = a; if (a > aMax) aMax = a; }
    expect(aMax - aMin).toBeGreaterThan(2);
  });
});
