---
title: Baryon Acoustic Oscillation (Toy)
slug: baryon-acoustic-oscillation-toy
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: MAA-CS
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: liddle-cosmology
primary_chapter: 11
hook: 'A sound wave launched in the early universe froze when atoms formed, leaving a 150 Mpc ring imprinted on the distribution of galaxies, a standard ruler.'
one_paragraph: 'Before recombination, photons and baryons were one fluid. A density perturbation launched a spherical sound wave that traveled outward until the universe cooled enough for atoms to form, at which point the wave stalled, leaving a shell of baryons at the sound horizon r_s of about 150 Mpc. That frozen scale shows up today as a slight excess of galaxy pairs separated by 150 Mpc: the baryon acoustic oscillation, a standard ruler for measuring cosmic distances and dark energy. The playground shows the sound shell freezing out. Reference: Liddle, An Introduction to Modern Cosmology, Ch. 11.'
tags: [cosmology, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: runs
    label: simulation advances each frame
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
  - key: deterministic
    label: fixed seed reproduces the run
    tolerance: 1
what_to_try:
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
---
# BAO toy
Sound wave + baryon shell freeze at $r_s \approx 150$ Mpc. Source: Liddle Ch. 11.

## Explainer

### What you are looking at

Before the universe was 380,000 years old, a single dense spot sent
out a sound wave through the hot photon-baryon plasma, like a ripple
from a dropped stone. When the universe cooled and the photons
escaped, that ripple froze in place at a fixed radius. Every galaxy
survey since has found a faint excess of galaxy pairs separated by
exactly that radius, a standard ruler stamped on the sky. The
playground animates the ripple expanding and freezing.

### The acoustic wave

An initial overdensity is a mix of dark matter (gravitates, does not
feel pressure) and baryons coupled to photons (huge pressure). The
photon-baryon part launches a spherical sound wave that travels at
the plasma sound speed

$$c_s = \frac{c}{\sqrt{3\,(1 + R)}},
  \qquad R = \frac{3\rho_b}{4\rho_\gamma},$$

while the dark-matter peak stays put at the center. The wave's
comoving radius at any time is the sound horizon

$$r_s(t) = \int_0^{t} \frac{c_s\,dt'}{a(t')}.$$

### The frozen ruler

At recombination the photons free-stream away, the pressure vanishes,
and the sound wave stalls. Its radius locks at the sound horizon at
the drag epoch,

$$r_s \;\approx\; 150\ \text{Mpc (comoving)}.$$

That leaves the matter distribution with two features: the original
central dark-matter peak and a spherical baryon shell exactly $r_s$
away. Statistically, galaxies are slightly more likely to be found
$\sim$150 Mpc apart, a bump in the correlation function at a known
physical scale. Because the scale is set by simple early-universe
physics, it is a standard ruler: comparing its apparent size at
different redshifts measures the expansion history and dark energy.
The playground sweeps the baryon loading and shows the wave radius
and the frozen shell respond.

### Things to try

- Watch the wave expand and the dark-matter peak stay central, then
  the shell freeze at recombination.
- Raise the baryon loading $R$ and watch the sound speed drop and
  the frozen radius shrink.
- Note the two-feature final density (central peak + shell at
  $r_s$): the origin of the BAO bump in galaxy surveys.

### Where this comes from

The photon-baryon sound speed, the sound horizon, and the BAO
standard ruler follow Liddle, *An Introduction to Modern Cosmology*,
Chapter 11, and Eisenstein et al., ApJ 633, 560 (2005).
