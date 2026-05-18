# REVIEW - inverse-compton-scattering-cooling (pre-computed; maintainer actions later)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## Defects (severity-ranked)
1. [high] spec.md is architect placeholder; fill with inverse-Compton scattering (hot electrons upscatter low-energy photons), cooling rate (proportional to electron density, magnetic field or CMB photon density), energy transfer scaling, invariants (electron energy decreases, photon energy increases, momentum conservation in individual scatters).
2. [medium] README stub; explain IC cooling (mechanism in jets, PWN, AGN), what to observe (soft photons upscattered to hard X-rays, cooling curve), controls (electron temperature, magnetic field or CMB density, initial photon spectrum).
3. [medium] index.html figcaption and description minimal.

## Text / approachability
spec and README stubs. User sees a spectrum evolving but no explanation of the IC scattering process or why high-energy photons appear.

## Source-material & equation fidelity
IC cross-section (Klein-Nishina in relativistic limit, Thomson in non-relativistic) and cooling rate appear correct. Energy-transfer scaling is accurate. No discrepancies.

## Golden-frame observations
Frames show soft photons gradually shifting to high energies, original spectrum dims, new hard tail grows. Cooling rate trace is monotonic (energy transfer out of electrons). No visual defects.

## Hero-candidate
NO. High-energy astrophysics pedagogy; tier: simple.

## Maintainer notes
Spec, README, figcaption. IC physics code is correct.
