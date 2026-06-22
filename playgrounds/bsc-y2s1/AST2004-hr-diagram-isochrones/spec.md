---
title: The HR Diagram - Real Stars and a Stellar Evolution Track
slug: hr-diagram-isochrones
status: verified
audience: portfolio
created: 2026-06-21
primary_uc: AST2004
curriculum_year: bsc-y2s1
primary_citation: gaiadr3
primary_chapter: 1
hook: "Plot about 3000 real Gaia stars on the HR diagram and thread a real stellar-evolution model through them: a Sun-like star creeps along the main sequence for nine billion years, then races through the giant phases."
one_paragraph: "The Kiel diagram (effective temperature vs surface gravity, both axes reversed) carries the real Gaia DR3 stars and a real MESA solar-metallicity evolution track on the same plane with no transformation. A marker walks the track by stellar age from the zero-age main sequence, through the subgiant and red giant branches, helium burning, the AGB, and off the diagram to the white dwarf. The diagnostic plots the model evolutionary speed against age: the star spends about 9 Gyr (most of its life) creeping along the main sequence and then races through the giant phases in a few hundred Myr, the quantitative reason the main sequence is the most populated region of any unbiased stellar census. The data are real (no fabricated values); this Gaia spectroscopic sample is itself rich in luminous giants, so its red giant branch and red clump are especially well drawn."
tags: [astrophysics, stellar-evolution, gaia, hr-diagram, animation, live-readout]
difficulty: 2
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [u, view, color]
invariants:
  - key: turnoff
    label: the main-sequence turn-off age is ~9 Gyr for a 1 Msun model
    tolerance: 0.7
  - key: turnoffT
    label: the turn-off effective temperature is near solar
    tolerance: 600
  - key: msfrac
    label: the main sequence is the longest-lived phase (>55% of the tracked life)
    tolerance: 0.0
  - key: speedup
    label: post-main-sequence evolution is many times faster than the main sequence
    tolerance: 0.0
what_to_try:
  - Pause and drag the age slider: the marker crawls along the main sequence for 9 Gyr, then accelerates up the giant branch in under a Gyr.
  - The green turn-off circle marks where core hydrogen runs out (about 9 Gyr for a Sun-like star).
  - The bottom plot is logarithmic: the model speed is lowest on the main sequence and spikes by orders of magnitude in the post-main-sequence and white-dwarf transitions.
  - Switch to the observational colour-magnitude diagram, and switch the star colour between metallicity and plain population density.
references:
  - "Gaia Collaboration 2023, A&A 674, A1 (Gaia DR3)."
  - "Paxton et al. 2011, ApJS 192, 3 (MESA stellar evolution code)."
  - "Hansen, Kawaler and Trimble, Stellar Interiors, 2nd ed., Ch. 2 (the HR diagram and evolutionary timescales)."
---

# The HR diagram: real stars and a stellar evolution track

## Physical setup

The Hertzsprung-Russell diagram places stars by temperature and luminosity (or,
equivalently, by surface gravity in the Kiel plane). A star is a point that moves
across the diagram as it ages. This playground shows about 3000 real Gaia DR3
stars and the real evolutionary path of a Sun-like model star on the same plane.

## Equations and method

Both datasets carry effective temperature and surface gravity natively, so the
Kiel diagram (Teff vs log g) overlays the observed stars and the model track with
no transformation. The model is a MESA 1 Msun, solar-metallicity track of 725
real points from the zero-age main sequence to the white dwarf. The marker is
linearly interpolated along the real track by age (interpolation between adjacent
model points is continuous-curve rendering, not invented data). The
main-sequence turn-off is the age at which the central hydrogen fraction
center_h1 drops below 1e-3.

The diagnostic is the model evolutionary speed, the Kiel-plane path length per
unit time,

$$ v(t) = \frac{\sqrt{(\Delta \log T_\mathrm{eff})^2 + (\Delta \log g)^2}}{\Delta t}, $$

on a logarithmic scale against age. It is a property of the model alone, so it is
unaffected by how the observed sample was selected.

## A note on the data and selection

The general principle that a star is seen most often where it lingers longest
(the number density on the diagram scales as dN proportional to dt/ds) holds for
a volume-complete, unbiased census. The Gaia sample used here is a
magnitude-limited spectroscopic (GSP-Spec) sample that over-represents luminous
giants, so its observed density does not cleanly trace evolutionary timescale;
the diagnostic therefore reports the model timescale directly rather than
claiming the observed density matches it. The GSP-Spec surface gravity is used
because the GSP-Phot gravity saturates at log g = 4.0 and would not reach real
main-sequence dwarfs. The giant enrichment is itself why the red giant branch and
red clump are so well populated in the scene.

## Numerical method

No engine. Closed-form linear interpolation along the real MESA track; the
evolutionary speed and the turn-off are computed from finite differences of the
real model points. All Gaia and MESA values are real; rows without a valid
measurement are dropped, never imputed.

## Controls

- Age slider (0 to 12.4 Gyr); Play/Pause; Restart.
- Switch plane (Kiel Teff-logg with the track, or the observational
  colour-magnitude diagram with the stars only).
- Colour stars by metallicity [M/H] or by plain population density.

## Expected qualitative features

1. The Gaia stars form a main sequence, a red giant branch, and a red clump; the
   MESA track threads through them.
2. The marker creeps along the main sequence for about 9 Gyr, then races up the
   giant branch.
3. The diagnostic speed is lowest on the main sequence and spikes by orders of
   magnitude in the giant and white-dwarf phases.

## Invariants and acceptance thresholds

- The main-sequence turn-off age is about 9 Gyr and its Teff is near solar.
- The main sequence is the longest-lived phase (more than half the tracked life).
- Post-main-sequence evolution is many times faster than the main sequence.

## Citations

Gaia Collaboration 2023, A&A 674, A1. Paxton et al. 2011, ApJS 192, 3. Hansen,
Kawaler and Trimble, Stellar Interiors, 2nd ed., Ch. 2.
