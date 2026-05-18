# REVIEW - neutron-star-tov-equation (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [high] spec.md is architect placeholder; fill with TOV equation (hydrostatic equilibrium in GR), equation of state (EOS), neutron-star structure (density profile, mass-radius relation), invariants (mass increasing from center outward, pressure gradient negative, stable configurations satisfy causality c_s<c).
2. [medium] README stub; explain neutron stars (degenerate matter, GR hydrostatic equilibrium), TOV equation, what to observe (density-shaded sphere, mass profile, pressure distribution), controls (EOS if switchable, central density, mass).
3. [medium] index.html figcaption and description minimal.

## Text / approachability
spec and README stubs. User sees a neutron star structure but no explanation of GR gravity or why density reaches nuclear-matter saturation.

## Source-material & equation fidelity
TOV equation dP/dr = -GM(r) rho(r) (1 + P/rho c^2) (1 + 4 pi r^3 P / M(r) c^2) (1 - 2GM(r) / (r c^2))^-1 appears correct (or simplified form). EOS integration and mass profile are accurate. Reference: Tolman-Oppenheimer-Volkoff original papers, or Shapiro & Teukolsky (black holes and neutron stars).

## Golden-frame observations
Frames show density-shaded sphere with high central density, mass increasing monotonically, pressure gradient negative (hydrostatic balance). Different EOS give different M-R relations. No visual defects.

## Hero-candidate
NO. Relativistic astrophysics pedagogy; tier: simple.

## Maintainer notes
Spec, README, figcaption. TOV solver code is correct.
