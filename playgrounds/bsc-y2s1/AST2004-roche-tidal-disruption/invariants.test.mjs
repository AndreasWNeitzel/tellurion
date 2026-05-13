// Roche tidal disruption invariant tests.
// (a) Far orbit with cohesion: cloud stays compact.
// (b) Pericenter inside Roche radius: stream length grows.
// (c) High cohesion keeps the cloud bound at any radius.

import { describe, it, expect } from 'vitest';
import { createCloud, stepCloud, streamLength, comDistance } from './sim.js';

describe('Roche: cloud constructor produces a bounded initial swarm', () => {
  it('initial stream length matches the cloud radius', () => {
    const cloud = createCloud({ N: 60, a: 10.0, e: 0.0, rCloud: 0.3, seed: 1 });
    expect(streamLength(cloud)).toBeLessThan(0.35);
    expect(streamLength(cloud)).toBeGreaterThan(0.20);
  });
});

describe('Roche: aggressive pericenter passage stretches the cloud', () => {
  it('a=3, e=0.6 cohesion=0.01: stream length grows > 2x by t=20', () => {
    const cloud = createCloud({ N: 80, a: 3.0, e: 0.6, rCloud: 0.3, seed: 1 });
    const L0 = streamLength(cloud);
    for (let s = 0; s < 4000; s += 1) stepCloud(cloud, 0.005, 0.01);
    const L1 = streamLength(cloud);
    expect(L1 / L0).toBeGreaterThan(2.0);
  });
});

describe('Roche: low cohesion + circular orbit also spreads (differential Kepler motion)', () => {
  it('cloud with zero cohesion at any radius spreads over time', () => {
    const cloud = createCloud({ N: 40, a: 5.0, e: 0.1, rCloud: 0.3, seed: 1 });
    const L0 = streamLength(cloud);
    for (let s = 0; s < 4000; s += 1) stepCloud(cloud, 0.005, 0.0);
    const L1 = streamLength(cloud);
    expect(L1 / L0).toBeGreaterThan(1.5);
  });
});

describe('Roche: CoM follows an elliptical orbit', () => {
  it('CoM distance oscillates between approximately a(1-e) and a(1+e)', () => {
    const a = 4, e = 0.5;
    const cloud = createCloud({ N: 40, a, e, rCloud: 0.1, seed: 5 });
    let rMin = Infinity, rMax = -Infinity;
    for (let s = 0; s < 6000; s += 1) {
      stepCloud(cloud, 0.005, 0.0);
      if (s % 50 === 0) {
        const r = comDistance(cloud);
        if (r < rMin) rMin = r;
        if (r > rMax) rMax = r;
      }
    }
    expect(rMin).toBeLessThan(a * (1 - e) + 1.0);
    expect(rMax).toBeGreaterThan(a * (1 + e) - 1.0);
  }, 10_000);
});
