---
title: Black Hole Geodesics (Hero)
description: A ray-marched Schwarzschild black hole with a lensed sky, photon ring, shadow and beamed disc; fire test photons and watch the razor-sharp capture threshold at the impact parameter b = 3 sqrt(3) M.
caption: Figure 1. Ray-marched Schwarzschild/Kerr black hole with equatorial null and timelike geodesics from the orbit equation d2u/dphi2 + u = 3 M u^2. Source: Misner, Thorne and Wheeler, Gravitation, Ch. 25.
slug: blackhole-geodesics-3d
status: verified
audience: portfolio
created: 2026-05-19
program: EVF
course: EVF Relativity / IA wormholes-and-gravity
suite: summer-school-hero-suite
primary_uc: EVF
supporting_ucs: []
curriculum_year: hero
primary_citation: mtw-gravitation
primary_chapter: 25
hook: 'Two photons a hair apart in aim: one whips around the hole and flies free, the other spirals through the horizon forever.'
one_paragraph: 'A Schwarzschild black hole rendered by the reused real-time lensing shader: the background star field is bent, the photon sphere glows as a ring, the shadow is a true black disc, and a Doppler-beamed accretion disc circles it. Below, an equatorial plane lets you fire test photons and massive particles whose geodesics are integrated from the exact orbit equation. The drama is the critical impact parameter b = 3 sqrt(3) M: a photon aimed just outside it loops the photon sphere and escapes, one just inside is captured. The effective potential V(r) shows why the innermost stable circular orbit sits at 6 M.'
tags: [relativity, animation, live-readout, webgl2, hero]
difficulty: 5
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 8
share_state_keys: [b, spin]
---

# Black Hole Geodesics

## Explainer

### What you are seeing and why it matters

Gravity here is not a force pulling things in; it is the shape of
spacetime, and light and matter simply follow the straightest
available paths (geodesics) through that shape. Near a black hole the
shape is so curved that there is a knife-edge: aim a photon a fraction
of a percent too close and it cannot get back out, no matter how fast
it is going, because there is no "faster" than light. That threshold,
the impact parameter b = 3 sqrt(3) M, and the photon sphere at 3 M and
the innermost stable orbit at 6 M, are exact numbers that fall out of
the geometry. Fire photons across the threshold and watch one escape
and its near-twin vanish. This is also why a black hole casts a
sharp-edged shadow, the thing the Event Horizon Telescope imaged.

### Try this

- Drag the impact-parameter slider through b/b_crit = 1.0 and fire:
  watch escape flip to capture at the threshold.
- Use the "photon escape (grazing)" preset and see the ray loop the
  photon sphere almost a full turn before flying off.
- Switch to "ISCO orbit" and "plunge" to compare a bound orbit with a
  particle that spirals in.
- Turn up the spin slider and watch the lensed shadow deform.

### The orbit equation (collapsible)

$$\frac{d^2u}{d\phi^2}+u = 3 M u^2\ \text{(null)},\qquad
  b_{\rm crit}=3\sqrt3\,M,\quad r_{\rm ph}=3M,\quad r_{\rm ISCO}=6M.$$

with $u = 1/r$. Timelike geodesics add a $M/L^2$ term.

## Physical setup

Equatorial Schwarzschild geodesics. Photons are launched from r = 46 M
with impact parameter b; massive particles from a given (E, L). The
hero scene is the reused ray-marched Schwarzschild/Kerr metric (the
spin slider feeds the shader; the analysed geodesics are Schwarzschild,
stated in the readout).

## Numerical method

RK4 integration of the orbit equation in azimuth (engine
`shared/js/engine/schwarzschild-geodesic-cpu.js`, DOM-free, tested in
`tests/schwarzschild-geodesic.test.mjs`). Lensed background:
`shared/js/engine-gl/schwarzschild-kerr.js` (the proven hero shader,
reused unchanged).

### Stack note (WebGL2 relaxation)

Project default is Canvas2D/SVG; this hero reuses the established
WebGL2 ray-marching black-hole shader (per-pixel null-geodesic
integration is impossible in Canvas2D at 60 fps). Reuse, not new GL.

## INTERACTIVITY (standard S4)

- Camera orbit (drag): yes, shared orbit camera around the hole.
- Camera zoom (scroll): yes (orbit-camera wheel).
- Camera pan: not applicable (the hole is centred and is the subject).
- Direct manipulation: click the equatorial plane to set the impact
  parameter and fire a photon; the "Fire photon" button re-fires at
  the slider value.
- Parameters: impact parameter b/M (2 to 9); black-hole spin a/M
  (0 to 0.98, feeds the lensing shader). Disc inner/outer radius and
  observer distance are fixed for stable golden frames (stated, not
  silent).
- Time controls: play / pause (freezes the geodesic tracer and disc);
  clear rays. No speed multiplier (the geodesic is integrated once;
  the tracer reveals it).
- Presets: photon capture, photon escape (grazing), ISCO orbit,
  plunge.
- Probe/readout: each fired ray reports b, b/b_crit, outcome
  (escape / capture / bound) and periapsis; the panel also shows the
  photon-sphere and ISCO radii.

## Diagnostic plot (secondary)

Within the equatorial-plane Canvas2D panel, a small inset draws the
timelike effective potential V(r) (L set for the ISCO), so the user
sees why no stable circular orbit exists inside 6 M. Subordinate to
the ray-marched hero scene (S3).

## Expected qualitative features

1. On load the lensed hole and disc are rendered and a photon is
   already fired (S5).
2. Sweeping b across b_crit flips escape to capture sharply (S6).
3. The grazing preset loops the photon sphere; the plunge preset
   spirals through the horizon.
4. Readout b/b_crit ~ 1 exactly at the visual transition.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| horizon 2M, photon sphere 3M, b_crit 3 sqrt3 M, ISCO 6M | exact | invariants test |
| photon capture threshold located by bisection | < 0.1 percent | invariants test |
| null orbit invariant (du/dphi)^2 + u^2 - 2M u^3 | drift < 1e-4 | invariants test |
| null effective potential peaks at the photon sphere | r ~ 3M | invariants test |
| timelike orbit outside ISCO never crosses the horizon | strict | invariants test |
| geodesic integration deterministic | exact | invariants test |

Confirmed in `invariants.test.mjs` and `tests/schwarzschild-geodesic.test.mjs`.

## Limiting cases for verification

- b >> b_crit: nearly straight line, tiny deflection.
- b -> b_crit from above: many loops around the photon sphere.
- b < b_crit: monotone plunge to the horizon.

## Citations

- Misner, Thorne and Wheeler, Gravitation, Freeman 1973, Ch. 25
  (`mtw-gravitation`).
- Hartle, Gravity, Addison-Wesley 2003, Ch. 9 (`hartle-gravity`).

## Risk register

- The lensing shader is reused unchanged from the proven hero, so its
  golden behaviour is known; capture sweeps b with a fixed camera per
  fraction and a fully-drawn geodesic (anim complete) for determinism.
- Spin slider only feeds the shader; the analysed geodesics are
  Schwarzschild and the readout says so (no false Kerr claim).
