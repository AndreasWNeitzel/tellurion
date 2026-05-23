---
title: Double-Slit Single-Photon Accumulator (Hero)
slug: double-slit-single-photon-accumulator-3d
status: superseded
superseded_by: slit-experiment-legend-3d
audience: portfolio
created: 2026-05-20
primary_uc: FIS3003
supporting_ucs: [FIS2002]
curriculum_year: hero
primary_citation: hecht-optics
primary_chapter: 10
hero_candidate: true
hook: 'Each photon hits the screen at one point, but enough of them and the interference fringes appear. Quantum mechanics is intrinsically statistical, and the canonical demo is the double slit.'
one_paragraph: 'A plane wave illuminates two narrow slits of width a, separated by d, with light of wavelength lambda. At the detector at distance D, classical wave optics gives the intensity profile sinc^2(pi a sin theta / lambda) * cos^2(pi d sin theta / lambda). The playground sends one photon at a time, samples its detector hit position from this profile, and draws every hit as a single dot. The interference fringes do not appear photon by photon, but emerge over time from the statistical ensemble, exactly as Tonomura and others demonstrated with electrons in 1989. Reference: Hecht, Optics, 5th ed., Ch. 10.'
caption: 'Figure 1. Single-photon hits accumulate on a detector behind a double slit. The hit histogram (bottom) matches the closed-form sinc^2 cos^2 intensity profile (yellow overlay) as the photon count grows. Method: Fraunhofer two-slit diffraction; rejection-sampled photon hits. Source: Hecht, Optics, 5th ed., Ch. 10; Tonomura et al., Am. J. Phys. 57 (1989) 117.'
tags: [quantum, optics, animation, three-d, live-readout]
difficulty: 3
tier: single
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [d, a, lambda]
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

# Double-slit single-photon accumulator
Each photon is a hit; the fringes emerge from the ensemble. Source: Hecht, Optics, Ch. 10.

## Explainer

### What you are looking at

A source on the left fires photons one at a time toward a barrier with
two narrow slits. Behind the barrier is a detector screen that records
where each photon lands. The screen is initially empty; each photon
arrives at one point. As more photons accumulate, an interference
fringe pattern emerges from what looks at first like random hits.

That is the canonical "quantum is statistical" demonstration: no
individual photon shows interference, but the ensemble does. The
classical wave intensity profile, drawn in yellow on top of the
accumulating histogram, predicts the *probability density* of each
photon's hit position. Hits are sampled from this density, so the
histogram converges to it over time.

### The two-slit intensity profile

For two slits of width $a$ separated by $d$ at distance $D$,
illuminated by a plane wave of wavelength $\lambda$, the Fraunhofer
intensity on the detector at angle $\theta$ from the central axis is

$$I(\theta) \;=\; I_0\,
  \underbrace{\operatorname{sinc}^2\!\left(\frac{\pi a \sin\theta}
    {\lambda}\right)}_{\text{single-slit envelope}}\,
  \underbrace{\cos^2\!\left(\frac{\pi d \sin\theta}
    {\lambda}\right)}_{\text{two-slit interference}}.$$

The cosine-squared factor produces the bright/dark fringes; the sinc-
squared factor modulates them with a slower-varying envelope from the
diffraction of each single slit. The fringe spacing on the screen
(small angles) is

$$\Delta y \;=\; \frac{\lambda D}{d},$$

so a wider slit spacing gives narrower fringes, and a longer
wavelength gives wider fringes.

### Why single photons reveal the same fringes

A single photon hits the screen at one point and one point only. But
the *probability* that it lands at position $y$ is proportional to
$I(y)$. The wavefunction's amplitude in two paths (one through each
slit) adds coherently, so the probability density is the squared
modulus of the sum, not the sum of squared moduli. That is the heart
of quantum mechanics: probabilities come from squared amplitudes, and
amplitudes interfere. Tonomura et al. (1989) showed this experimentally
with single electrons through a biprism; the same principle drives
every neutron and atom interferometer ever built.

### Things to try

- Increase slit separation $d$: fringe spacing $\lambda D / d$ shrinks.
- Increase wavelength $\lambda$: fringes widen.
- Increase slit width $a$: the envelope narrows; outer fringes dim.
- Run the photon count up to 10000: the histogram converges to the
  smooth $I(y)$ overlay.

### Symbols

- $a$: width of each slit.
- $d$: centre-to-centre slit separation.
- $\lambda$: wavelength of the illuminating light.
- $D$: distance from the slits to the detector.
- $\theta$: angle from the central axis, $\sin\theta \approx y/D$
  for small $y$.
- $I(\theta)$: intensity (proportional to photon-hit probability).

### Where this comes from

The Fraunhofer two-slit intensity is in Hecht, *Optics*, 5th ed.,
Pearson 2017, Section 10.2. The single-particle accumulation
demonstration is Tonomura et al., *Am. J. Phys.* 57 (1989) 117 (for
electrons) and Feynman Lectures Vol. III, Ch. 1 (for the conceptual
argument).
