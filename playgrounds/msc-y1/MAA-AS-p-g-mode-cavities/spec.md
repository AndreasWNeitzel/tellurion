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
one_paragraph: 'A star rings like a bell, and where each oscillation mode can live is set by two characteristic frequencies: the buoyancy (Brunt-Vaisala) frequency N and the acoustic (Lamb) frequency S_l for spherical-harmonic degree l. A mode of angular frequency omega propagates only where omega lies above both (an acoustic p-mode, restored by pressure, in the envelope) or below both (a gravity g-mode, restored by buoyancy, in the radiative core), and is evanescent in between. The pulsating stellar cross-section shows the displacement field, large in the cavity where the mode is trapped and decaying outside it; a low-frequency mode sits in the g-cavity, a high-frequency one in the p-cavity, and an intermediate one becomes a mixed mode that lives in both, the diagnostic that lets asteroseismology probe stellar cores. The linked propagation diagram shades the two cavities and reads out how the mode energy splits between them. Reference: Aerts, Christensen-Dalsgaard and Kurtz, Asteroseismology, Chapters 3 to 7; Unno et al., Nonradial Oscillations of Stars.'
tags: [stellar, animation, live-readout]
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
# p- and g-mode cavities

## Explainer

### What you are looking at

A star rings in two different ways at once: sound waves bouncing in
the envelope (pressure modes) and buoyancy waves sloshing in the deep
core (gravity modes). Each kind can only live in the region of the
star where the local physics supports it. The playground draws the
star's "propagation diagram" and shows which cavity a mode of a given
frequency is trapped in, and when the two couple.

### Two characteristic frequencies

At each radius the star has two natural frequencies that fence off the
cavities:

- The Lamb frequency $S_\ell$, the acoustic cutoff for degree
  $\ell$:
$$S_\ell^2 = \frac{\ell(\ell+1)\,c_s^2}{r^2},$$
  with $c_s$ the local sound speed.
- The Brunt-Vaisala (buoyancy) frequency $N$, the natural frequency
  of a displaced blob bobbing under gravity:
$$N^2 = g\left(\frac{1}{\Gamma_1 P}\frac{dP}{dr}
  - \frac{1}{\rho}\frac{d\rho}{dr}\right).$$

### Where each mode can propagate

A mode of angular frequency $\omega$ is oscillatory only where it
beats both fences the right way; elsewhere it is evanescent
(exponentially decaying):

- Acoustic (p) cavity: $\omega > \max(N, S_\ell)$, in the envelope.
- Gravity (g) cavity: $\omega < \min(N, S_\ell)$, in the radiative
  core.

A high-frequency mode lives purely in the envelope (a p-mode); a
low-frequency mode is locked in the core (a g-mode). At intermediate
frequencies a mode has both an acoustic outer cavity and a gravity
inner cavity separated by a thin evanescent zone; it tunnels through
and becomes a mixed mode that carries information from the core out
to the surface where we can see it. Mixed modes are the reason
asteroseismology can weigh stellar cores at all. The playground
sweeps $\omega$ and $\ell$ and shows the turning points, the
evanescent gap, and the transition from pure p, to mixed, to pure g.

### Things to try

- Raise $\omega$ until both turning points vanish: a pure p-mode in
  the envelope.
- Lower $\omega$ into the core: a pure g-mode trapped below the
  evanescent zone.
- Tune $\omega$ to the intermediate band and watch the two cavities
  appear with a thin evanescent gap (the mixed-mode regime).

### Where this comes from

The propagation diagram, the Lamb and Brunt-Vaisala frequencies, and
mode trapping / mixed modes follow Aerts, Christensen-Dalsgaard and
Kurtz, *Asteroseismology*, Chapter 3.

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
