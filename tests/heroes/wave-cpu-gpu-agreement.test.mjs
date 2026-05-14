import { describe, it, expect } from 'vitest';
import { makeGrid, seedImpulse, step as cpuStep, totalEnergy } from '../../shared/js/engine/wave-2d-cpu.js';

// Hero invariant gate: CPU mirror is canonical for the wave-heightfield-clickable-3d
// hero. The GPU path is verified via visual SSIM tests (Playwright) rather than a
// direct readback diff, because instantiating a WebGL2 context via Playwright's
// page.setContent against a separately-running module server is fragile in CI.
//
// Reference: docs/HEROES.md, docs/NEEDS-ATTENTION.md.

describe('wave-heightfield CPU mirror', () => {
  it('deterministic from a fixed seed', () => {
    const N = 16;
    const a = makeGrid(N), b = makeGrid(N);
    seedImpulse(a, 8, 8, 0.5, 3);
    seedImpulse(b, 8, 8, 0.5, 3);
    for (let i = 0; i < 1000; i += 1) { cpuStep(a, 0.4, 0.05, 0.1); cpuStep(b, 0.4, 0.05, 0.1); }
    let maxDiff = 0;
    for (let i = 0; i < N * N; i += 1) maxDiff = Math.max(maxDiff, Math.abs(a.u[i] - b.u[i]));
    expect(maxDiff).toBe(0);
  });

  it('state finite and bounded after 1000 steps', () => {
    const N = 16;
    const s = makeGrid(N);
    seedImpulse(s, 8, 8, 0.5, 3);
    for (let i = 0; i < 1000; i += 1) cpuStep(s, 0.4, 0.05, 0.1);
    let maxAbs = 0;
    for (let i = 0; i < N * N; i += 1) if (Math.abs(s.u[i]) > maxAbs) maxAbs = Math.abs(s.u[i]);
    expect(maxAbs).toBeLessThan(10);
    expect(maxAbs).toBeGreaterThan(0);
  });

  it('damped energy strictly less than initial after 5000 steps with gamma > 0', () => {
    const N = 32;
    const s = makeGrid(N);
    seedImpulse(s, 16, 16, 1, 4);
    const E0 = totalEnergy(s, 0.5, 1);
    for (let i = 0; i < 5000; i += 1) cpuStep(s, 0.5, 0.1, 0.1);
    expect(totalEnergy(s, 0.5, 1)).toBeLessThan(E0);
  });
});
