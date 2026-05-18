// Standard Model particle data and the additive conservation laws
// (PDG 2024, Navas et al., Phys. Rev. D 110, 030001; Griffiths,
// Introduction to Elementary Particles; Halzen and Martin).
// Masses in MeV/c^2, charge Q in units of e. Quantum numbers:
// Q, baryon B, lepton flavour Le/Lmu/Ltau, spin J.

export const PARTICLES = {
  // quarks (B = 1/3)
  u: { name: 'up',      sym: 'u', m: 2.16,      Q: 2 / 3,  B: 1 / 3, Le: 0, Lmu: 0, Ltau: 0, J: 0.5, type: 'quark',  forces: ['strong', 'em', 'weak'] },
  d: { name: 'down',    sym: 'd', m: 4.70,      Q: -1 / 3, B: 1 / 3, Le: 0, Lmu: 0, Ltau: 0, J: 0.5, type: 'quark',  forces: ['strong', 'em', 'weak'] },
  c: { name: 'charm',   sym: 'c', m: 1270,      Q: 2 / 3,  B: 1 / 3, Le: 0, Lmu: 0, Ltau: 0, J: 0.5, type: 'quark',  forces: ['strong', 'em', 'weak'] },
  s: { name: 'strange', sym: 's', m: 93.5,      Q: -1 / 3, B: 1 / 3, Le: 0, Lmu: 0, Ltau: 0, J: 0.5, type: 'quark',  forces: ['strong', 'em', 'weak'] },
  t: { name: 'top',     sym: 't', m: 172570,    Q: 2 / 3,  B: 1 / 3, Le: 0, Lmu: 0, Ltau: 0, J: 0.5, type: 'quark',  forces: ['strong', 'em', 'weak'] },
  b: { name: 'bottom',  sym: 'b', m: 4183,      Q: -1 / 3, B: 1 / 3, Le: 0, Lmu: 0, Ltau: 0, J: 0.5, type: 'quark',  forces: ['strong', 'em', 'weak'] },
  // charged leptons + neutrinos (L of the flavour = +1)
  e:   { name: 'electron',     sym: 'e',   m: 0.51099895, Q: -1, B: 0, Le: 1, Lmu: 0, Ltau: 0, J: 0.5, type: 'lepton', forces: ['em', 'weak'] },
  mu:  { name: 'muon',         sym: 'mu',  m: 105.6583755, Q: -1, B: 0, Le: 0, Lmu: 1, Ltau: 0, J: 0.5, type: 'lepton', forces: ['em', 'weak'] },
  tau: { name: 'tau',          sym: 'tau', m: 1776.86,     Q: -1, B: 0, Le: 0, Lmu: 0, Ltau: 1, J: 0.5, type: 'lepton', forces: ['em', 'weak'] },
  nue: { name: 'e neutrino',   sym: 'nu_e',  m: 0, Q: 0, B: 0, Le: 1, Lmu: 0, Ltau: 0, J: 0.5, type: 'lepton', forces: ['weak'] },
  num: { name: 'mu neutrino',  sym: 'nu_mu', m: 0, Q: 0, B: 0, Le: 0, Lmu: 1, Ltau: 0, J: 0.5, type: 'lepton', forces: ['weak'] },
  nut: { name: 'tau neutrino', sym: 'nu_tau', m: 0, Q: 0, B: 0, Le: 0, Lmu: 0, Ltau: 1, J: 0.5, type: 'lepton', forces: ['weak'] },
  // gauge bosons + Higgs
  g:     { name: 'gluon',  sym: 'g',  m: 0,      Q: 0,  B: 0, Le: 0, Lmu: 0, Ltau: 0, J: 1, type: 'boson', forces: ['strong'] },
  gamma: { name: 'photon', sym: 'ph', m: 0,      Q: 0,  B: 0, Le: 0, Lmu: 0, Ltau: 0, J: 1, type: 'boson', forces: ['em'] },
  W:     { name: 'W boson', sym: 'W', m: 80369.2, Q: 1, B: 0, Le: 0, Lmu: 0, Ltau: 0, J: 1, type: 'boson', forces: ['weak', 'em'] },
  Z:     { name: 'Z boson', sym: 'Z', m: 91188.0, Q: 0, B: 0, Le: 0, Lmu: 0, Ltau: 0, J: 1, type: 'boson', forces: ['weak'] },
  H:     { name: 'Higgs',  sym: 'H',  m: 125200,  Q: 0, B: 0, Le: 0, Lmu: 0, Ltau: 0, J: 0, type: 'boson', forces: ['weak'] },
  // common hadrons (composite) used by the decay chains
  p:   { name: 'proton',  sym: 'p',   m: 938.27208816, Q: 1, B: 1, Le: 0, Lmu: 0, Ltau: 0, J: 0.5, type: 'hadron', forces: ['strong', 'em', 'weak'] },
  n:   { name: 'neutron', sym: 'n',   m: 939.56542052, Q: 0, B: 1, Le: 0, Lmu: 0, Ltau: 0, J: 0.5, type: 'hadron', forces: ['strong', 'weak'] },
  pip: { name: 'pion +',  sym: 'pi+', m: 139.57039,    Q: 1, B: 0, Le: 0, Lmu: 0, Ltau: 0, J: 0,   type: 'hadron', forces: ['strong', 'em', 'weak'] },
  pi0: { name: 'pion 0',  sym: 'pi0', m: 134.9768,     Q: 0, B: 0, Le: 0, Lmu: 0, Ltau: 0, J: 0,   type: 'hadron', forces: ['strong', 'em'] },
};

// A decay leg references a particle id; anti = true flips Q, B, L.
function qn(leg) {
  const P = PARTICLES[leg.id], s = leg.anti ? -1 : 1;
  return { Q: s * P.Q, B: s * P.B, Le: s * P.Le, Lmu: s * P.Lmu, Ltau: s * P.Ltau, m: P.m };
}

// Sum the additive quantum numbers of a list of legs.
function sumQN(legs) {
  return legs.reduce((a, l) => {
    const q = qn(l);
    return { Q: a.Q + q.Q, B: a.B + q.B, Le: a.Le + q.Le, Lmu: a.Lmu + q.Lmu, Ltau: a.Ltau + q.Ltau, m: a.m + q.m };
  }, { Q: 0, B: 0, Le: 0, Lmu: 0, Ltau: 0, m: 0 });
}

// Conservation check parent -> daughters: each additive number must
// match. Returns per-law booleans, the allowed flag, and the Q-value.
export function checkDecay(parent, daughters) {
  const P = sumQN([parent]), D = sumQN(daughters);
  const eq = (a, b) => Math.abs(a - b) < 1e-9;
  const laws = {
    charge: eq(P.Q, D.Q),
    baryon: eq(P.B, D.B),
    Le: eq(P.Le, D.Le),
    Lmu: eq(P.Lmu, D.Lmu),
    Ltau: eq(P.Ltau, D.Ltau),
  };
  const conserved = Object.values(laws).every(Boolean);
  const Qvalue = PARTICLES[parent.id].m - D.m;          // > 0 if kinematically allowed
  return { laws, conserved, kinematic: Qvalue > 0, Qvalue, allowed: conserved && Qvalue > 0 };
}

// Catalogue of decays (the last one is deliberately forbidden).
export const DECAYS = [
  { name: 'muon decay',      parent: { id: 'mu' },  daughters: [{ id: 'e' }, { id: 'nue', anti: true }, { id: 'num' }] },
  { name: 'neutron beta',    parent: { id: 'n' },   daughters: [{ id: 'p' }, { id: 'e' }, { id: 'nue', anti: true }] },
  { name: 'pion+ -> mu nu',  parent: { id: 'pip' }, daughters: [{ id: 'mu', anti: true }, { id: 'num' }] },
  { name: 'pi0 -> 2 gamma',  parent: { id: 'pi0' }, daughters: [{ id: 'gamma' }, { id: 'gamma' }] },
  { name: 'tau -> mu nu nu', parent: { id: 'tau' }, daughters: [{ id: 'mu' }, { id: 'num', anti: true }, { id: 'nut' }] },
  { name: 'mu -> e gamma (forbidden)', parent: { id: 'mu' }, daughters: [{ id: 'e' }, { id: 'gamma' }] },
];

export function listByType(type) {
  return Object.entries(PARTICLES).filter(([, p]) => p.type === type).map(([id]) => id);
}
export function feelsForce(id, force) { return PARTICLES[id].forces.includes(force); }
