import { describe, it, expect } from 'vitest';
import { viridis, magma, cividis, coolwarm, twilight, buildLUT256 } from './colormaps.js';

function close(a, b, tol) { return Math.abs(a - b) <= tol; }

describe('colormaps', () => {
  it('viridis endpoints and midpoint within tolerance', () => {
    // matplotlib viridis: 0 -> (0.267,0.005,0.329), 0.5 -> (0.128,0.566,0.551), 1 -> (0.993,0.906,0.144)
    const a = viridis(0); const b = viridis(0.5); const c = viridis(1);
    expect(close(a[0], 0.267, 8 / 255)).toBe(true);
    expect(close(c[2], 0.144, 30 / 255)).toBe(true);
    expect(b[1]).toBeGreaterThan(0.3);
  });

  it('coolwarm midpoint is near white', () => {
    const m = coolwarm(0.5);
    expect(m[0]).toBeGreaterThan(0.9);
    expect(m[1]).toBeGreaterThan(0.9);
    expect(m[2]).toBeGreaterThan(0.9);
  });

  it('coolwarm endpoints are blue and red', () => {
    const lo = coolwarm(0); const hi = coolwarm(1);
    expect(lo[2]).toBeGreaterThan(lo[0]);
    expect(hi[0]).toBeGreaterThan(hi[2]);
  });

  it('twilight is cyclic: f(0) close to f(1)', () => {
    const a = twilight(0); const b = twilight(1);
    expect(close(a[0], b[0], 6 / 255)).toBe(true);
    expect(close(a[1], b[1], 6 / 255)).toBe(true);
    expect(close(a[2], b[2], 6 / 255)).toBe(true);
  });

  it('buildLUT256 returns 256x1 RGBA bytes', () => {
    const lut = buildLUT256(viridis);
    expect(lut.length).toBe(1024);
    expect(lut[3]).toBe(255);
    expect(lut[1023]).toBe(255);
  });

  it('magma and cividis cover their canonical color shifts', () => {
    const ml = magma(0), mh = magma(1);
    expect(mh[0]).toBeGreaterThan(ml[0]);
    const cl = cividis(0), ch = cividis(1);
    expect(ch[1]).toBeGreaterThan(cl[1]);
  });
});
