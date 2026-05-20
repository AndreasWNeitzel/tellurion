import { describe, it, expect } from 'vitest';
import { lundquist, reconnectionRate, inflowSpeed, sheetHalfWidth, fieldAt, PRESETS } from './sim.js';

describe('magnetic-reconnection-x-point-3d', () => {
  const p = { L: 1, v_A: 1, eta: 1e-4 };

  it('Lundquist number S = v_A L / eta', () => {
    expect(lundquist(p)).toBeCloseTo(1 / 1e-4, 6);
  });

  it('Sweet-Parker rate M_A = 1/sqrt(S)', () => {
    expect(reconnectionRate(p)).toBeCloseTo(1 / Math.sqrt(1e4), 6);
  });

  it('inflow speed = v_A * M_A', () => {
    expect(inflowSpeed(p)).toBeCloseTo(p.v_A * reconnectionRate(p), 6);
  });

  it('sheet half-width delta = L / sqrt(S)', () => {
    expect(sheetHalfWidth(p)).toBeCloseTo(1 / Math.sqrt(1e4), 6);
  });

  it('mass conservation v_in * L = v_out * delta with v_out = v_A', () => {
    const v_in = inflowSpeed(p);
    const delta = sheetHalfWidth(p);
    const v_out = p.v_A;
    expect(v_in * p.L).toBeCloseTo(v_out * delta, 6);
  });

  it('rate decreases with larger S', () => {
    const lo = reconnectionRate({ L: 1, v_A: 1, eta: 1e-3 });
    const hi = reconnectionRate({ L: 1, v_A: 1, eta: 1e-8 });
    expect(lo).toBeGreaterThan(hi);
  });

  it('sheet thinner for smaller eta', () => {
    const fat = sheetHalfWidth({ L: 1, v_A: 1, eta: 1e-3 });
    const skinny = sheetHalfWidth({ L: 1, v_A: 1, eta: 1e-8 });
    expect(skinny).toBeLessThan(fat);
  });

  it('rate exactly scales as eta^{1/2}', () => {
    // doubling eta multiplies M_A by sqrt(2)
    const a = reconnectionRate({ L: 1, v_A: 1, eta: 1e-4 });
    const b = reconnectionRate({ L: 1, v_A: 1, eta: 2e-4 });
    expect(b / a).toBeCloseTo(Math.sqrt(2), 6);
  });

  it('hyperbolic field: B = (B0 y, B0 x)', () => {
    const { Bx, By } = fieldAt(0.4, 0.3, 2, 1);
    expect(Bx).toBeCloseTo(2 * 0.3, 9);
    expect(By).toBeCloseTo(2 * 0.4, 9);
  });

  it('X-point is a null: |B| = 0 at origin', () => {
    const { Bx, By } = fieldAt(0, 0);
    expect(Math.hypot(Bx, By)).toBeCloseTo(0, 12);
  });

  it('field is divergence-free (analytic check)', () => {
    // d(B0 y)/dx + d(B0 x)/dy = 0 (a is irrelevant; trivially zero).
    // Numerical check with central differences:
    const h = 1e-5;
    const { Bx: Bxp } = fieldAt(0.5 + h, 0.5);
    const { Bx: Bxm } = fieldAt(0.5 - h, 0.5);
    const { By: Byp } = fieldAt(0.5, 0.5 + h);
    const { By: Bym } = fieldAt(0.5, 0.5 - h);
    const divB = (Bxp - Bxm) / (2 * h) + (Byp - Bym) / (2 * h);
    expect(Math.abs(divB)).toBeLessThan(1e-9);
  });

  it('solar-corona preset has S in [1e7, 1e9]', () => {
    const S = lundquist(PRESETS.solar_corona);
    expect(S).toBeGreaterThan(1e7);
    expect(S).toBeLessThan(1e9);
  });

  it('faster Petschek-like preset has M_A > 0.05 (Sweet-Parker too slow)', () => {
    expect(reconnectionRate(PRESETS.fast_petschek)).toBeGreaterThan(0.05);
  });
});
