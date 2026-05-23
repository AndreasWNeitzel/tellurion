---
title: Earth-Moon-Sun Tides
slug: earth-moon-tides-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: AST2004
supporting_ucs: [FIS1013]
curriculum_year: hero
primary_citation: murraydermott1999
primary_chapter: 4
hero_candidate: true
hook: 'Two tidal bulges, not one, ride around the Earth: the Moon''s pull is stronger on the near side AND weaker on the far side, both relative to the Earth''s centre. That is the gradient of gravity, and it predicts two high tides per day.'
one_paragraph: 'The tidal force on a point at Earth''s surface is the differential gravity of the Moon (and Sun) across the planet''s diameter, not the gravity itself. Expanded as a multipole the leading term is L=2, which produces two bulges (one facing the perturber, one antipodal) and the familiar twice-per-day high-tide rhythm. The playground renders Earth as a 3D sphere with the L=2 tidal deformation visible, animates the Moon around its orbit, and labels spring vs neap regimes as Sun and Moon align or quadrature. Reference: Murray and Dermott, Solar System Dynamics, CUP 1999, Ch. 4.'
caption: 'Figure 1. Earth with the lunar + solar L=2 tidal bulge made visible. The Moon (gray dot) orbits in the equatorial plane; the Sun lies at +x. Spring tides (aligned) and neap tides (quadrature) modulate the bulge height. Method: closed-form L=2 Legendre tidal potential h(theta) = A_lunar P_2(cos theta_M) + A_solar P_2(cos theta_S). Source: Murray and Dermott, Solar System Dynamics, Ch. 4.'
tags: [mechanics, animation, three-d, live-readout, gravity]
difficulty: 3
tier: single
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [phase]
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

# Earth-Moon-Sun tides
Differential gravity, L=2 Legendre, spring vs neap. Source: Murray and Dermott, Solar System Dynamics, Ch. 4.

## Explainer

### What you are looking at

A 3D Earth with the lunar and solar tidal bulges drawn as a small
radial deformation of the sphere. The Moon orbits in the equatorial
plane at the chosen orbital phase. The bulge has two lobes: one
pointing at the Moon, one antipodal. As the Moon moves, the bulge
moves with it; Earth rotates underneath, which is why a coastal town
sees two high tides per day.

When the Moon, Earth and Sun are aligned (new moon or full moon) the
two L=2 bulges add coherently and tides are large: spring tides. When
the Moon is at quadrature (first or third quarter) the bulges
partially cancel: neap tides. The bottom strip reports which regime
the current phase is in.

### The tidal potential

The gravity of the Moon at a point on Earth's surface is not the same
as at Earth's centre. The difference, the *tidal* force, is the
gradient of the lunar potential over the small displacement
$\vec r$ from the centre. Expanded to lowest order in $r/D$,

$$\Phi_{\rm tide}(\vec r) \;=\; -\frac{G M_\text{Moon}}{D^3}\,
  \tfrac{1}{2}\,r^2\,\bigl(3\cos^2\theta - 1\bigr),$$

where $D$ is the Earth-Moon distance and $\theta$ is the angle between
$\vec r$ and the line to the Moon. The angular factor is the Legendre
polynomial $P_2(\cos\theta)$, with maxima at $\theta = 0, \pi$ (the
two bulge axes) and a minimum at $\theta = \pi/2$ (the equator
perpendicular to the bulge).

### Why TWO bulges, not one

This is the most common point of confusion. Naive intuition says the
Moon "pulls the water up" on the near side; what about the far side?
The answer is in the difference: at the far side, the Moon's pull is
*weaker* than at the centre, so the water there is left *behind* as
Earth's centre is accelerated toward the Moon. In the Earth-centred
frame, the residual is an effective outward force on both the near
and far sides. The $P_2$ formula has the same sign at $\theta = 0$
and $\theta = \pi$ for exactly this reason.

### Sun-Moon combined: spring and neap

The Sun's tidal amplitude on Earth is about 46% of the Moon's
(despite the Sun being much more massive: tidal force goes as
$M / D^3$, so the much larger $D$ wins). When the Sun-Earth-Moon
are aligned (new or full moon),

$$h_{\rm spring} \;\approx\; A_{\rm lunar} + A_{\rm solar} \;\approx\;
  1.46\,A_{\rm lunar},$$

a 46% larger range than the lunar tide alone. At quadrature,

$$h_{\rm neap} \;\approx\; A_{\rm lunar} - A_{\rm solar} \;\approx\;
  0.54\,A_{\rm lunar},$$

a 46% smaller range. The classifier in the playground uses this
amplitude split.

### Symbols

- $\vec r$: surface position relative to Earth's centre.
- $\theta$: angle from $\vec r$ to the line to the perturber.
- $D$: Earth-perturber distance.
- $M$: perturber mass.
- $A_{\rm lunar}$, $A_{\rm solar}$: tidal amplitudes (about 0.5 m and
  0.23 m on real Earth).
- "phase": angle of the Moon around Earth (0 = new moon, $\pi$ = full
  moon, $\pm \pi/2$ = quadrature).

### Where this comes from

The L=2 tidal-potential expansion and the spring/neap classifier
follow Murray and Dermott, *Solar System Dynamics*, CUP 1999, Ch. 4.
A geophysical-geodesy treatment of measured Earth tides is in
Lambeck, *Geophysical Geodesy*, Oxford 1988.
