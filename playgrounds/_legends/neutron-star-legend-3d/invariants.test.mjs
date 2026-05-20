import { describe, it, expect } from 'vitest';
import {
  schwarzschildRadius_m, compactness,
  pulsePhase, pulseIntensity, beamHalfAngle_rad,
  spindownPower_W, spindownPdot_SperS, characteristicAge_yr,
  massRadiusCurve_SLy, massRadiusCurve_APR, massRadiusCurve_FPS,
  radiusFromMass_km, NS_LAYERS,
  magnetarLightcurve, magnetarPeakLuminosity_ergS,
  applyGlitch,
} from './sim.js';

const G = 6.6743e-11;
const C = 2.998e8;
const M_SUN = 1.989e30;

describe('neutron-star-legend-3d', () => {
  it('Schwarzschild radius of 1.4 M_sun is ~4.13 km', () => {
    const Rs = schwarzschildRadius_m(1.4);
    expect(Rs / 1000).toBeCloseTo(4.13, 1);
  });

  it('Compactness of typical NS (1.4 M_sun, R = 12 km) is ~0.35', () => {
    const c = compactness(1.4, 12e3);
    expect(c).toBeGreaterThan(0.30);
    expect(c).toBeLessThan(0.40);
  });

  it('Pulse intensity is maximised when alpha = beta and phi = 0', () => {
    const alpha = 30 * Math.PI / 180;
    const beta = 30 * Math.PI / 180;
    const I_max = pulseIntensity(alpha, beta, 0, 10 * Math.PI / 180);
    for (const phi of [0.5, 1.0, 1.5, 2.0, 2.5]) {
      const I = pulseIntensity(alpha, beta, phi, 10 * Math.PI / 180);
      expect(I).toBeLessThanOrEqual(I_max + 1e-6);
    }
  });

  it('Aligned rotator (alpha = 0) gives constant pulse intensity', () => {
    const beta = 45 * Math.PI / 180;
    const rho = 10 * Math.PI / 180;
    const I0 = pulseIntensity(0, beta, 0, rho);
    for (const phi of [0.1, 0.5, 1.0, 2.0, 5.0]) {
      const I = pulseIntensity(0, beta, phi, rho);
      expect(I).toBeCloseTo(I0, 6);
    }
  });

  it('Pulse phase formula is symmetric: phi -> -phi gives same intensity', () => {
    const alpha = 40 * Math.PI / 180;
    const beta = 35 * Math.PI / 180;
    const rho = 8 * Math.PI / 180;
    for (const phi of [0.3, 1.1, 2.5]) {
      const I_plus = pulseIntensity(alpha, beta, phi, rho);
      const I_minus = pulseIntensity(alpha, beta, -phi, rho);
      expect(I_minus).toBeCloseTo(I_plus, 6);
    }
  });

  it('Beam half-angle scales as sqrt(P): 1 s gives 6 deg, 4 s gives ~12 deg', () => {
    const rho1 = beamHalfAngle_rad(1) / (Math.PI / 180);
    const rho4 = beamHalfAngle_rad(4) / (Math.PI / 180);
    expect(rho1).toBeCloseTo(6, 0);
    expect(rho4).toBeCloseTo(12, 0);
  });

  it('Spindown power scales as B^2 (other params fixed)', () => {
    const P1 = spindownPower_W(1e8, 1.2e4, 1.0, Math.PI / 2);
    const P2 = spindownPower_W(2e8, 1.2e4, 1.0, Math.PI / 2);
    expect(P2 / P1).toBeCloseTo(4, 3);
  });

  it('Spindown power scales as omega^4 (i.e., P^-4)', () => {
    const P1 = spindownPower_W(1e8, 1.2e4, 1.0, Math.PI / 2);
    const P2 = spindownPower_W(1e8, 1.2e4, 0.5, Math.PI / 2);
    expect(P2 / P1).toBeCloseTo(16, 3);
  });

  it('Aligned rotator (alpha = 0) has zero spindown', () => {
    const P_dot = spindownPdot_SperS(1.4, 1.2e4, 1e8, 0.033, 0);
    expect(Math.abs(P_dot)).toBeLessThan(1e-30);
  });

  it('Crab pulsar (P = 33 ms, B = 4e12 G) has reasonable spindown', () => {
    const B_T_crab = 4e12 * 1e-4;     // T
    const P_dot = spindownPdot_SperS(1.4, 1.2e4, B_T_crab, 0.033, Math.PI / 3);
    // Observed Crab Pdot ~ 4.2e-13 s/s; order of magnitude check is fine.
    expect(P_dot).toBeGreaterThan(1e-14);
    expect(P_dot).toBeLessThan(1e-11);
  });

  it('Characteristic age formula: tau = P / (2 Pdot)', () => {
    const P_s = 1.0;
    const P_dot = 1e-14;
    const tau = characteristicAge_yr(P_s, P_dot);
    // P/(2 P_dot) = 5e13 s = ~1.584e6 yr (3.156e7 s/yr).
    expect(tau).toBeGreaterThan(1.5e6);
    expect(tau).toBeLessThan(1.7e6);
  });

  it('Mass-radius curves: SLy peak mass is ~2 Msun', () => {
    const curve = massRadiusCurve_SLy();
    const Mmax = curve.reduce((m, p) => Math.max(m, p.M), 0);
    expect(Mmax).toBeGreaterThan(1.9);
    expect(Mmax).toBeLessThan(2.2);
  });

  it('APR is stiffer than SLy: higher peak mass', () => {
    const cSLy = massRadiusCurve_SLy();
    const cAPR = massRadiusCurve_APR();
    const MmaxSLy = cSLy.reduce((m, p) => Math.max(m, p.M), 0);
    const MmaxAPR = cAPR.reduce((m, p) => Math.max(m, p.M), 0);
    expect(MmaxAPR).toBeGreaterThan(MmaxSLy);
  });

  it('FPS is softer than SLy: lower peak mass', () => {
    const cSLy = massRadiusCurve_SLy();
    const cFPS = massRadiusCurve_FPS();
    const MmaxSLy = cSLy.reduce((m, p) => Math.max(m, p.M), 0);
    const MmaxFPS = cFPS.reduce((m, p) => Math.max(m, p.M), 0);
    expect(MmaxFPS).toBeLessThan(MmaxSLy);
  });

  it('Radius lookup: 1.4 Msun on SLy ~ 11-12 km', () => {
    const R = radiusFromMass_km(1.4, massRadiusCurve_SLy());
    expect(R).toBeGreaterThan(10);
    expect(R).toBeLessThan(13);
  });

  it('NS_LAYERS partition [0, 1] R into 4 strata', () => {
    expect(NS_LAYERS.length).toBe(4);
    expect(NS_LAYERS[NS_LAYERS.length - 1].r0).toBe(0);
    expect(NS_LAYERS[0].r1).toBe(1);
  });

  it('Magnetar lightcurve is zero before t = 0', () => {
    expect(magnetarLightcurve(-1, 0.05, 0.6)).toBe(0);
  });

  it('Magnetar lightcurve peaks and decays', () => {
    const L = [];
    for (let t = 0; t <= 3; t += 0.05) L.push(magnetarLightcurve(t, 0.05, 0.6));
    const peakIdx = L.indexOf(Math.max(...L));
    // Peak should be very early (within ~ 0.5 s of t = 0).
    expect(peakIdx * 0.05).toBeLessThan(0.5);
    // L at end should be below peak.
    expect(L[L.length - 1]).toBeLessThan(L[peakIdx]);
  });

  it('Magnetar peak luminosity scales as B^2', () => {
    const L1 = magnetarPeakLuminosity_ergS(1e10);
    const L2 = magnetarPeakLuminosity_ergS(2e10);
    expect(L2 / L1).toBeCloseTo(4, 3);
  });

  it('Glitch event: P drops by exactly Delta Omega / Omega', () => {
    const P_pre = 0.033;     // 33 ms
    const dOmega = 1e-6;
    const P_post = applyGlitch(P_pre, dOmega, 0, 1e6);
    // At t = 0: dP/P = -dOmega/Omega = -1e-6.
    expect((P_post - P_pre) / P_pre).toBeCloseTo(-1e-6, 9);
  });

  it('Glitch event: partial recovery is partial', () => {
    const P_pre = 0.033;
    const dOmega = 1e-6;
    const t_long = 1e7;     // long after recovery
    const P_recovered = applyGlitch(P_pre, dOmega, t_long, 1e6);
    // At t -> infinity, recovery Q = 0.4, so dP/P = -dOmega * (1 - 0.4) = -0.6 dOmega.
    expect((P_recovered - P_pre) / P_pre).toBeCloseTo(-0.6e-6, 9);
  });
});
