// Eddy-current braking invariant tests: the drag opposes the motion and acts
// only where the field varies, energy is conserved, and the low-resistance
// (solid) plate brakes harder than the slotted one.

import { describe, it, expect } from 'vitest';
import { G, Y_MAG, fieldGrad, createPlate, stepPlate, dragForce } from './sim.js';

describe('Field gradient and drag', () => {
  it('the field gradient vanishes at the band centre and peaks off it', () => {
    expect(fieldGrad(Y_MAG, 1)).toBeCloseTo(0, 9);
    expect(Math.abs(fieldGrad(Y_MAG - 0.4, 1))).toBeGreaterThan(0.1);
    expect(Math.abs(fieldGrad(Y_MAG + 0.4, 1))).toBeGreaterThan(0.1);
  });
  it('the drag opposes the velocity and is zero where the field is flat', () => {
    const p = createPlate(10, Y_MAG - 0.4); p.v = 1.0;
    expect(dragForce(p, 1)).toBeGreaterThan(0);     // positive drag against downward v
    const q = createPlate(10, Y_MAG); q.v = 1.0;
    expect(dragForce(q, 1)).toBeCloseTo(0, 9);      // no gradient at the centre -> no brake
  });
});

describe('Free fall with no field', () => {
  it('with the magnet off the plate falls under gravity alone, v = g t', () => {
    const p = createPlate(10, 0);
    for (let i = 0; i < 1000; i += 1) stepPlate(p, 1e-3, 0);   // B0 = 0
    expect(p.v).toBeCloseTo(G * 1.0, 2);
  });
});

describe('Solid vs slotted', () => {
  it('over the same drop the solid plate exits slower and dumps more heat', () => {
    const solid = createPlate(14, 0), slotted = createPlate(14 / 9, 0);
    const run = (p) => { let i = 0; while (p.y < 3.5 && i < 200000) { stepPlate(p, 1e-3, 1.4); i += 1; } };
    run(solid); run(slotted);                       // both fall the same distance through the band
    expect(solid.v).toBeLessThan(slotted.v);        // the strong brake leaves it slower
    expect(solid.heat).toBeGreaterThan(slotted.heat);
  });
});

describe('Energy conservation', () => {
  it('gravitational work equals kinetic energy gained plus eddy heat', () => {
    const p = createPlate(12, 0);
    const dt = 1e-4;
    for (let i = 0; i < 30000; i += 1) stepPlate(p, dt, 1.3);
    const work = G * p.y;                           // m g * distance fallen, m = 1
    const ke = 0.5 * p.v * p.v;
    expect(work).toBeCloseTo(ke + p.heat, 1);
  });
});
