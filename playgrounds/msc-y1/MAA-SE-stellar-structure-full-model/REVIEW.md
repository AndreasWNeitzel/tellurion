# REVIEW - stellar-structure-full-model (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [high] spec.md is architect placeholder; fill with stellar structure equations (hydrostatic equilibrium, energy balance, mass conservation, radiative/convective transport), boundary conditions, numerical method (shooting to solve coupled ODE system), invariants (mass monotonic, luminosity constant (in steady state), core temperature sufficient for nuclear burning, convection zones satisfy superadiabatic criterion).
2. [medium] README stub; explain stellar interiors (four coupled structure equations), hydrostatic equilibrium, energy transport, what to observe (density/temperature/luminosity profiles), controls (stellar mass, composition if exposed).
3. [medium] index.html figcaption and description minimal.

## Text / approachability
spec and README stubs. User sees density-shaded sphere and internal profiles but no explanation of the four structure equations or their solution method.

## Source-material & equation fidelity
The four stellar structure equations (mass conservation, hydrostatic equilibrium, energy balance, temperature gradient) are correctly implemented. Boundary conditions at center (m=0, L=0) and surface (P->0, T->T_eff) are standard. Reference: Kippenhahn, Weigert, Weiss or Cox & Giuli (stellar structure and evolution).

## Golden-frame observations
Frames show interior density/temperature/luminosity profiles, convection zones indicated, nuclear burning rates in core. Profiles evolve smoothly with stellar mass. No visual defects.

## Hero-candidate
MAYBE (conditional). If the multi-panel visualization is polished (4-6 linked panels: density, temperature, luminosity, opacity, nucleosynthesis rate) and the code solves the full stellar structure system with realistic opacities, consider hero elevation. Gate: four structure equations correct, mass-luminosity relation matches observations, interior profiles physically sound, SSIM>0.92.

## Maintainer notes
Spec, README, figcaption. Stellar structure code solves coupled ODEs correctly. Assess visualization polish for hero candidacy.
