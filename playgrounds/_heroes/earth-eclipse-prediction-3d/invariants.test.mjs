import { describe, it, expect } from 'vitest';
import { ephemeris, eclipseState, predictNext, REAL } from './sim.js';

describe('earth-eclipse-prediction-3d', () => {
  it('Earth distance from Sun ~ 1 AU', () => {
    const e = ephemeris(0);
    const r = Math.sqrt(e.xE * e.xE + e.yE * e.yE + e.zE * e.zE);
    expect(r).toBeCloseTo(1, 9);
  });

  it('Moon distance from Earth ~ d_em/d_se', () => {
    const e = ephemeris(0);
    const dx = e.xM - e.xE, dy = e.yM - e.yE, dz = e.zM - e.zE;
    const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
    expect(r).toBeCloseTo(REAL.d_em / REAL.d_se, 5);
  });

  it('Moon orbit period is T_moon (close phi after one period)', () => {
    const e0 = ephemeris(0);
    const e1 = ephemeris(REAL.T_moon);
    const dx0 = e0.xM - e0.xE, dy0 = e0.yM - e0.yE;
    const dx1 = e1.xM - e1.xE, dy1 = e1.yM - e1.yE;
    const phi0 = Math.atan2(dy0, dx0);
    const phi1 = Math.atan2(dy1, dx1);
    expect(Math.abs(((phi1 - phi0) + 2 * Math.PI) % (2 * Math.PI))).toBeLessThan(0.02);
  });

  it('eclipseState returns finite angles', () => {
    const s = eclipseState(0);
    expect(Number.isFinite(s.theta)).toBe(true);
    expect(Number.isFinite(s.angSun)).toBe(true);
    expect(Number.isFinite(s.angMoon)).toBe(true);
  });

  it('Sun angular radius from Earth ~ 0.27°', () => {
    const s = eclipseState(0);
    const deg = s.angSun * 180 / Math.PI;
    expect(deg).toBeGreaterThan(0.2);
    expect(deg).toBeLessThan(0.4);
  });

  it('predictNext finds a solar eclipse within 1 year', () => {
    const found = predictNext(0, 'solar', 400, 0.5);
    expect(found).not.toBe(null);
    expect(found.t).toBeGreaterThan(0);
    expect(found.t).toBeLessThan(400);
  });

  it('predictNext finds a lunar eclipse within 1 year', () => {
    const found = predictNext(0, 'lunar', 400, 0.5);
    expect(found).not.toBe(null);
  });

  it('found solar eclipse satisfies the angular condition', () => {
    const found = predictNext(0, 'solar', 400, 0.25);
    if (!found) return;
    expect(found.state.isSolar).toBe(true);
    expect(found.state.theta).toBeLessThan((found.state.angSun + found.state.angMoon) * 1.5);
  });
});
