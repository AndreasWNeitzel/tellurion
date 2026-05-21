---
title: Doppler Effect from a Moving Source
slug: doppler-effect
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2016
supporting_ucs: [AST2004]
curriculum_year: bsc-y2s1
hook: 'Wavefronts pile up ahead of a moving source and stretch out behind it; that is why an approaching siren is higher pitched than a receding one.'
one_paragraph: 'A source emits one wavefront every period, and each spreads outward at the wave speed. When the source moves, successive fronts leave from shifted positions, so they bunch up ahead (a higher observed frequency) and spread out behind (a lower one). The playground animates the expanding circular fronts and the moving source and reports the observed frequency ahead of and behind it as you change the speed, including the shock cone that forms once the source outruns its own waves. This is the everyday Doppler shift, and carried over to light it is the basis of astronomical redshift. Reference: French, Vibrations and Waves.'
tags: [waves, animation, live-readout]
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

# Doppler effect from a moving source

## Explainer

### What you are looking at

A source moving while it emits waves bunches them up ahead of itself
and stretches them out behind. That is why a passing siren drops in
pitch as it goes by. The playground draws each wavefront as an
expanding circle emitted from where the source was at that instant, so
you see the crowding in front and the spreading behind directly.

### The equation

For a source moving at speed $v$ through a medium where waves travel at
$c$, a stationary observer at angle $\theta$ from the source's velocity
hears

$$f_\text{obs} = \frac{f}{1 - (v/c)\cos\theta}.$$

The geometry is the whole story. Each wavefront is a circle expanding
at $c$, but each is centered on a different point because the source
moved between emissions. Ahead ($\theta = 0$) the circles pile up and
the wavelength shortens; behind ($\theta = \pi$) they spread and it
lengthens.

### The three cases

- Directly ahead, $\theta = 0$: $f_\text{obs} = f/(1 - v/c)$, the
  maximum blueshift (pitch up).
- Directly behind, $\theta = \pi$: $f_\text{obs} = f/(1 + v/c)$, the
  maximum redshift (pitch down).
- Abreast, $\theta = \pi/2$: $f_\text{obs} = f$, no shift at the
  instant of closest geometric approach.

As $v \to c$ the forward wavefronts stack onto a single cone, the sonic
boom (Mach cone). This is the classical (medium) Doppler effect; the
relativistic light version replaces it with the Lorentz factor and adds
a transverse shift.

### Things to try

- Raise $v/c$ toward 1 and watch the forward wavefronts bunch into a
  cone (the shock front).
- Compare the pitch heard in front versus behind as the source passes.
- Note the perpendicular direction shows no shift in this classical
  case, unlike the relativistic one.

### Where this comes from

The moving-source Doppler formula and the wavefront construction follow
Crawford, *Waves and Oscillations* (Berkeley Physics Course), Chapter 4,
and French, *Vibrations and Waves*, Chapter 7.

## Physical setup

A point source moves with constant velocity v in the +x direction. In its
own rest frame it emits a sinusoidal signal of frequency f, so it emits a
discrete wavefront every period T = 1 / f. Each wavefront propagates
isotropically at speed c. A stationary observer detects compressed
wavefronts in front of the source and stretched ones behind it.

## Governing equations

Non-relativistic source-moving Doppler formula:
  f_obs = f / (1 - (v / c) cos(theta))

where theta is the angle from the source's velocity vector to the
observer. Special cases:
  theta = 0:     f_obs = f / (1 - v / c)        (blue-shifted, in front)
  theta = pi:    f_obs = f / (1 + v / c)        (red-shifted, behind)
  theta = pi / 2: f_obs = f                     (no shift, perpendicular)

## Numerical method

Each frame the time advances by dt = 0.02. Whenever simulation time crosses
a multiple of T = 1, a new wavefront is recorded at the current source
position. Wavefronts are rendered as concentric circles with radius
r = (t - t_emit) c.

## Controls

- v / c: source speed, 0 to 0.95.
- speed: integrator steps per render frame.
- Reset / Pause / Play.

## Expected qualitative features

1. v = 0: concentric circles centered on the (stationary) source.
2. 0 < v < c: front circles pile up tightly; back circles space out.
3. v approaches c: front wavefronts piled almost on top of each other.
4. Bar chart in lower panel shows the asymmetry of f_obs(theta) curve
   relative to the f = 1 reference line.

## Invariants and acceptance thresholds

1. v = 0: f_obs = f at every angle within 1e-12.
2. f_obs(theta = 0) = f / (1 - v / c) exact.
3. f_obs(theta = pi) = f / (1 + v / c) exact.
4. f_obs(theta = pi / 2) = f in non-relativistic limit.
5. Reciprocal: f_obs * T_obs = 1 within 1e-12.
6. Wavefront radius = c (t - t_emit) within 1e-10.
7. Subsonic stability: no wavefront escapes |r| > 20.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- v = 0: no Doppler.
- v / c approaches 1: arbitrarily large f_obs in front.

## Visual fallback

Canvas2D only. Top scene: source + wavefronts + two stationary observers.
Bottom: f_obs(theta) curve with reference line at f = 1.

## Citations

- Crawford, Waves and Oscillations Ch. 4 (`crawford-waves`).
- French, Vibrations and Waves Ch. 7 (alternate).

## Stretch goals

- Supersonic regime (v > c) showing the shock cone.
- Moving observer (relativistic full Doppler).
- Audible playback at the observed frequency.

## Risk register

- The non-relativistic source-moving formula does not include the
  relativistic transverse Doppler. For v close to c this would shift
  f_obs(pi/2) below f.
