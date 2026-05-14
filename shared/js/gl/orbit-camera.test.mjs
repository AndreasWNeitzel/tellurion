import { describe, it, expect } from 'vitest';
import { createOrbitCamera } from './orbit-camera.js';

function fakeCanvas() {
  const handlers = {};
  return {
    width: 800, height: 600, clientWidth: 800, clientHeight: 600,
    addEventListener(t, cb) { handlers[t] = cb; },
    removeEventListener() {},
    setPointerCapture() {},
    classList: { add() {}, remove() {} },
  };
}

describe('orbit-camera', () => {
  it('drag +dx rotates azimuth by the expected sign', () => {
    const cam = createOrbitCamera(fakeCanvas(), { azimuthDeg: 45, elevationDeg: 30, radius: 5 });
    const before = cam.state.azimuthDeg;
    cam._dispatchDrag(120, 0);
    const after = cam.state.azimuthDeg;
    expect(after).toBeGreaterThan(before);
    // Magnitude approx: 120 px * 0.4 deg/px = 48 deg (azimuthRateDps default 1.0).
    expect(after - before).toBeCloseTo(48, 0);
  });

  it('elevation clamps at +/- 89', () => {
    const cam = createOrbitCamera(fakeCanvas(), { elevationDeg: 80 });
    cam._dispatchDrag(0, -10000);
    expect(cam.state.elevationDeg).toBeLessThanOrEqual(89);
    expect(cam.state.elevationDeg).toBeGreaterThanOrEqual(-89);
  });

  it('wheel zooms within clamp', () => {
    const cam = createOrbitCamera(fakeCanvas(), { radius: 10, minRadius: 2, maxRadius: 50 });
    cam._dispatchWheel(2000);
    expect(cam.state.radius).toBeGreaterThan(10);
    cam._dispatchWheel(-100000);
    expect(cam.state.radius).toBeGreaterThanOrEqual(2);
  });

  it('screenToRay at canvas center points at target', () => {
    const cam = createOrbitCamera(fakeCanvas(), { target: [0, 0, 0], radius: 5, azimuthDeg: 0, elevationDeg: 0 });
    const ray = cam.screenToRay(400, 300);
    // Ray from eye = (5, 0, 0) should point toward (0, 0, 0): dir x ~ -1.
    expect(ray.dir[0]).toBeLessThan(-0.95);
    expect(Math.abs(ray.dir[1])).toBeLessThan(0.05);
    expect(Math.abs(ray.dir[2])).toBeLessThan(0.05);
  });

  it('screenToRay at an offset matches a hand-computed ray', () => {
    const cam = createOrbitCamera(fakeCanvas(), { target: [0, 0, 0], radius: 5, azimuthDeg: 0, elevationDeg: 0 });
    const ray = cam.screenToRay(700, 300);  // far right of canvas
    // Camera forward = (-1, 0, 0), right = (0, 0, -1). Right of screen = world -z.
    expect(ray.dir[2]).toBeLessThan(-0.05);
    // Still primarily pointed at the BH (negative x).
    expect(ray.dir[0]).toBeLessThan(-0.6);
  });
});
