// Scene-level wave invariants: a free point source makes a circular
// (isotropic) wavefront travelling at c, a slitless wall blocks
// transmission while a slit lets energy through, the centred double
// slit has a strong symmetric on-axis maximum, and an obstacle casts a
// partial shadow that diffraction fills in. The raw stencil, CFL,
// damping and double-slit physics are covered separately in
// tests/engines/wave-2d-cpu.test.mjs.

import { describe, it, expect } from 'vitest';
import {
  PRESETS, cflDt, buildScene, stepScene, energy,
  ringAnisotropyEnvelope, screenAmplitude, farEnergy,
} from './sim.js';

describe('wave-2d-complex-geometry scene invariants', () => {
  it('exposes the four named presets and a stable CFL dt', () => {
    expect(PRESETS).toEqual(['free', 'single-slit', 'double-slit', 'obstacle']);
    expect(cflDt(1)).toBeCloseTo(0.9 / Math.SQRT2, 12);
  });

  it('free point source: isotropic (circular) radiated amplitude', () => {
    const c = 1, dt = cflDt(c), N = 221;
    const sc = buildScene(N, 'free', { c });
    sc.srcX = sc.cyMid;                                            // centre it for the isotropy check
    // angular variation of the radiated amplitude on a ring stays
    // small (the residual is the 5-point stencil's numerical
    // anisotropy, not a directional source)
    expect(ringAnisotropyEnvelope(sc, 34, c, dt, { steps: 360, sampleAfter: 240 })).toBeLessThan(0.3);
    // farther out the 5-point-stencil anisotropy has accumulated over
    // a few wavelengths; still far from a directional field (which
    // gives CoV well above 0.6, see the slitless-wall test)
    const sc2 = buildScene(N, 'free', { c }); sc2.srcX = sc2.cyMid;
    expect(ringAnisotropyEnvelope(sc2, 58, c, dt, { steps: 420, sampleAfter: 300 })).toBeLessThan(0.5);
  });

  it('slitless wall blocks transmission; a single slit lets energy through', () => {
    const c = 1, dt = cflDt(c), N = 201;
    const wall = buildScene(N, 'free', { c });
    for (let y = 0; y < N; y += 1) wall.barrier[y * N + wall.xWall] = 1;     // seal it
    let phase = 0;
    for (let n = 0; n < 360; n += 1) { wall.drive(phase); phase += wall.omega * dt; stepScene(wall, c, 0, dt); }
    const blocked = farEnergy(wall, wall.xWall + 16);
    const slit = buildScene(N, 'single-slit', { c });
    phase = 0;
    for (let n = 0; n < 360; n += 1) { slit.drive(phase); phase += slit.omega * dt; stepScene(slit, c, 0, dt); }
    const through = farEnergy(slit, slit.xWall + 16);
    expect(through).toBeGreaterThan(blocked * 6);
  });

  it('double slit: symmetric screen pattern with a strong on-axis maximum', () => {
    const c = 1, dt = cflDt(c), N = 221;
    const sc = buildScene(N, 'double-slit', { c, lambda: 18, slitSep: 46, slitHalf: 4 });
    const amp = screenAmplitude(sc, c, 0, dt, { steps: 1500, sampleAfter: 1000 });
    const cy = sc.cyMid;
    let yArg = 1; for (let y = 1; y < N - 1; y += 1) if (amp[y] > amp[yArg]) yArg = y;
    expect(Math.abs(yArg - cy)).toBeLessThan(7);                  // central maximum on axis
    let num = 0, den = 0;
    for (let o = 4; o < 80; o += 1) { num += Math.abs(amp[cy + o] - amp[cy - o]); den += amp[cy + o] + amp[cy - o]; }
    expect(num / den).toBeLessThan(0.2);                          // mirror symmetry
    let mean = 0; for (let y = cy - 80; y <= cy + 80; y += 1) mean += amp[y];
    mean /= 161;
    expect(amp[cy]).toBeGreaterThan(1.5 * mean);                  // strong constructive fringe
  });

  it('obstacle casts a partial shadow that diffraction partly fills', () => {
    const c = 1, dt = cflDt(c), N = 201;
    const free = buildScene(N, 'free', { c });
    const obs = buildScene(N, 'obstacle', { c });
    let p1 = 0, p2 = 0;
    for (let n = 0; n < 420; n += 1) {
      free.drive(p1); p1 += free.omega * dt; stepScene(free, c, 0, dt);
      obs.drive(p2); p2 += obs.omega * dt; stepScene(obs, c, 0, dt);
    }
    const xb = obs.xWall + 20, eFree = farEnergy(free, xb), eObs = farEnergy(obs, xb);
    expect(eObs).toBeLessThan(eFree * 0.85);                      // a real shadow
    expect(eObs).toBeGreaterThan(eFree * 0.02);                   // but diffraction bends in
  });

  it('damping drains the scene energy monotonically', () => {
    const c = 1, dt = cflDt(c), N = 161;
    const sc = buildScene(N, 'free', { c });
    let phase = 0;
    for (let n = 0; n < 120; n += 1) { sc.drive(phase); phase += sc.omega * dt; stepScene(sc, c, 0, dt); }
    const e0 = energy(sc, c);
    for (let n = 0; n < 400; n += 1) stepScene(sc, c, 0.06, dt);  // no drive, with loss
    expect(energy(sc, c)).toBeLessThan(e0 * 0.5);
  });
});
