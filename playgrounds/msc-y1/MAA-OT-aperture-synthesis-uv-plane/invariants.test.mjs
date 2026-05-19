// Aperture Synthesis on the UV Plane: real invariants on the pure
// physics in sim.js (the previous file was a placeholder skeleton).
import { describe, it, expect } from 'vitest';
import {
  stationXYZ, baselineLambda, uv, maxBaseline, resolutionMas, dirtyBeam, dirtyImage,
} from './sim.js';

const TS = [
  { name: 'ALMA', lat: -23.0, lon: -67.8 },
  { name: 'VLA', lat: 34.1, lon: -107.6 },
  { name: 'Effelsberg', lat: 50.5, lon: 6.9 },
  { name: 'Metsahovi', lat: 60.2, lon: 24.4 },
  { name: 'JCMT', lat: 19.8, lon: -155.5 },
].map((t) => stationXYZ(t.lat, t.lon));

describe('aperture-synthesis-uv-plane', () => {
  it('a station lies on the Earth sphere (|r| = R_Earth)', () => {
    const p = stationXYZ(34.1, -107.6);
    expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(6378.0, 6);
  });

  it('zero baseline gives the (0,0) UV point at every hour angle', () => {
    const b = baselineLambda(TS[0], TS[0], 3.0);
    for (const H of [-2, -0.5, 0, 1.3, 3]) {
      const p = uv(b.bx, b.by, b.bz, H, 0.5);
      expect(Math.abs(p.u)).toBeLessThan(1e-6);
      expect(Math.abs(p.v)).toBeLessThan(1e-6);
    }
  });

  it('Hermitian conjugate: swapping the antenna order negates (u,v)', () => {
    const bij = baselineLambda(TS[0], TS[3], 3.0);
    const bji = baselineLambda(TS[3], TS[0], 3.0);
    const a = uv(bij.bx, bij.by, bij.bz, 0.7, 30 * Math.PI / 180);
    const c = uv(bji.bx, bji.by, bji.bz, 0.7, 30 * Math.PI / 180);
    expect(a.u).toBeCloseTo(-c.u, 6);
    expect(a.v).toBeCloseTo(-c.v, 6);
  });

  it('1000 km baseline at 3 mm resolves to ~0.62 mas', () => {
    const a = stationXYZ(0, 0);
    // place b so the straight-line chord is ~1000 km
    const b = stationXYZ(0, (1000 / 6378) * 180 / Math.PI / 2 * 2 * (180 / Math.PI) / (180 / Math.PI));
    const chordKm = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    const blLambda = chordKm * 1e6 / 3.0;
    const thetaMas = (1 / blLambda) * 206264.806 * 1000;
    expect(thetaMas).toBeGreaterThan(0.3);
    expect(thetaMas).toBeLessThan(1.2);
  });

  it('global array resolution is sub-milliarcsecond at 3 mm (VLBI scale)', () => {
    const r = resolutionMas(TS, 3.0);
    expect(r).toBeGreaterThan(0.01);
    expect(r).toBeLessThan(1.0);
    expect(maxBaseline(TS, 3.0)).toBeGreaterThan(1e8);
  });

  it('dirty beam is real, peaks at the origin, and is centro-symmetric', () => {
    const samples = [];
    for (let s = 0; s < 40; s += 1) {
      const Hh = s / 40 * 2 * Math.PI - Math.PI;
      for (let i = 0; i < TS.length; i += 1) for (let j = i + 1; j < TS.length; j += 1) {
        const b = baselineLambda(TS[i], TS[j], 3.0);
        const p = uv(b.bx, b.by, b.bz, Hh, 30 * Math.PI / 180);
        samples.push({ u: p.u, v: p.v }, { u: -p.u, v: -p.v });
      }
    }
    const peak = dirtyBeam(samples, 0, 0);
    expect(peak).toBeCloseTo(1, 6);                       // normalised, on-axis
    const d = 1e-9;
    expect(dirtyBeam(samples, d, -2 * d)).toBeCloseTo(dirtyBeam(samples, -d, 2 * d), 8);
    expect(Math.abs(dirtyBeam(samples, 5e-9, 3e-9))).toBeLessThan(peak);
  });

  it('dirty image of an on-axis point source peaks at the grid centre', () => {
    const samples = [];
    for (let s = 0; s < 30; s += 1) {
      const Hh = s / 30 * 2 * Math.PI - Math.PI;
      for (let i = 0; i < TS.length; i += 1) for (let j = i + 1; j < TS.length; j += 1) {
        const b = baselineLambda(TS[i], TS[j], 3.0);
        const p = uv(b.bx, b.by, b.bz, Hh, 0.5);
        samples.push({ u: p.u, v: p.v }, { u: -p.u, v: -p.v });
      }
    }
    const N = 21, fov = 700 * Math.PI / 648000;
    const img = dirtyImage(samples, [{ l: 0, m: 0, amp: 1 }], N, fov);
    const c = ((N - 1) / 2) * N + (N - 1) / 2;
    let mx = -Infinity, arg = -1;
    for (let i = 0; i < img.length; i += 1) if (img[i] > mx) { mx = img[i]; arg = i; }
    expect(arg).toBe(c);
  });
});
