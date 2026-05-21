import { describe, it, expect } from 'vitest';
import {
  dateToJD, jdToDate, newMoonJDE, newMoonHasEclipse, kForJD,
  SOLAR_ECLIPSES, LUNAR_ECLIPSES, COASTLINES,
  projectEquirect, pathPositionAt, visibilityAtPoint,
} from './sim.js';

describe('earth-eclipse-prediction', () => {
  it('Julian Day round-trip: known epoch 2000-01-01 12:00 UT = JD 2451545.0', () => {
    expect(dateToJD(2000, 1, 1, 12, 0, 0)).toBeCloseTo(2451545.0, 6);
  });

  it('Julian Day for 1999-12-31 18:00 = 2451544.25', () => {
    expect(dateToJD(1999, 12, 31, 18, 0, 0)).toBeCloseTo(2451544.25, 6);
  });

  it('Julian Day round-trip: jdToDate(dateToJD(d)) returns d', () => {
    const jd = dateToJD(2026, 8, 12, 17, 46, 0);
    const d = jdToDate(jd);
    expect(d.year).toBe(2026);
    expect(d.month).toBe(8);
    expect(d.day).toBe(12);
    expect(d.hour).toBe(17);
    expect(d.min).toBe(46);
  });

  it('newMoonJDE: k = 0 is near 2000-01-06', () => {
    const nm = newMoonJDE(0);
    const d = jdToDate(nm.JDE);
    expect(d.year).toBe(2000);
    expect(d.month).toBe(1);
    expect(d.day).toBe(6);
  });

  it('newMoonJDE: successive k differ by ~ 29.53 days', () => {
    const a = newMoonJDE(100).JDE;
    const b = newMoonJDE(101).JDE;
    expect(b - a).toBeGreaterThan(29.3);
    expect(b - a).toBeLessThan(29.7);
  });

  it('kForJD: round-trip k -> JD -> k recovers k', () => {
    const jd = newMoonJDE(123).JDE;
    expect(kForJD(jd)).toBe(123);
  });

  it('newMoonHasEclipse identifies known eclipses', () => {
    // 2026-08-12 total eclipse new moon. JD computed from the date.
    const jd = dateToJD(2026, 8, 12, 17, 46, 0);
    const k = kForJD(jd);
    expect(newMoonHasEclipse(k)).toBe(true);
  });

  it('SOLAR_ECLIPSES table has the headline upcoming events', () => {
    const ids = SOLAR_ECLIPSES.map(e => e.id);
    expect(ids).toContain('2026-08-12');
    expect(ids).toContain('2027-08-02');
    expect(ids).toContain('2028-07-22');
  });

  it('every solar eclipse entry has the required fields', () => {
    for (const e of SOLAR_ECLIPSES) {
      expect(typeof e.id).toBe('string');
      expect(['total', 'annular', 'hybrid', 'partial']).toContain(e.type);
      expect(e.max_ut).toMatch(/\d{2}:\d{2}/);
      expect(Number.isFinite(e.magnitude)).toBe(true);
      expect(Number.isFinite(e.gamma)).toBe(true);
      expect(Array.isArray(e.path)).toBe(true);
    }
  });

  it('LUNAR_ECLIPSES table has entries from 2025-2032', () => {
    expect(LUNAR_ECLIPSES.length).toBeGreaterThan(0);
    for (const e of LUNAR_ECLIPSES) {
      expect(['total', 'partial', 'penumbral']).toContain(e.type);
    }
  });

  it('Equirectangular projection: (0, 0) maps to canvas center', () => {
    const p = projectEquirect(0, 0, 1000, 500);
    expect(p.x).toBeCloseTo(500, 6);
    expect(p.y).toBeCloseTo(250, 6);
  });

  it('Equirectangular projection: (lat=+90, lon=-180) maps to top-left', () => {
    const p = projectEquirect(90, -180, 1000, 500);
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.y).toBeCloseTo(0, 6);
  });

  it('Equirectangular projection: (lat=-90, lon=+180) maps to bottom-right', () => {
    const p = projectEquirect(-90, 180, 1000, 500);
    expect(p.x).toBeCloseTo(1000, 6);
    expect(p.y).toBeCloseTo(500, 6);
  });

  it('pathPositionAt: t=0 returns first point, t=1 returns last', () => {
    const path = [[0, 10, 20], [0.5, 30, 40], [1, 50, 60]];
    const a = pathPositionAt(path, 0);
    expect(a.lat).toBeCloseTo(10, 6); expect(a.lon).toBeCloseTo(20, 6);
    const b = pathPositionAt(path, 1);
    expect(b.lat).toBeCloseTo(50, 6); expect(b.lon).toBeCloseTo(60, 6);
  });

  it('pathPositionAt: midpoint linear interpolation', () => {
    const path = [[0, 0, 0], [1, 10, 20]];
    const m = pathPositionAt(path, 0.5);
    expect(m.lat).toBeCloseTo(5, 6); expect(m.lon).toBeCloseTo(10, 6);
  });

  it('visibilityAtPoint: on the path = totality', () => {
    const ecl = SOLAR_ECLIPSES.find(e => e.type === 'total' && e.path.length > 0);
    const onPath = ecl.path[Math.floor(ecl.path.length / 2)];
    const v = visibilityAtPoint(ecl, onPath[1], onPath[2]);
    expect(v.totality).toBe(true);
  });

  it('visibilityAtPoint: 90 deg away from path = not visible', () => {
    const ecl = SOLAR_ECLIPSES.find(e => e.type === 'total' && e.path.length > 0);
    const onPath = ecl.path[Math.floor(ecl.path.length / 2)];
    // Pick a location on the opposite side of the Earth.
    const oppLat = -onPath[1];
    const oppLon = onPath[2] + 180;
    const v = visibilityAtPoint(ecl, oppLat, oppLon);
    expect(v.visible).toBe(false);
  });

  it('COASTLINES include the major continents', () => {
    expect(COASTLINES.length).toBeGreaterThanOrEqual(6);
    for (const poly of COASTLINES) {
      expect(Array.isArray(poly)).toBe(true);
      expect(poly.length).toBeGreaterThan(5);
      // Each vertex is [lon, lat].
      for (const v of poly) {
        expect(v[0]).toBeGreaterThanOrEqual(-180);
        expect(v[0]).toBeLessThanOrEqual(180);
        expect(v[1]).toBeGreaterThanOrEqual(-90);
        expect(v[1]).toBeLessThanOrEqual(90);
      }
    }
  });

  it('Solar eclipse 2026-08-12 has Greenland/Iceland/Spain in central path', () => {
    const e = SOLAR_ECLIPSES.find(s => s.id === '2026-08-12');
    expect(e).toBeDefined();
    // Path should cross between 60-80 N latitude (Greenland/Iceland) and
    // run southward into Iberia.
    const lats = e.path.map(p => p[1]);
    expect(Math.max(...lats)).toBeGreaterThan(60);
    expect(Math.min(...lats)).toBeLessThan(45);
  });
});
