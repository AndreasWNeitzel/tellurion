import { describe, it, expect } from 'vitest';
import {
  G, MSUN, RSUN, DAY, eggletonRL, fracs, rochePotential,
  lagrangePoints, criticalPotential, keplerPeriod, orbitalJ,
  conservativeTransfer, zetaLobe, classify, equipotentialRing,
} from './sim.js';

describe('binary-star-mass-transfer invariants', () => {
  it('the Eggleton (1983) Roche-lobe radius matches the formula and references', () => {
    // exact reproduction of the published fitting formula
    const ref = (q) => 0.49 * q ** (2 / 3) / (0.6 * q ** (2 / 3) + Math.log(1 + q ** (1 / 3)));
    for (const q of [0.05, 0.2, 1, 3, 12]) expect(eggletonRL(q)).toBeCloseTo(ref(q), 12);
    // equal-mass value and Eggleton's better-than-1-percent accuracy
    expect(eggletonRL(1)).toBeGreaterThan(0.378);
    expect(eggletonRL(1)).toBeLessThan(0.380);
    expect(Math.abs(eggletonRL(1) / 0.3789 - 1)).toBeLessThan(0.005);
    // monotone increasing in q, bounded in (0, 1)
    expect(eggletonRL(0.5)).toBeLessThan(eggletonRL(1));
    expect(eggletonRL(1)).toBeLessThan(eggletonRL(2));
    expect(eggletonRL(1e-4)).toBeGreaterThan(0);
    expect(eggletonRL(1e4)).toBeLessThan(1);
  });

  it('conservative mass transfer conserves total mass and angular momentum', () => {
    const M1 = 2 * MSUN, M2 = 1 * MSUN, a = 5 * RSUN;
    const J0 = orbitalJ(M1, M2, a);
    const t = conservativeTransfer(M1, M2, a, 0.1 * MSUN);
    expect((t.M1 + t.M2) / (M1 + M2)).toBeCloseTo(1, 12);   // total mass fixed
    expect(Math.abs(t.J / J0 - 1)).toBeLessThan(0.01);       // J conserved within 1 percent
    expect(t.J / J0).toBeCloseTo(1, 6);                      // (exact by construction)
    // a ~ (M1 M2)^-2 at fixed Mtot and J
    const an = a * ((M1 * M2) / (t.M1 * t.M2)) ** 2;
    expect(t.a).toBeCloseTo(an, 6);
  });

  it('mass transfer shrinks the orbit from the more massive star, widens it from the less', () => {
    const a = 4 * RSUN;
    const hi = conservativeTransfer(2 * MSUN, 1 * MSUN, a, 0.05 * MSUN); // donor heavier
    const lo = conservativeTransfer(1 * MSUN, 2 * MSUN, a, 0.05 * MSUN); // donor lighter
    expect(hi.dlnA).toBeLessThan(0);                         // orbit shrinks
    expect(lo.dlnA).toBeGreaterThan(0);                      // orbit widens
    expect(hi.a).toBeLessThan(a);
    expect(lo.a).toBeGreaterThan(a);
  });

  it('Kepler third law: P^2 proportional to a^3', () => {
    const Mt = 3 * MSUN;
    const P1 = keplerPeriod(Mt, 3 * RSUN), P2 = keplerPeriod(Mt, 12 * RSUN);
    expect((P2 / P1) ** 2).toBeCloseTo((12 / 3) ** 3, 6);    // a x4 -> P x8
    expect(keplerPeriod(Mt, 5 * RSUN)).toBeGreaterThan(0);
    // explicit value: 2 pi sqrt(a^3 / G Mt)
    const a = 5 * RSUN;
    expect(keplerPeriod(Mt, a)).toBeCloseTo(2 * Math.PI * Math.sqrt(a ** 3 / (G * Mt)), 3);
  });

  it('L1 is a stationary saddle between the stars; L4/L5 are equilateral', () => {
    const M1 = 2 * MSUN, M2 = 1 * MSUN;
    const { x1, x2 } = fracs(M1, M2);
    const lp = lagrangePoints(M1, M2);
    expect(lp.L1[0]).toBeGreaterThan(x1);
    expect(lp.L1[0]).toBeLessThan(x2);
    expect(lp.L3[0]).toBeLessThan(x1);                       // beyond the primary
    expect(lp.L2[0]).toBeGreaterThan(x2);                    // beyond the secondary
    // dPhi/dx ~ 0 at L1 (numerical gradient)
    const eps = 1e-6, ph = (x) => rochePotential(x, 0, M1, M2);
    expect(Math.abs((ph(lp.L1[0] + eps) - ph(lp.L1[0] - eps)) / (2 * eps))).toBeLessThan(1e-3);
    // L4 / L5 are unit-distance (a) from both masses, exactly
    for (const L of [lp.L4, lp.L5]) {
      expect(Math.hypot(L[0] - x1, L[1])).toBeCloseTo(1, 9);
      expect(Math.hypot(L[0] - x2, L[1])).toBeCloseTo(1, 9);
    }
    // Roche potential symmetric in y
    expect(rochePotential(0.1, 0.3, M1, M2)).toBeCloseTo(rochePotential(0.1, -0.3, M1, M2), 12);
  });

  it('the critical equipotential passes through L1 and bounds the lobe', () => {
    const M1 = 1.5 * MSUN, M2 = 0.8 * MSUN;
    const lp = lagrangePoints(M1, M2);
    const phiC = criticalPotential(M1, M2);
    expect(phiC).toBeCloseTo(rochePotential(lp.L1[0], 0, M1, M2), 12);
    // a slightly deeper potential lies inside L1 on the donor side
    const { x1 } = fracs(M1, M2);
    expect(rochePotential(0.5 * (x1 + lp.L1[0]), 0, M1, M2)).toBeLessThan(phiC);
    const ring = equipotentialRing(M1, M2, phiC - 0.05, x1, 120, 2); // just inside the lobe
    let finite = 0;
    for (let i = 0; i < ring.xs.length; i += 1) if (Number.isFinite(ring.xs[i])) finite += 1;
    expect(finite).toBeGreaterThan(60);                      // a closed lobe contour exists
  });

  it('the Roche-lobe response exponent and the stability classification are consistent', () => {
    const M1 = 2 * MSUN, M2 = 1 * MSUN, a = 5 * RSUN;
    const RL = a * eggletonRL(M1 / M2);
    expect(zetaLobe(M1, M2, a)).toBeGreaterThan(0);          // q>1: lobe shrinks as donor loses mass
    expect(classify(M1, M2, a, 0.4 * RL, 0.6).state).toBe('detached');
    expect(classify(M1, M2, a, RL, 10).state).toBe('stable transfer');     // stiff star
    expect(classify(M1, M2, a, RL, -1).state).toBe('common envelope');     // soft star, unstable
  });

  it('deterministic: identical inputs reproduce the geometry and transfer', () => {
    expect(eggletonRL(0.37)).toBe(eggletonRL(0.37));
    const a = conservativeTransfer(2 * MSUN, MSUN, 5 * RSUN, 0.1 * MSUN);
    const b = conservativeTransfer(2 * MSUN, MSUN, 5 * RSUN, 0.1 * MSUN);
    expect(a.a).toBe(b.a);
    expect(a.P).toBe(b.P);
    expect(lagrangePoints(2 * MSUN, MSUN).L1[0]).toBe(lagrangePoints(2 * MSUN, MSUN).L1[0]);
  });
});
