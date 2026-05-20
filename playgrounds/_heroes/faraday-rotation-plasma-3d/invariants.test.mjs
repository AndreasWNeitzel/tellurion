import { describe, it, expect } from 'vitest';
import {
  rotationMeasure, rotationAngle, rotationAngleDeg,
  polarizationAlongPath, PRESET_WAVELENGTHS, KNOWN_SOURCES,
  RM_COEFF_CGS,
} from './sim.js';

describe('faraday-rotation-plasma-3d', () => {
  it('RM coefficient is 8.12e5 rad m^-2 per (cm^-3 G pc)', () => {
    expect(RM_COEFF_CGS).toBeCloseTo(8.12e5, -4);
  });

  it('RM scales linearly with B_par', () => {
    const RM1 = rotationMeasure(1e-6, 0.03, 1000);
    const RM2 = rotationMeasure(2e-6, 0.03, 1000);
    expect(RM2 / RM1).toBeCloseTo(2, 6);
  });

  it('RM scales linearly with n_e', () => {
    const RM1 = rotationMeasure(3e-6, 0.01, 1000);
    const RM2 = rotationMeasure(3e-6, 0.04, 1000);
    expect(RM2 / RM1).toBeCloseTo(4, 6);
  });

  it('RM scales linearly with path length', () => {
    const RM1 = rotationMeasure(3e-6, 0.03, 100);
    const RM2 = rotationMeasure(3e-6, 0.03, 1000);
    expect(RM2 / RM1).toBeCloseTo(10, 6);
  });

  it('Galactic pulsar canonical: n_e = 0.03, B = 3e-6, L = 1000 -> RM ~ 73', () => {
    const RM = rotationMeasure(3e-6, 0.03, 1000);
    expect(RM).toBeGreaterThan(60);
    expect(RM).toBeLessThan(90);
  });

  it('rotation angle scales as lambda^2', () => {
    const RM = 100;
    const chi1 = rotationAngle(RM, 0.1);
    const chi2 = rotationAngle(RM, 0.2);
    expect(chi2 / chi1).toBeCloseTo(4, 6);
  });

  it('chi at 21 cm with RM = 73 rad/m^2 is ~ 3.22 rad ~ 184 deg', () => {
    const chi = rotationAngleDeg(73, 0.21);
    expect(chi).toBeGreaterThan(180);
    expect(chi).toBeLessThan(190);
  });

  it('zero RM gives zero rotation', () => {
    expect(rotationAngle(0, 0.21)).toBe(0);
  });

  it('zero wavelength gives zero rotation', () => {
    expect(rotationAngle(100, 0)).toBe(0);
  });

  it('polarization-along-path samples have correct endpoints', () => {
    const arr = polarizationAlongPath(11, 100, 0.21, 0);
    expect(arr[0]).toBe(0);
    expect(arr[arr.length - 1]).toBeCloseTo(rotationAngle(100, 0.21), 9);
  });

  it('polarization-along-path is linearly interpolated', () => {
    const arr = polarizationAlongPath(11, 100, 0.21, 0);
    const total = rotationAngle(100, 0.21);
    for (let i = 0; i < arr.length; i++) {
      const expected = (i / (arr.length - 1)) * total;
      expect(arr[i]).toBeCloseTo(expected, 9);
    }
  });

  it('known source preset list contains Galactic pulsar', () => {
    const p = KNOWN_SOURCES.find(s => s.name === 'Galactic pulsar');
    expect(p).toBeDefined();
    expect(p.RM).toBeGreaterThan(50);
  });

  it('Sgr A* RM is much larger than Galactic pulsar RM', () => {
    const pulsar = KNOWN_SOURCES.find(s => s.name === 'Galactic pulsar');
    const sgr = KNOWN_SOURCES.find(s => s.name === 'Sgr A* probe');
    expect(sgr.RM / pulsar.RM).toBeGreaterThan(1000);
  });

  it('preset wavelengths span L through X band (3 to 21 cm)', () => {
    expect(PRESET_WAVELENGTHS.L_band).toBeCloseTo(0.21, 3);
    expect(PRESET_WAVELENGTHS.X_band).toBeCloseTo(0.03, 3);
  });

  it('rotation angle in degrees agrees with radians * 180 / pi', () => {
    expect(rotationAngleDeg(100, 0.21)).toBeCloseTo(rotationAngle(100, 0.21) * 180 / Math.PI, 6);
  });
});
