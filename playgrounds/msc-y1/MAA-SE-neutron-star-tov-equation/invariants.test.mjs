import { describe, it, expect } from 'vitest';
import {
  C, MSUN, KM, EPS0, fermiEps, fermiP, fermiRho,
  EOS, tovStar, massRadiusCurve, maxMass,
} from './sim.js';

describe('neutron-star-tov-equation invariants', () => {
  it('the free-neutron Fermi gas reproduces the Oppenheimer-Volkoff maximum mass', () => {
    const mm = maxMass('fermi', 5e16, 5e19, 80);
    expect(Math.abs(mm.Mmax - 0.71) / 0.71).toBeLessThan(0.05);   // 0.71 Msun within 5 percent
    expect(mm.Rat).toBeGreaterThan(8);                            // R ~ 9-10 km
    expect(mm.Rat).toBeLessThan(11);
  });

  it('a softer equation of state gives a lower maximum mass than a stiffer one', () => {
    const soft = maxMass('soft', 1e17, 1e19, 70).Mmax;
    const stiff = maxMass('stiff', 1e17, 1e19, 70).Mmax;
    expect(soft).toBeLessThan(stiff);
    expect(stiff).toBeGreaterThan(2.0);                           // stiff: above the 2 Msun line
    expect(soft).toBeLessThan(2.0);                               // soft: excluded by 2 Msun pulsars
  });

  it('as the central density goes to zero the stellar mass goes to zero', () => {
    for (const eos of ['fermi', 'stiff', 'soft']) {
      const lo = tovStar(eos, 1e15, 30).M / MSUN;
      const mid = tovStar(eos, 1e17, 30).M / MSUN;
      const mm = maxMass(eos, eos === 'fermi' ? 5e16 : 1e17, 5e19, 40).Mmax;
      expect(lo).toBeGreaterThan(0);
      expect(lo).toBeLessThan(mid);                               // M rises with rho_c
      expect(lo).toBeLessThan(0.15 * mm);                         // tiny near zero
    }
  });

  it('the TOV integration yields a finite, terminating star', () => {
    const s = tovStar('fermi', 3e18, 20);
    expect(s.R / KM).toBeGreaterThan(5);
    expect(s.R / KM).toBeLessThan(20);
    expect(s.M / MSUN).toBeGreaterThan(0.5);
    expect(s.Pc).toBeGreaterThan(0);
    expect(s.epsc).toBeGreaterThan(0);
    // mass enclosed equals 4 pi int rho r^2 dr: compactness 2GM/Rc^2 < 1
    const compact = 2 * 6.674e-11 * s.M / (s.R * C * C);
    expect(compact).toBeGreaterThan(0);
    expect(compact).toBeLessThan(1);                              // sub-Schwarzschild
  });

  it('the Fermi-gas EOS has the correct non-relativistic and ultra-relativistic limits', () => {
    // P ~ rho^Gamma: Gamma -> 5/3 as x -> 0, -> 4/3 as x -> inf
    const slope = (x1, x2) => Math.log(fermiP(x2) / fermiP(x1)) / Math.log(fermiRho(x2) / fermiRho(x1));
    expect(slope(1e-3, 2e-3)).toBeCloseTo(5 / 3, 1);
    expect(slope(1e3, 2e3)).toBeCloseTo(4 / 3, 1);
    // positive, monotone
    expect(fermiP(2)).toBeGreaterThan(fermiP(1));
    expect(fermiEps(2)).toBeGreaterThan(fermiEps(1));
    expect(fermiP(0.5)).toBeGreaterThan(0);
    expect(EPS0).toBeGreaterThan(0);
  });

  it('the MIT-bag quark EOS is the linear, self-bound relation eps = 3P + 4B', () => {
    const e1 = EOS.quark.eps(1e34), e2 = EOS.quark.eps(2e34);
    expect((e2 - e1) / (2e34 - 1e34)).toBeCloseTo(3, 9);          // dEps/dP = 3
    expect(EOS.quark.eps(0)).toBeGreaterThan(0);                  // 4B at zero pressure
    const B = EOS.quark.eps(0) / 4;
    expect(EOS.quark.eps(5e34)).toBeCloseTo(3 * 5e34 + 4 * B, 6);
  });

  it('the mass-radius sequence has a stability turning point (maximum mass)', () => {
    const c = massRadiusCurve('fermi', 5e16, 5e19, 60);
    let im = 0;
    for (let i = 1; i < c.M.length; i += 1) if (c.M[i] > c.M[im]) im = i;
    expect(im).toBeGreaterThan(2);
    expect(im).toBeLessThan(c.M.length - 2);                      // turnover is interior
    expect(c.M[0]).toBeLessThan(c.M[im]);                         // rising branch
    expect(c.M[c.M.length - 1]).toBeLessThan(c.M[im]);            // falling branch
    for (const R of c.R) expect(R).toBeGreaterThan(0);
  });

  it('deterministic: identical inputs reproduce the star and the curve', () => {
    const a = tovStar('fermi', 3e18, 25), b = tovStar('fermi', 3e18, 25);
    expect(a.M).toBe(b.M);
    expect(a.R).toBe(b.R);
    expect(maxMass('soft', 1e17, 1e19, 30).Mmax).toBe(maxMass('soft', 1e17, 1e19, 30).Mmax);
  });
});
