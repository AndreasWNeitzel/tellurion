---
title: Standard Model Particle Zoo: PDG Data and Conservation Laws
slug: standard-model-particle-zoo
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MF-PP
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: pdg2024
hook: 'Six quarks, six leptons, the gauge bosons and the Higgs, with their PDG masses, charges and spins on one chart, and a decay checker that confirms which decays nature allows: electric charge, baryon number and lepton flavour must all balance, and the products must be lighter than the parent.'
one_paragraph: 'An interactive Standard Model reference and conservation-law checker (PDG 2024, Navas et al.; Griffiths, Introduction to Elementary Particles; Halzen and Martin). The chart lays out the three generations of quarks and leptons, the gauge bosons and the Higgs, coloured by type, with the PDG mass, charge, spin, baryon and lepton numbers and the forces each feels; a force filter dims the particles that do not feel a chosen interaction. The decay panel takes a parent and its daughters and checks the additive conservation laws (electric charge, baryon number, the three lepton-flavour numbers) and the kinematic Q-value, so the allowed decays (muon, neutron beta, charged-pion, neutral-pion, tau) pass while the lepton-flavour-violating mu -> e gamma and the kinematically forbidden p -> n pi+ are rejected. Every catalogued real decay conserves charge, baryon number and lepton flavour with a positive Q-value (neutron beta about 0.782 MeV), while the lepton-flavour-violating mu -> e gamma and the kinematically forbidden p -> n pi+ are correctly rejected, and leptons feel no strong force. Reference: Griffiths, Introduction to Elementary Particles, Chapters 1 and 9; PDG 2024.'
tags: [particle-physics, standard-model, conservation-laws, pdg, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [force, decay]
---

# Standard Model Particle Zoo: PDG Data and Conservation Laws

## Explainer

### What you are looking at

Every known elementary particle and every force except gravity fits
into one compact table, the Standard Model. The playground is that
table made interactive: it shows the matter fermions, the force
carriers, the Higgs, and, crucially, which decays are allowed by the
conservation laws and which are forbidden.

### The contents

The matter content is three generations of fermions:

- 6 quarks (up/down, charm/strange, top/bottom), which feel the
  strong force and carry color charge,
- 6 leptons (electron, muon, tau and their neutrinos).

Interactions are mediated by gauge bosons: the photon
(electromagnetism), $W^\pm$ and $Z$ (weak), eight gluons (strong),
plus the Higgs boson, whose field gives the others mass through
electroweak symmetry breaking. The gauge structure is the group
$\mathrm{SU(3)}_C\times\mathrm{SU(2)}_L\times\mathrm{U(1)}_Y$.

### What decides whether a decay happens

Whether a particle can decay to a given final state is fixed by
conservation laws, which the playground checks for you:

- Always conserved: energy-momentum, electric charge $Q$, color,
  baryon number $B$, and each lepton flavor number
  ($L_e,L_\mu,L_\tau$).
- The decay rate scales with available phase space and the relevant
  coupling: strong decays are fast ($10^{-23}$ s), electromagnetic
  intermediate, weak decays slow (long lifetimes), which is why the
  weak force, despite being "weak", is what lets heavy quarks and the
  muon decay at all.

So a muon must decay as $\mu^-\to e^-\bar\nu_e\nu_\mu$ (lepton
numbers balanced) and never $\mu^-\to e^-\gamma$ (would violate
flavor); a proton is stable because baryon number plus energy
forbids any lighter $B=1$ state. The playground lets you pick a
particle and a candidate decay and shows which conservation law
permits or vetoes it, with PDG masses and lifetimes.

### Things to try

- Select the muon and test $e^-\bar\nu_e\nu_\mu$ (allowed) versus
  $e^-\gamma$ (forbidden by lepton flavor).
- Compare lifetimes across the strong/EM/weak hierarchy (23 orders
  of magnitude).
- Check why the proton and the lightest neutrino are stable (no
  lighter state conserving all charges).

### Where this comes from

The Standard Model content, gauge structure, and conservation laws
follow Griffiths, *Introduction to Elementary Particles*, and the
Particle Data Group, *Review of Particle Physics* (2024).

## Physical setup

The Standard Model has twelve matter fermions (six quarks and six
leptons in three generations), four gauge bosons and the Higgs. Each
carries fixed quantum numbers; a decay is permitted only if every
additive number (electric charge, baryon number, the three
lepton-flavour numbers) is conserved and the products are lighter
than the parent.

## Governing equations

Additive conservation (Griffiths; Halzen and Martin): for a decay
`A -> sum_i B_i`,

```math
Q_A = \sum_i Q_i,\quad B_A = \sum_i B_i,\quad
L^A_\ell = \sum_i L^{i}_\ell\ (\ell = e,\mu,\tau),
```

and kinematics requires the Q-value
`m_A - \sum_i m_i > 0`. Quarks carry `B = 1/3`; leptons carry the
lepton-flavour number of their generation; antiparticles flip the
sign of all additive numbers.

## Numerical method

The particle table holds PDG 2024 central values (masses in MeV,
charges in units of e, spins, baryon and lepton numbers, the forces
felt). The checker sums the daughters' additive numbers, compares
them to the parent and computes the Q-value. Everything is static
data; a sweep cycles the highlighted particle through the zoo. The
capture path maps capture fraction directly to that index, so
reference frames are reproducible and frame-rate independent.
Deterministic, no RNG.

## Controls

- `force filter` (share key `force`): dim the particles that do not
  feel the strong / electromagnetic / weak force.
- `decay` (share key `decay`): which decay chain to check (including
  the deliberately forbidden mu -> e gamma).
- Reset (no filter, muon decay), Pause/Play (the particle tour), Copy
  URL.

## Expected qualitative features

- The chart is the canonical 3-generation layout, colour-coded
  (quarks, leptons, bosons), Higgs apart.
- The card shows correct PDG mass / charge / spin / lepton numbers /
  forces for the selected particle.
- Allowed decays show every law conserved and a positive Q-value
  ("DECAY ALLOWED"); the forbidden ones show the violated law in red.
- The strong filter leaves only quarks and the gluon bright.

## Invariants and acceptance thresholds

Checked offline in `invariants.test.mjs` (8 tests):

1. The embedded masses match PDG 2024 (e, mu, tau, p, n, W, Z, H, t).
2. Standard Model charge and spin assignments
   (up `+2/3`, down `-1/3`, lepton `-1`, neutrino `0`; fermions
   `J=1/2`, gauge `J=1`, Higgs `J=0`).
3. Every catalogued real decay conserves charge, baryon and
   lepton-flavour numbers.
4. Those decays have a positive Q-value (neutron beta ~ 0.782 MeV).
5. The lepton-flavour-violating `mu -> e gamma` is rejected.
6. The kinematically forbidden `p -> n pi+` is rejected despite
   balanced charges.
7. Force assignments: leptons feel no strong force, neutrinos only
   weak.
8. Determinism.

## Limiting cases for verification

- Charge-balanced but flavour-violating (`mu -> e gamma`): rejected
  (test 5).
- Quantum-number-balanced but heavy products (`p -> n pi+`): rejected
  (test 6).
- Neutrino interactions: weak only (test 7).
- Antiparticles flip all additive numbers (used by every real decay,
  test 3).

## Visual fallback

Static three-panel Canvas2D: the chart, the card and the decay table
are fully informative without animation; only the highlighted
particle cycles.

## Citations

- Navas, S. et al. (Particle Data Group), Phys. Rev. D 110, 030001
  (2024). `pdg2024`.
- Griffiths, D. J., *Introduction to Elementary Particles*.
  `griffiths-particles`.
- Halzen, F. and Martin, A. D., *Quarks and Leptons*.
  `halzen-martin`.

## Stretch goals

- Branching ratios and the partial widths from the PDG.
- Strangeness / charm and the (approximate) flavour conservation in
  strong vs weak decays.
- A full multi-step decay-chain animator (cascade hyperons).

## Risk register

- Hadrons (p, n, pi) are included as composite states for the decay
  chains; their quantum numbers are the measured PDG values, not
  re-derived from constituent quarks (stated; the conservation gates
  use the measured numbers).
- Neutrino masses are set to zero (sub-eV, irrelevant to the MeV-scale
  Q-values tested).
- ASCII particle symbols (`nu_e`, `pi+`, `ph`) are used per the
  project no-glyph rule; the names disambiguate.
