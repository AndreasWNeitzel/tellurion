---
title: Earth Axial Precession + Nutation 3D
description: "Earth spins like a tilted top. Gravity from the Sun and Moon slowly swings its spin axis around a big cone, one full turn every ~25,800 years (this is why the pole star changes over millennia), with a small 18.6-year wobble on top. Drag to orbit the view, scroll to zoom; the year counter runs forward."
caption: "Figure 1. The Earth's spin axis (white line) traces a slow precession cone driven by lunisolar gravity, with the 18.6-year nutation wobble superposed. Method: closed-form IAU precession-nutation series. Source: Smart, Textbook on Spherical Astronomy."
slug: earth-axial-precession-nutation-3d
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: AST2004
supporting_ucs: []
curriculum_year: hero
primary_citation: marion-thornton
primary_chapter: 11
hook: "Earth is a spinning top tilted 23.4 degrees, and the Sun and Moon torque it. Its axis does not stay put: it swings around a cone once every ~25,800 years, slowly changing which star is the pole star, with a small 18.6-year nodding wobble (nutation) riding along."
one_paragraph: "A lit 3D Earth, tilted at its 23.4-degree obliquity, with the spin axis drawn out into space. Because the planet bulges at the equator, the gravity of the Sun and Moon pulls on the bulge and torques the axis sideways, so instead of toppling it sweeps a slow circle, the axial precession, completing one cone every ~25,772 years at 50.29 arcseconds per year. That is why Polaris is only temporarily the North Star. A second, faster effect, the 18.6-year nutation tied to the Moon's orbital-node cycle, adds a small nod of amplitude 17.2 arcsec in ecliptic longitude and 9.2 arcsec in obliquity. The axis position follows the standard closed-form IAU precession-nutation series, which is why the identity of the pole star drifts over the millennia. Drag to orbit the camera, scroll to zoom; the readout shows the simulated year and the current axis angles."
tags: [mechanics, animation, multi-panel, live-readout]
difficulty: 4
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 6
share_state_keys: [scale, year0]
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

# Earth Axial Precession + Nutation 3D

## Explainer

### What you are looking at

Earth spins like a top, and like a top whose axis is pushed, its
spin axis slowly sweeps out a giant cone instead of tipping over.
That 26000-year wobble (plus a smaller 18.6-year nod) is why the pole
star changes over millennia. The playground shows the spin axis
tracing the precession cone with the nutation ripple on top.

### Why a torque makes the axis circle, not fall

Earth is not a sphere: it bulges at the equator (oblate). The Sun and
Moon pull harder on the near side of that bulge than the far side, a
net gravitational torque $\boldsymbol\tau$ trying to upright the
tilted axis. For a non-spinning body the axis would just tip. But for
a body with large spin angular momentum $\mathbf L$ (Earth's
rotation), the rigid-body equation

$$\frac{d\mathbf L}{dt} = \boldsymbol\tau$$

means the torque, which is perpendicular to $\mathbf L$, changes the
direction of $\mathbf L$ rather than its magnitude. The axis
therefore precesses (sweeps a cone) at the rate

$$\Omega_p = \frac{\tau}{L\sin\theta}
  \;\propto\; \frac{(C-A)}{C\,\omega},$$

set by the dynamical oblateness $(C-A)/C$ and the spin $\omega$,
giving the ~25800-year period and the 23.4 deg cone half-angle.

### Nutation: the smaller nod

The Moon's orbital plane is tilted and its nodes regress with an
18.6-year period, so the lunar part of the torque is not steady but
modulated. That superimposes a small forced oscillation, the
nutation, a few-arcsecond nodding of the axis on top of the smooth
precession. Same physics (torque on a gyroscope), just a periodic
forcing term. The playground renders Earth's tilted spinning body,
the lunisolar torque, and the axis tip drawing the slow precession
circle on the sky with the 18.6-year nutation wobble.

### Things to try

- Watch the spin axis sweep the precession cone, not tip over (the
  gyroscopic response to a torque).
- Speed up time and see the axis tip trace a circle on the sky over
  ~26000 years (the wandering pole star).
- Look closely for the small 18.6-year nodding (nutation) riding on
  the steady precession.

### Where this comes from

Rigid-body precession and lunisolar torque follow Goldstein,
*Classical Mechanics*, Chapter 5, and the Earth-orientation treatment
in Murray and Dermott, *Solar System Dynamics*, Chapter 5.

## Physical setup

Earth is an oblate spinning top: it bulges at the equator. The Sun and Moon pull harder on the near side of that bulge than the far side, producing a gravitational torque. A non-spinning body would simply tip over; a fast-spinning one instead responds at right angles, so the spin axis sweeps out a cone rather than falling. This is lunisolar axial precession. A smaller, shorter-period forcing from the regression of the Moon's orbital nodes (18.6-year cycle) adds the nutation, a slight nodding of the axis on top of the steady precession.

## Governing equations

General precession in longitude advances at 50.29 arcsec/yr, completing 360 degrees in about 25,772 years. The mean obliquity is the standard epoch value (~23.44 degrees) with the slow secular drift. The principal nutation term (period 18.6 yr, the lunar node) has amplitude Delta-psi ~ 17.2 arcsec in ecliptic longitude and Delta-epsilon ~ 9.2 arcsec in obliquity. The instantaneous pole direction is the mean pole displaced by these nutation terms (the standard IAU series; Smart).

## Numerical method

Closed-form evaluation of the precession and nutation series in the shared `earth-rotation-cpu` engine (`precessionLongitude`, `nutation`, `obliquity`). No time integration and no random numbers; the axis direction at any simulated year is computed directly, so the scene is deterministic and the capture is reproducible.

## Controls

- Drag: orbit the camera around the Earth.
- Scroll: zoom.
- The readout panel shows the simulated calendar year and the current axis angles.
- Share keys: `scale` (zoom), `year0` (epoch the year counter starts from).

## Expected qualitative features

- A lit 3D Earth tilted at ~23.4 degrees, continents rotating with the daily spin.
- The spin axis drawn into space, its tip tracing a circular precession cone over the long run.
- Over one simulated ~25,772-year circuit the axis returns to its start (the pole-star cycle).
- A small superposed nutation wobble (18.6-year period) on the otherwise smooth cone.
- A monotonically advancing year counter and live axis-angle readout, no text overlap.

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline):

1. Precession rate = 50.29 arcsec/yr (to 0.01).
2. Precession completes 360 degrees in 25,000-27,000 yr.
3. Obliquity at epoch equals the base value to 0.01 deg.
4. Nutation 18.6-yr maximum |Delta-epsilon| ~ 9.2 arcsec (8-12).
5. Nutation 18.6-yr maximum |Delta-psi| ~ 17.2 arcsec (15-20).

Visual gate: SSIM > 0.92 against committed golden frames; the visual-reviewer pass (post-build sweep) confirmed the 3D Earth, the legible precession cone, the visible nutation, clean animation progression and a non-overlapping readout.

## Limiting cases for verification

- One full simulated circuit: the axis returns to its starting orientation (period closure).
- Nutation switched conceptually off: a perfectly smooth cone (the mean pole).
- Obliquity ~ 23.4 deg sets the cone half-angle.

## Visual fallback

The 3D scene plus the year/angle readout carries the physics; the camera animation is interactive only.

## Citations

- Smart, Textbook on Spherical Astronomy: the precession-nutation series.
- Marion and Thornton, Classical Dynamics, Ch. 11: torque-free and torqued symmetric-top precession.

## Risk register

- The nutation is the dominant 18.6-yr term only (the full IAU1980/2000 series has hundreds of small terms); this is stated and is sufficient for the qualitative pole-cycle visualization the invariants pin.
