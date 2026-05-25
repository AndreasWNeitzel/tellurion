---
title: "Stellar Oscillation Modes"
slug: stellar-oscillation-modes
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: MAA-AS
primary_citation: aerts2010
supporting_ucs: []
curriculum_year: msc-y1
hook: 'A stellar surface oscillates in spherical harmonic modes; p-modes live above the Lamb frequency, g-modes below the Brunt-Vaisala.'
one_paragraph: 'Real Y_l^m(theta, phi) cos(omega t) drawn on the visible hemisphere with a diverging colormap; a propagation diagram shows N(r) and S_l(r) for a polytrope, with the mode frequency marked.'
tags: [stellar, quantum, animation, multi-panel, live-readout]
difficulty: 4
tier: large
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [n, l, m]
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
references:
  - "Aerts, Christensen-Dalsgaard, Kurtz, Asteroseismology."
---

# Stellar Oscillation Modes

A stellar disk breathes, rings, and ripples according to the chosen spherical-harmonic mode $Y_l^m(\theta, \phi) \cos(\omega t)$. Sliders for radial order $n$, degree $l$, azimuthal order $m$ morph the surface pattern. Side panel shows the propagation diagram (Brunt-Vaisala and Lamb frequencies vs radius for an $n = 3$ polytrope) with the current mode frequency marked. The p/g/mixed-mode label updates live.

## Explainer

### What you are looking at

A star is not a static ball; it is a resonant cavity that rings in
millions of standing-wave patterns at once, like a 3D drumhead. The
playground lets you pick one of those patterns by its three quantum-
like numbers and watch the stellar surface breathe, ring, and ripple
in that exact shape, with a propagation diagram showing where the
mode lives.

### The mode pattern

A small oscillation of the star is separated into a radial part and
an angular part. The angular part is a spherical harmonic, so the
surface displacement of a single mode is

$$\xi(\theta,\phi,t) \;\propto\;
  Y_\ell^m(\theta,\phi)\,\cos(\omega_{n\ell}\,t),$$

labelled by three integers:

- the radial order $n$: how many nodes the wave has from the center
  to the surface (the overtone number),
- the degree $\ell$: the number of node lines on the surface (total
  angular structure),
- the azimuthal order $m$: how many of those node lines pass through
  the poles ($-\ell \le m \le \ell$).

$\ell=0$ is a pure radial pulsation (the whole star breathing);
higher $\ell$ tiles the surface into a finer checkerboard of in-and-
out patches.

### Which cavity, and why it matters

The same mode is also a point on the star's propagation diagram, set
by the Lamb frequency $S_\ell$ and the buoyancy frequency $N$:

$$S_\ell^2 = \frac{\ell(\ell+1)\,c_s^2}{r^2},
  \qquad
  N^2 = g\!\left(\frac{1}{\Gamma_1 P}\frac{dP}{dr}
  - \frac{1}{\rho}\frac{d\rho}{dr}\right).$$

High-frequency modes are pressure (p) modes trapped in the envelope;
low-frequency modes are gravity (g) modes trapped in the core;
in-between modes are mixed and probe both. The playground marks the
chosen mode on this diagram and labels it p, g, or mixed live, so you
see directly which part of the star a given $(n,\ell,m)$ is sounding.
This is the entire basis of asteroseismology: a measured frequency
comb is a set of these labels, and inverting it maps the interior.

### Things to try

- Set $\ell=0$ for the pure radial "breathing" mode, then raise
  $\ell$ to tile the surface more finely.
- Vary $m$ at fixed $\ell$ and watch the node lines rotate from
  zonal (latitude bands) to sectoral (orange-slice segments).
- Lower the frequency and watch the mode label switch from p to
  mixed to g as it moves into the core cavity.

### Where this comes from

The spherical-harmonic mode decomposition and the p/g/mixed
propagation diagram follow Aerts, Christensen-Dalsgaard and Kurtz,
*Asteroseismology*, Chapters 1 and 3.

## Physical setup

Surface displacement: $\xi(\theta, \phi, t) = Y_l^m(\theta, \phi) \cos(\omega_{n,l} t)$. Asymptotic p-mode frequency $\omega_{n,l} \approx \Delta\nu (n + l/2 + \varepsilon)$; asymptotic g-mode period spacing $\Pi_{n,l} \approx \Pi_0 / \sqrt{l(l+1)} \cdot n$. Brunt-Vaisala $N(r)$ and Lamb $S_l(r)$ from an $n = 3$ polytrope.

## Controls

- $n$ (0 to 5), $l$ (0 to 4), $m$ ($-l$ to $l$)
- Mode-type toggle: p vs g vs mixed

## Invariants

- $l = 0, n = 1$ frequency equals $\Delta\nu$ within 5%.
- Period spacing of consecutive g-modes constant within 1% in asymptotic regime.
- Mode energy integral normalized to 1.

## Status note

Scaffolded; $Y_l^m$ renderer + polytrope $N(r), S_l(r)$ profile not yet implemented.

## Citations

Aerts, Christensen-Dalsgaard, Kurtz, "Asteroseismology", Springer 2010.
