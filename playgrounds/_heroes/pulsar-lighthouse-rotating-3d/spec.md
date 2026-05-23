---
title: Pulsar Lighthouse
slug: pulsar-lighthouse-rotating-3d
status: superseded
superseded_by: neutron-star-legend-3d
audience: portfolio
created: 2026-05-20
primary_uc: AST3014
supporting_ucs: [FIS3005]
curriculum_year: hero
primary_citation: lorimer-kramer-pulsars
primary_chapter: 3
hero_candidate: true
hook: 'A rotating neutron star with a magnetic axis off the spin axis: the two magnetic poles trace circles on the sky, and we see a pulse every time one of those circles intersects our line of sight.'
one_paragraph: 'A magnetized neutron star rotates at period P; the magnetic-dipole axis is tilted by obliquity alpha from the spin axis, so as the star spins each magnetic pole sweeps out a circle of angular radius alpha. Pair production in the polar gap accelerates electrons along the open field lines and they radiate radio waves into a beaming cone of half-angle rho. From an observer at inclination i to the spin axis, we see a pulse whenever rho contains our line of sight: typically once (single-pulse) or twice (an interpulse) per rotation, or never (missed beam) if |i - alpha| > rho on both sides. The playground draws the spinning neutron star with its dipole field, the two emission cones, the line of sight, and the resulting pulse profile I(phi). Reference: Lorimer and Kramer, Handbook of Pulsar Astronomy, Ch. 3.'
caption: 'Figure 1. Pulsar lighthouse geometry. A neutron star with spin axis (white) and a magnetic dipole tilted by alpha = 50 deg (cyan) sweeps two emission cones across the sky; the observer line of sight at inclination i = 65 deg (yellow dashed) intersects the cone once per rotation, producing a single Gaussian pulse. Method: closed-form geometric pulse intensity I(psi) = exp(- theta(psi)^2 / rho^2). Source: Lorimer and Kramer, Handbook of Pulsar Astronomy, Section 3.4.'
tags: [neutron-star, astrophysics, animation, three-d, live-readout]
difficulty: 3
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [alpha, incl, rho]
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

# Pulsar lighthouse
Magnetic-dipole rotator with off-axis beam. Source: Lorimer and Kramer, Handbook of Pulsar Astronomy, Ch. 3.

## Explainer

### What you are looking at

A neutron star spinning about a vertical axis (white). Its magnetic
dipole (cyan) is tilted by obliquity $\alpha$ from the spin axis and
sweeps around the polar circle once per rotation. Each magnetic pole
emits a narrow radio beam of half-angle $\rho$, drawn as a cone in 3D.
A dashed yellow line shows your line of sight at inclination $i$ to
the spin axis. Whenever the cone crosses the line of sight you see a
pulse, drawn on the right as $I(\phi)$ vs rotation phase. Sweep the
sliders and the pulse profile changes accordingly.

### Why a neutron star pulses

In Goldreich and Julian's picture (1969), a rotating magnetic dipole
sets up an electric field component along $\vec B$ near the polar
gap. Pairs are created from gamma photons in this field; the
secondaries spiral along open field lines and emit curvature radiation
along the local $\vec B$, beaming into a narrow cone of half-angle
$\rho \sim (R / R_{LC})^{1/2} \sim 10^\circ$ for canonical
$P = 1\,\mathrm{s}$ pulsars (here $R_{LC} = c P / 2\pi$ is the
light-cylinder radius). The radio emission is highly anisotropic
because the field is dipolar near the pole.

### Geometric pulse model

Let $\hat p(\psi)$ be the magnetic-pole unit vector at rotation phase
$\psi$ and $\hat l$ the line of sight. The angular separation is

$$\theta(\psi) \;=\; \cos^{-1}\!\big( \hat l \cdot \hat p(\psi) \big).$$

Approximating the beam as Gaussian in $\theta$, the pulse intensity is

$$I(\psi) \;=\; \exp\!\Big( - \theta(\psi)^2 / \rho^2 \Big).$$

If $\hat l$ never enters the cone (i.e. $|i - \alpha|$ and
$|i - (180^\circ - \alpha)|$ both exceed $\rho$) we see no pulse;
if both cones cross $\hat l$ we see an interpulse near phase 0.5
(roughly orthogonal rotators).

### Things to try

- Set $\alpha = 90^\circ$ to get an orthogonal rotator: two equal
  pulses 180 deg apart (Crab-pulsar geometry).
- Increase $\rho$ from 5 to 30 deg and watch the pulse width widen.
- Move $i$ to barely graze the cone ($|i - \alpha| \sim \rho$): the
  pulse shrinks into a "spike", just like marginally-visible pulsars.
- Set $i = \alpha$ to put yourself on the cone axis: continuous bright
  emission (no pulse).

### Symbols

- $P$: rotation period.
- $\Omega = 2\pi/P$: spin angular frequency.
- $\alpha$: magnetic obliquity (angle between spin axis and magnetic
  dipole).
- $i$: observer inclination (angle from spin axis to line of sight).
- $\rho$: radio beam half-angle (cone opening).
- $\psi$: rotation phase, $\psi = \Omega t$.

### Where this comes from

The geometric pulse-profile model and the visibility classification
are in Lorimer and Kramer, *Handbook of Pulsar Astronomy*, CUP 2005,
Section 3.4. The original magnetic-dipole emission mechanism is
Goldreich and Julian, *Astrophys. J.* 157 (1969) 869. Manchester and
Taylor, *Pulsars*, W. H. Freeman 1977, is the classic monograph.
