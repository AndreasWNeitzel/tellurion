import { describe, it, expect } from 'vitest';
import { P2, tideHeight, tideAt, moonPosition, tidalRegime, A_LUNAR, A_SOLAR } from './sim.js';

describe('earth-moon-tides-3d', () => {
  it('P2(1) = 1 (sub-solar bulge maximum)', () => {
    expect(P2(1)).toBeCloseTo(1, 12);
  });

  it('P2(-1) = 1 (antipodal bulge same height)', () => {
    expect(P2(-1)).toBeCloseTo(1, 12);
  });

  it('P2(0) = -1/2 (perpendicular minimum)', () => {
    expect(P2(0)).toBeCloseTo(-0.5, 12);
  });

  it('moonPosition at phase=0 is along +x (new moon, between Sun and observer)', () => {
    const [mx, my, mz] = moonPosition(0);
    expect(mx).toBeCloseTo(1, 12);
    expect(my).toBeCloseTo(0, 12);
    expect(mz).toBeCloseTo(0, 12);
  });

  it('moonPosition at phase=pi/2 is +y (quarter moon)', () => {
    const [mx, my, mz] = moonPosition(Math.PI / 2);
    expect(Math.abs(mx)).toBeLessThan(1e-12);
    expect(my).toBeCloseTo(1, 12);
  });

  it('tideHeight aligned (both cos=1): equals A_lunar + A_solar (max amplitude)', () => {
    const h = tideHeight(1, 1);
    expect(h).toBeCloseTo(A_LUNAR + A_SOLAR, 12);
  });

  it('tideHeight perpendicular: equals -(A_lunar + A_solar)/2 (combined minimum)', () => {
    const h = tideHeight(0, 0);
    expect(h).toBeCloseTo(-(A_LUNAR + A_SOLAR) / 2, 12);
  });

  it('tidalRegime at phase=0 is spring', () => {
    const r = tidalRegime(0);
    expect(r.kind).toBe('spring');
  });

  it('tidalRegime at phase=pi is spring (full moon)', () => {
    const r = tidalRegime(Math.PI);
    expect(r.kind).toBe('spring');
  });

  it('tidalRegime at phase=pi/2 is neap (quadrature)', () => {
    const r = tidalRegime(Math.PI / 2);
    expect(r.kind).toBe('neap');
  });

  it('spring tidal range > neap tidal range', () => {
    const rs = tidalRegime(0).range;
    const rn = tidalRegime(Math.PI / 2).range;
    expect(rs).toBeGreaterThan(rn);
  });

  it('tideAt sub-solar+sub-lunar point at phase=0 equals max amplitude', () => {
    // Theta=pi/2, phi=0 puts the surface point along +x where both Sun and Moon are.
    const h = tideAt(Math.PI / 2, 0, 0);
    expect(h).toBeCloseTo(A_LUNAR + A_SOLAR, 9);
  });

  it('tideAt antipode (phi=pi) at phase=0 also equals max amplitude (the SECOND bulge)', () => {
    const h = tideAt(Math.PI / 2, Math.PI, 0);
    expect(h).toBeCloseTo(A_LUNAR + A_SOLAR, 9);
  });
});
