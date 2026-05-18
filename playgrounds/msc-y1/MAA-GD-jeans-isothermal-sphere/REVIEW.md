# REVIEW - jeans-isothermal-sphere (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [high] spec.md is architect placeholder; fill with Jeans equation (hydrostatic equilibrium in a potential), isothermal model (constant velocity dispersion), density profile (rho ~ r^-2), virial parameter, invariants (pressure gradient balances gravity, M(<r) ~ r for isothermal).
2. [medium] README stub; explain Jeans equilibrium (balance of gravity and pressure), isothermal assumption (constant velocity dispersion), what to observe (density profile r^-2, velocity dispersion uniform, density contours), controls (total mass, velocity dispersion if adjustable).
3. [medium] index.html figcaption and description minimal.

## Text / approachability
spec and README stubs. User sees a stratified structure but no explanation of the equilibrium condition or velocity dispersion role.

## Source-material & equation fidelity
Jeans equation and isothermal solution appear correctly implemented. Density profile scales as r^-2. No discrepancies. Reference: Binney and Tremaine Ch. 4.

## Golden-frame observations
Frames show density-shaded sphere with r^-2 profile, velocity dispersion contours uniform, hydrostatic balance held. No visual defects.

## Hero-candidate
NO. Galactic structure pedagogy; tier: simple.

## Maintainer notes
Spec, README, figcaption. No physics defects.
