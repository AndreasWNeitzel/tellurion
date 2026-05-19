---
title: Exoplanet Transit (Hero)
description: A planet crosses its star edge-on, the light dips by (Rp/Rs)^2, the dip's U-shape comes from limb darkening, and tilting the orbit shrinks the transit to a graze, then vanishes. The light curve is the observable.
caption: Figure 1. Star + planet on a Keplerian orbit; light curve from intensity-weighted overlap of a quadratic limb-darkened disc and the planet's circular shadow. Source: Mandel and Agol, ApJ 580 (2002) L171.
slug: exoplanet-transit-3d
status: verified
audience: portfolio
created: 2026-05-19
program: EVF
course: EVF Planets / IA exoplanets
suite: summer-school-hero-suite
primary_uc: EVF
supporting_ucs: []
curriculum_year: hero
primary_citation: mandel-agol-2002
primary_chapter: 1
hook: 'The star dims by a fraction the size of the planet, on the dot.'
one_paragraph: 'A planet on a real Keplerian orbit transits its star edge-on; the light curve is computed as the intensity-weighted geometric overlap of a quadratic limb-darkened stellar disc with the planet shadow. The depth is the square of the radius ratio, the timing pins down the period, the duration the orbit geometry, and the U-shape comes from limb darkening, exactly the four observables that make transits the discovery channel for thousands of planets. Tilt the orbital plane and the transit shrinks to a graze, then vanishes; pick a hot Jupiter for a deep, frequent dip or an Earth analogue for a tiny, slow one.'
tags: [stellar, animation, live-readout, webgl2, hero]
difficulty: 5
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 6
share_state_keys: [Rp, aOverRs, inc, period]
---

# Exoplanet Transit

## Explainer

### What you are seeing and why it matters

A planet orbits its star. Whenever it passes between us and the star,
it blocks a tiny fraction of the light, like an insect crossing a
streetlamp. The dip is sharp, periodic, and tells you the planet's
size: how much it blocks is the square of the planet-to-star radius
ratio. From a few thousand such dips, the Kepler mission found
thousands of planets we cannot otherwise see. The U-shape (not a
square dip) comes from limb darkening: the star's edge is dimmer
than its centre, so the planet blocks less light at the limb and
more near the centre. Tilt the orbit and the planet only grazes the
disc, or misses it entirely, which is why the transit method finds
only the well-aligned systems.

### Try this

- Start on 'central transit': the canonical clean dip with a flat
  bottom.
- 'grazing transit': a shallow V-shape; the planet only crosses the
  star's limb.
- 'no transit': tilt the orbit further and the dip vanishes.
- 'hot Jupiter': a deep, frequent dip (a Jupiter-sized planet on a
  short orbit, like 51 Peg b).
- 'Earth analogue': a tiny dip (depth ~ 8e-5) on a year-long orbit;
  this is the regime Kepler needed years of staring at one field to
  detect.

### The light curve (collapsible)

Limb darkening (quadratic):
$I(\mu)/I(1) = 1 - u_1(1-\mu) - u_2(1-\mu)^2$, $\mu=\cos\theta$.

Central transit depth (uniform disc):
$\delta = (R_p/R_s)^2$.

Kepler's third law:
$T^2 = (4\pi^2/GM_\star)\,a^3$.

## Physical setup

Circular orbit of semi-major axis $a$, period $T$, inclination $i$;
the line of sight is taken along $\hat z$, and the planet is "in
front" of the star when on the near half of its orbit. The transit
flux is the intensity-weighted unblocked area on the stellar disc.

## Numerical method

Numerical integration of the quadratic limb-darkened disc on a polar
grid (160 radii x 220 angles), masking the planet's circular shadow
per frame. Engine `shared/js/engine/transit-cpu.js` (DOM-free, tested
in `tests/transit.test.mjs`). Render:
`shared/js/engine-gl/transit-3d.js` (limb-darkened star imposter,
planet disc, orbit ring, background stars).

### Stack note (WebGL2 relaxation)

Project default is Canvas2D/SVG; relaxed to WebGL2 here (per-pixel
limb darkening of a star imposter plus an orbiting planet plus a
sparse 3D star field at 60 fps). Reuses `createGL2` /
`compileProgram`; default framebuffer + in-shader ACES.

## INTERACTIVITY (standard S4)

- Camera orbit (drag): yes, shared orbit camera.
- Camera zoom (scroll): yes.
- Camera pan: not applicable (the star is centred and is the
  subject; fixed target; stated).
- Direct manipulation: an 'Edge-on' button snaps the camera to the
  canonical edge-on view (azimuth 0, elevation 0).
- Parameters: planet/star radius ratio $R_p/R_s$ (0.02 to 0.25);
  $a/R_s$ (2 to 20); inclination $i$ (1.30 rad to $\pi/2$); period
  $T$ (1 to 10); limb-darkening coefficients $u_1$, $u_2$.
- Time controls: play, pause, reset. No speed multiplier (orbit
  period sets the playback rate).
- Presets: central transit, grazing transit, no transit, hot Jupiter,
  Earth analogue.
- Probe/readout: live phase, flux, depth, period, inclination, and
  whether a transit is currently in progress. Hover the light curve
  for flux at that phase.

## Diagnostic plot (secondary, prominent)

The light curve IS the observable, so the Canvas2D panel below the
3D scene is somewhat more prominent than the usual diagnostic strip
(stated in S3 of the suite directive as the exception for transit).
It plots stellar flux vs orbital phase with the current point and
the hover phase marked.

## Expected qualitative features

1. Within 3 s of load the planet is moving and the light curve is
   tracing a clear dip on every period (S5).
2. Tilting inclination through the critical angle makes the transit
   visibly shrink to a graze and disappear (S6).
3. Increasing $R_p/R_s$ deepens the dip (proportional to its square).
4. Out-of-transit, the curve sits exactly on 1.0.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| Kepler III round-trip a <-> period | exact | invariants test |
| out-of-transit flux = 1 exactly | exact | invariants test |
| central transit depth = (Rp/Rs)^2 (no limb darkening) | rel < 1 percent | invariants test |
| limb-darkened transit is deeper than uniform | strict | invariants test |
| tilted orbit removes the transit | strict | invariants test |
| edge-on transit: y = 0 and z > 0 at mid-transit | < 1e-9 / strict | invariants test |
| integrator deterministic | exact | invariants test |

Confirmed in `invariants.test.mjs` and `tests/transit.test.mjs`.

## Limiting cases for verification

- $R_p \to 0$: dip vanishes.
- $u_1 = u_2 = 0$: depth = $(R_p/R_s)^2$ exactly at centre.
- $i \to \pi/2$, $b \to 0$: longest, flattest transit.

## Citations

- Mandel and Agol, ApJ 580 (2002) L171 (`mandel-agol-2002`).
- Seager and Mallen-Ornelas, ApJ 585 (2003) 1038
  (`seager-mallen-ornelas`).

## Risk register

- Numerical integration grid (160 x 220) is fixed; the central-depth
  invariant tests confirm 1 percent accuracy. Higher precision can
  be obtained by raising Nr/Nphi at a quadratic cost.
- Golden determinism: capture fixes the orbital phase, the camera
  azimuth and the parameters.
