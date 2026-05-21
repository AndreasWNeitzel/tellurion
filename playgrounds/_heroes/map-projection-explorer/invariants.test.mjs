import { describe, it, expect } from 'vitest';
import {
  PROJECTIONS, PROJECTION_KEYS, rotate, jacobian, singularValues, tissot,
} from './sim.js';

const D = Math.PI / 180;

describe('map-projection-explorer', () => {
  it('rotate is the identity when the centre is the origin', () => {
    for (const [lon, lat] of [[0.3, 0.4], [-1.2, 0.9], [2.7, -0.5]]) {
      const [l, p] = rotate(lon, lat, 0, 0);
      expect(l).toBeCloseTo(lon, 9);
      expect(p).toBeCloseTo(lat, 9);
    }
  });

  it('rotate sends the chosen centre to (0, 0)', () => {
    for (const [l0, p0] of [[0.6, 0.3], [-1.5, -0.7], [2.0, 0.0]]) {
      const [l, p] = rotate(l0, p0, l0, p0);
      expect(Math.abs(l)).toBeLessThan(1e-9);
      expect(Math.abs(p)).toBeLessThan(1e-9);
    }
  });

  it('equirectangular maps longitude and latitude straight through', () => {
    const r = PROJECTIONS.equirectangular.fn(0.7, -0.4);
    expect(r.x).toBeCloseTo(0.7, 12);
    expect(r.y).toBeCloseTo(-0.4, 12);
  });

  it('Mercator rejects the polar caps and keeps the equator undistorted in x', () => {
    expect(PROJECTIONS.mercator.fn(0.5, 88 * D)).toBe(null);
    const eq = PROJECTIONS.mercator.fn(0.5, 0);
    expect(eq.x).toBeCloseTo(0.5, 12);
    expect(eq.y).toBeCloseTo(0, 12);
  });

  it('orthographic and gnomonic reject the far hemisphere', () => {
    expect(PROJECTIONS.orthographic.fn(Math.PI - 0.1, 0)).toBe(null);
    expect(PROJECTIONS.orthographic.fn(0.2, 0.2)).not.toBe(null);
    expect(PROJECTIONS.gnomonic.fn(Math.PI - 0.1, 0)).toBe(null);
  });

  it('singularValues returns the scale factors of a pure scaling', () => {
    const [a, b] = singularValues([[3, 0], [0, 2]]);
    expect(a).toBeCloseTo(3, 9);
    expect(b).toBeCloseTo(2, 9);
  });

  it('conformal projections have a circular Tissot indicatrix (a = b)', () => {
    for (const key of ['mercator', 'stereographic']) {
      for (const [lon, lat] of [[0.3, 0.2], [-0.6, 0.7], [0.9, -0.5]]) {
        const t = tissot(PROJECTIONS[key].fn, lon, lat);
        expect(t).not.toBe(null);
        expect(t.a).toBeCloseTo(t.b, 3);          // no shape distortion
        expect(t.angular).toBeLessThan(0.5);      // degrees
      }
    }
  });

  it('equal-area projections conserve the Tissot area scale', () => {
    for (const key of ['sinusoidal', 'mollweide', 'hammer']) {
      const areas = [];
      for (const lon of [-1.0, 0, 1.0]) {
        for (const lat of [-0.6, 0, 0.6]) {
          const t = tissot(PROJECTIONS[key].fn, lon, lat);
          if (t) areas.push(t.area);
        }
      }
      const max = Math.max(...areas);
      const min = Math.min(...areas);
      expect(max / min).toBeLessThan(1.03);       // constant within FD error
    }
  });

  it('the sinusoidal area scale is unity in projection units', () => {
    const t = tissot(PROJECTIONS.sinusoidal.fn, 0.5, 0.3);
    expect(t.area).toBeCloseTo(1, 2);
  });

  it('every projection returns finite coordinates where it is defined', () => {
    for (const key of PROJECTION_KEYS) {
      const fn = PROJECTIONS[key].fn;
      for (const lon of [-1.5, 0, 1.5]) {
        for (const lat of [-0.8, 0, 0.8]) {
          const r = fn(lon, lat);
          if (r !== null) {
            expect(Number.isFinite(r.x)).toBe(true);
            expect(Number.isFinite(r.y)).toBe(true);
          }
        }
      }
    }
  });

  it('jacobian is null where the projection is undefined', () => {
    expect(jacobian(PROJECTIONS.orthographic.fn, Math.PI - 0.02, 0)).toBe(null);
  });
});
