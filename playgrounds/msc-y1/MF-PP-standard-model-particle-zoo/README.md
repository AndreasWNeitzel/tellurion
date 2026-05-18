# Standard Model Particle Zoo: PDG Data and Conservation Laws

This playground is the Standard Model on one screen. The top panel is
the particle chart: three generations of quarks and leptons, the gauge
bosons and the Higgs, colour-coded by type. The lower-left panel is
the data card of the highlighted particle (PDG mass, charge, spin,
baryon and lepton numbers, the forces it feels); the lower-right panel
checks a decay against the conservation laws.

The point is which decays nature permits. A decay happens only if
electric charge, baryon number and all three lepton-flavour numbers
balance, and the daughters are lighter than the parent. The muon, the
neutron, the pions and the tau all pass, with their familiar Q-values
(the neutron releases about 0.78 MeV). But muon-to-electron-plus-photon
balances charge yet violates electron and muon flavour, so the checker
marks it forbidden, and proton-to-neutron-plus-pion is forbidden the
other way, by kinematics, because the products are heavier. The force
filter shows another rule of the model: only the quarks and the gluon
feel the strong force; neutrinos feel only the weak.

`force filter` dims the particles that do not feel the chosen
interaction. `decay` selects which decay chain to check (including the
deliberately forbidden one). Reset returns to no filter and muon
decay. Pause/Play stops or resumes the tour that cycles the
highlighted particle, and Copy URL shares the exact state. Every panel
reads without motion for `prefers-reduced-motion`.

## Reference

Primary citation: `pdg2024` (Navas et al., the data and conservation
laws); see also `griffiths-particles` and `halzen-martin`.

## Verification

- Strong invariant: the embedded masses match PDG 2024; every
  catalogued real decay conserves charge, baryon and lepton flavour
  and has a positive Q-value; the forbidden decays are rejected.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
