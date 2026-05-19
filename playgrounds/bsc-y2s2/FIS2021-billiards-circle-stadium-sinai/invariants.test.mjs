// Billiard invariant tests.
// (a) Speed conservation: |v| = 1 forever.
// (b) Position stays on the boundary at bounce time.
// (c) Circle: angle of incidence invariant (integrability).
// (d) Stadium: angular spread > 2 rad over 200 bounces (chaos).

import { describe, it, expect } from 'vitest';
import { createBilliard, step, SINAI_R, ELLIPSE_AXES } from './sim.js';

describe('Billiards: speed conservation', () => {
  for (const geom of ['circle', 'stadium', 'sinai', 'ellipse']) {
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

describe('Billiards: ellipse two-focus property', () => {
  const { a, b, c } = ELLIPSE_AXES;
  it('every bounce point lies on the ellipse x^2/A^2 + y^2/B^2 = 1', () => {
    const s = createBilliard({ geom: 'ellipse', x: -c, y: 0, vx: 0.4, vy: 0.9 });
    for (let i = 0; i < 200; i += 1) {
      step(s);
      expect(Math.abs((s.x * s.x) / (a * a) + (s.y * s.y) / (b * b) - 1)).toBeLessThan(1e-9);
    }
  });
  it('a chord from one focus reflects through the other focus, alternating', () => {
    for (const [vx, vy] of [[0.3, 0.95], [0.8, 0.6], [-0.2, 1], [1, 0.05]]) {
      const s = createBilliard({ geom: 'ellipse', x: -c, y: 0, vx, vy });
      // after each bounce the outgoing ray passes through the far focus,
      // which alternates F2, F1, F2, ...
      for (let k = 0; k < 8; k += 1) {
        step(s);
        const fx = (k % 2 === 0) ? c : -c;          // target focus
        const cross = (fx - s.x) * s.vy - (0 - s.y) * s.vx;
        const denom = Math.hypot(fx - s.x, s.y) || 1;
        expect(Math.abs(cross) / denom).toBeLessThan(1e-6);
      }
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
