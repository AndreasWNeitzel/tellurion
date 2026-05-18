import { describe, it, expect } from 'vitest';
import {
  PARTICLES, checkDecay, DECAYS, listByType, feelsForce,
} from './sim.js';

describe('standard-model-particle-zoo invariants', () => {
  it('the embedded masses match PDG 2024 (MeV)', () => {
    expect(PARTICLES.e.m).toBeCloseTo(0.511, 3);
    expect(PARTICLES.mu.m).toBeCloseTo(105.658, 2);
    expect(PARTICLES.tau.m).toBeCloseTo(1776.86, 1);
    expect(PARTICLES.p.m).toBeCloseTo(938.272, 2);
    expect(PARTICLES.n.m).toBeCloseTo(939.565, 2);
    expect(PARTICLES.W.m / 1000).toBeCloseTo(80.369, 1);   // GeV
    expect(PARTICLES.Z.m / 1000).toBeCloseTo(91.188, 1);
    expect(PARTICLES.H.m / 1000).toBeCloseTo(125.2, 0);
    expect(PARTICLES.t.m / 1000).toBeCloseTo(172.57, 0);
  });

  it('charges and spins follow the Standard Model assignments', () => {
    expect(PARTICLES.u.Q).toBeCloseTo(2 / 3, 9);
    expect(PARTICLES.d.Q).toBeCloseTo(-1 / 3, 9);
    expect(PARTICLES.e.Q).toBe(-1);
    expect(PARTICLES.nue.Q).toBe(0);
    expect(PARTICLES.W.Q).toBe(1);
    for (const q of listByType('quark')) { expect(PARTICLES[q].J).toBe(0.5); expect(PARTICLES[q].B).toBeCloseTo(1 / 3, 9); }
    for (const l of listByType('lepton')) { expect(PARTICLES[l].J).toBe(0.5); expect(PARTICLES[l].B).toBe(0); }
    expect(PARTICLES.gamma.J).toBe(1);
    expect(PARTICLES.H.J).toBe(0);                          // scalar Higgs
  });

  it('every catalogued real decay conserves charge, baryon and lepton-flavour numbers', () => {
    for (const D of DECAYS) {
      if (D.name.includes('forbidden')) continue;
      const r = checkDecay(D.parent, D.daughters);
      expect(r.laws.charge).toBe(true);
      expect(r.laws.baryon).toBe(true);
      expect(r.laws.Le).toBe(true);
      expect(r.laws.Lmu).toBe(true);
      expect(r.laws.Ltau).toBe(true);
      expect(r.conserved).toBe(true);
    }
  });

  it('the catalogued real decays are kinematically allowed (Q-value > 0)', () => {
    for (const D of DECAYS) {
      if (D.name.includes('forbidden')) continue;
      const r = checkDecay(D.parent, D.daughters);
      expect(r.Qvalue).toBeGreaterThan(0);
      expect(r.allowed).toBe(true);
    }
    // neutron beta decay Q-value ~ 0.782 MeV (a famous number)
    const nb = checkDecay({ id: 'n' }, [{ id: 'p' }, { id: 'e' }, { id: 'nue', anti: true }]);
    expect(nb.Qvalue).toBeCloseTo(0.782, 1);
  });

  it('the lepton-flavour-violating mu -> e gamma is rejected', () => {
    const r = checkDecay({ id: 'mu' }, [{ id: 'e' }, { id: 'gamma' }]);
    expect(r.laws.charge).toBe(true);                       // charge still balances
    expect(r.laws.Le).toBe(false);                          // L_e violated
    expect(r.laws.Lmu).toBe(false);                         // L_mu violated
    expect(r.conserved).toBe(false);
    expect(r.allowed).toBe(false);
  });

  it('a kinematically forbidden decay (p -> n pi+) is rejected despite balanced charges', () => {
    const r = checkDecay({ id: 'p' }, [{ id: 'n' }, { id: 'pip' }]);
    expect(r.laws.charge).toBe(true);
    expect(r.laws.baryon).toBe(true);
    expect(r.kinematic).toBe(false);                        // products heavier than the proton
    expect(r.Qvalue).toBeLessThan(0);
    expect(r.allowed).toBe(false);
  });

  it('forces: leptons feel no strong force, neutrinos only weak', () => {
    expect(feelsForce('e', 'strong')).toBe(false);
    expect(feelsForce('e', 'em')).toBe(true);
    expect(feelsForce('nue', 'em')).toBe(false);
    expect(feelsForce('nue', 'weak')).toBe(true);
    expect(feelsForce('u', 'strong')).toBe(true);
    expect(feelsForce('gamma', 'em')).toBe(true);
  });

  it('deterministic: identical inputs reproduce the conservation check', () => {
    const a = checkDecay({ id: 'mu' }, [{ id: 'e' }, { id: 'nue', anti: true }, { id: 'num' }]);
    const b = checkDecay({ id: 'mu' }, [{ id: 'e' }, { id: 'nue', anti: true }, { id: 'num' }]);
    expect(a.Qvalue).toBe(b.Qvalue);
    expect(a.allowed).toBe(b.allowed);
  });
});
