---
title: p- and g-Mode Cavities (Propagation Diagram)
slug: p-g-mode-cavities
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: MAA-AS
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: aerts-asteroseism
primary_chapter: 3
hook: 'See where a stellar oscillation actually lives: g-modes trapped in the core, p-modes in the envelope, mixed modes in both.'
one_paragraph: 'The asteroseismic propagation diagram made physical. A pulsating stellar cross-section shows the mode displacement field (rdbu, spherical-harmonic degree l): large where the mode can propagate and evanescent where it cannot, so a low-frequency mode is trapped in the radiative-core g-cavity, a high-frequency mode in the acoustic-envelope p-cavity, and an intermediate one is a mixed mode living in both. A linked propagation diagram carries N, S_l, and omega with the g- and p-cavities shaded, and the mode energy split between the two cavities is read out. sim.js (N, S_l, cavities) is unchanged.'
tags: [stellar, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# p- and g-mode cavities

## Physical setup

A stellar oscillation of angular frequency $\omega$ and degree $\ell$ propagates only where it is above the Lamb frequency $S_\ell$ and the buoyancy frequency $N$ is on the appropriate side: the acoustic (p) cavity requires $\omega > \max(N, S_\ell)$, the gravity (g) cavity requires $\omega < \min(N, S_\ell)$. A low-$\omega$ mode is trapped in the radiative core, a high-$\omega$ mode in the envelope, and an intermediate one is a mixed mode coupling both through the evanescent zone. Source: Aerts, Christensen-Dalsgaard and Kurtz Ch. 3 (`aerts-asteroseism`).

## Numerical method

sim.js (unchanged) supplies $N(r)$, $S_\ell(r)$ and `cavities()`. A schematic WKB eigenfunction is integrated: oscillatory with a local radial wavenumber that is high in the acoustic region and node-rich toward the centre in the buoyancy region, exponentially decaying in the forbidden zone. The cross-section renders the field $\xi(r)\cos(\ell\theta)\cos(\omega t)$ with the rdbu colormap; the energy split is $\int\xi^2$ over the `cavities()` segments.

## Controls

- Mode frequency $\omega$ (0.5 to 10) and degree $\ell$ (1 to 4).
- Reset and Pause.

## Expected qualitative features

1. Low $\omega$: displacement confined to the core; g-cavity energy near 100 percent.
2. High $\omega$: displacement fills the envelope; p-cavity energy near 100 percent.
3. Intermediate $\omega$: a mixed mode with substantial energy in both cavities, matching the shaded propagation diagram.
