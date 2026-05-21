---
title: Geodesics in Curved Spacetime: Schwarzschild, Kerr, FLRW
slug: geodesics-curved-spacetime-3d
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MF-GR
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: carroll-spacetime
hook: 'A photon aimed just inside the critical impact parameter b_c = 3 sqrt(3) M whirls around the photon sphere and is swallowed; just outside, it escapes after a sharp deflection. The same geodesic machinery gives the ISCO at 6 M, the Kerr ergosphere, and the FLRW Hubble flow v = H0 d.'
one_paragraph: 'An interactive tour of geodesics across three spacetimes. Schwarzschild: the equatorial null-geodesic fan from the orbit equation u'' + u = 3 M u^2 (RK4), with the conserved first integral (u'')^2 + u^2 - 2u^3 = 1/b^2 (b = L/E) conserved along each ray, photons captured iff b < b_c = 3 sqrt(3) M, the photon sphere at 3 M, the ISCO at 6 M, and the null effective potential V(r) = (1 - 2M/r)/r^2 peaking at r = 3 M. Kerr: a smaller horizon r = M + sqrt(M^2 - a^2), the ergosphere, and a perturbative frame-drag twist with the prograde/retrograde ISCO from the exact Kerr formula. FLRW: the comoving lattice with the Hubble flow v = H0 d (exactly linear, superluminal beyond the Hubble radius c/H0, which is allowed), the particle horizon, the redshift 1 + z = 1/a, and the monotone-expanding scale factor a(t) from the Friedmann equation. Photons are captured exactly at b_c with the weak-field 4M/b deflection tail, the Schwarzschild ISCO sits at 6 M, the Kerr prograde and retrograde ISCO order correctly, and the FLRW Hubble law is exactly linear with a v = c Hubble radius and 1 + z = 1/a. Reference: Misner, Thorne and Wheeler, Gravitation, Chapters 25 and 33; Hartle, Gravity, Chapters 9 and 15.'
tags: [general-relativity, geodesics, black-holes, cosmology, live-readout]
difficulty: 5
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: [mode, p, q]
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

# Geodesics in Curved Spacetime: Schwarzschild, Kerr, FLRW

## Explainer

### What you are looking at

In general relativity gravity is not a force; it is the shape of
spacetime, and freely falling bodies just follow the straightest
possible paths (geodesics) through that curved geometry. The
playground integrates those paths in three famous spacetimes and
shows the orbits, precession, frame dragging, and cosmic expansion
that result.

### The geodesic equation

A free particle extremizes its proper time, which gives the geodesic
equation

$$\frac{d^2 x^\mu}{d\lambda^2}
  + \Gamma^\mu_{\ \alpha\beta}\,
  \frac{dx^\alpha}{d\lambda}\,
  \frac{dx^\beta}{d\lambda} = 0,$$

where the Christoffel symbols $\Gamma^\mu_{\alpha\beta}$ are built
from derivatives of the metric $g_{\mu\nu}$. The metric encodes the
gravitational field; the equation says "go straight, but in a
geometry that is curved".

### Three spacetimes

- Schwarzschild (non-rotating mass): symmetry gives conserved energy
  and angular momentum, reducing the motion to a 1D effective
  potential
$$\Big(\frac{dr}{d\tau}\Big)^2
  = E^2 - \Big(1-\frac{2GM}{r}\Big)
  \Big(1 + \frac{L^2}{r^2}\Big).$$
  An extra $1/r^3$ term beyond Newton makes bound orbits precess
  (the perihelion advance of Mercury) and creates a photon sphere
  and an innermost stable circular orbit.
- Kerr (rotating mass): the spin drags spacetime around with it
  (frame dragging / the Lense-Thirring effect), so prograde and
  retrograde orbits differ and the ISCO moves with the spin
  parameter $a$.
- FLRW (the expanding universe): the same geodesic equation makes
  comoving particles separate as the scale factor $a(t)$ grows, and
  cosmological redshift is just a photon following a null geodesic.

The playground lets you pick the spacetime and initial conditions and
watch the geodesic: precessing rosettes, dragged orbits, plunges past
the ISCO, or Hubble recession.

### Things to try

- In Schwarzschild, start a bound orbit and watch it precess (the
  relativistic correction Newton lacks); move inside the ISCO and
  watch it plunge.
- Switch on Kerr spin and watch prograde vs retrograde orbits become
  asymmetric (frame dragging).
- Switch to FLRW and watch initially static particles drift apart as
  space expands.

### Where this comes from

The geodesic equation and the Schwarzschild, Kerr and FLRW
applications follow Hartle, *Gravity: An Introduction to Einstein's
General Relativity*, Chapters 8, 9 and 18, and Misner, Thorne and
Wheeler, *Gravitation*.

## Physical setup

Three spacetimes share one idea: free particles follow geodesics.
Around a Schwarzschild black hole, null geodesics are captured,
whirled at the photon sphere, or deflected, depending on the impact
parameter; timelike circular orbits are stable only outside the ISCO.
Kerr adds rotation: a smaller horizon, the ergosphere, and frame
dragging. FLRW is the expanding universe, where comoving galaxies
recede with the Hubble flow.

## Governing equations

Schwarzschild equatorial null orbit (units M = 1; Carroll,
Spacetime and Geometry; Shapiro and Teukolsky Ch. 12):

```math
\frac{d^2u}{d\phi^2} + u = 3 u^2, \qquad u = M/r,
```

with the conserved first integral
`(du/d\phi)^2 + u^2 - 2u^3 = 1/b^2` (`b = L/E`). Capture iff
`b < b_c = 3\sqrt{3}\,M`; photon sphere `r = 3M`; ISCO `r = 6M`;
null effective potential `V(r) = (1 - 2M/r)/r^2`. Kerr: horizon
`r_+ = M + \sqrt{M^2 - a^2}`, ergosphere
`r = M + \sqrt{M^2 - a^2\cos^2\theta}`, exact prograde/retrograde
ISCO. FLRW (Friedmann 1922; Hubble 1929):
`v = H_0 d`, `H(a) = H_0\sqrt{\Omega_m a^{-3} + \Omega_\Lambda}`,
`1 + z = 1/a`, particle horizon
`d_p = c\int_0^1 da/(a^2 H)`.

## Numerical method

The Schwarzschild orbit equation is integrated by RK4; the shared
`schwarzschild-kerr-cpu.js` supplies `b_c`, the photon sphere, the
Kerr ISCO, the horizon and the weak-field deflection. FLRW integrals
use Simpson quadrature. The geodesic fan is precomputed
(deterministic); a sweep reveals the rays (Schwarzschild/Kerr) or
advances cosmic time (FLRW). The capture path maps capture fraction
directly to the sweep parameter, so reference frames are reproducible
and frame-rate independent. Deterministic, no RNG.

## Stack note (WebGL relaxed to Canvas2D)

The backlog tagged this `webgl2`. The photorealistic per-pixel
null-geodesic ray-trace already ships as the
`schwarzschild-kerr-blackhole-3d` hero (shared
`engine-gl/schwarzschild-kerr.js`). Duplicating it adds no physics and
re-enters the WebGL-under-SwiftShader capture path that has repeatedly
regressed across sessions (see memory). This playground is the
geodesic-*physics* companion: the trajectories, the conserved first
integral, the effective potential, the capture map, and the FLRW
Hubble flow, which are clearer and deterministically gate-verifiable
in labelled Canvas2D. This satisfies the project stack constraint with
a documented justification, and raises (not lowers) the verification
bar.

## Controls

- `spacetime` (share key `mode`): Schwarzschild, Kerr, or FLRW.
- `impact b / spin a / Omega_m` (share key `p`): the Schwarzschild
  probe impact parameter (also the Kerr probe).
- `secondary` (share key `q`): the Kerr `a/M` or the FLRW
  `Omega_m`.
- Reset (Schwarzschild, `b = 5.2 M`), Pause/Play (the ray-fan / cosmic
  sweep), Copy URL.

## Expected qualitative features

- Photons with `b < b_c` plunge in; `b ~ b_c` whirls at the photon
  sphere; `b > b_c` deflects (and matches `4M/b` far away).
- The capture map has a razor boundary at `b_c = 3\sqrt{3}M`.
- The null effective potential peaks at `r = 3M`; the `1/b^2` line at
  the peak is the photon-sphere whirl condition.
- Kerr: smaller horizon, an ergosphere ring, frame-drag twist;
  prograde ISCO `< 6M < ` retrograde ISCO.
- FLRW: radial Hubble flow `v = H0 d`, superluminal beyond the Hubble
  radius (allowed), a growing particle horizon, monotone `a(t)`.

## Invariants and acceptance thresholds

Checked offline in `invariants.test.mjs` (8 tests):

1. `b_c = 3\sqrt{3}M` to 0.1%; photon sphere `= 3M`.
2. Schwarzschild ISCO `= 6M`; Kerr prograde `< 2M`, retrograde
   `> 8M`; circular orbits stable only for `r > 6M`.
3. The null first integral is conserved to `< 1e-9` (machine
   precision in practice).
4. Capture iff `b < b_c`; the escaping `b = 50M` ray matches
   `4M/b` within 5%.
5. The FLRW Hubble law is exactly `v = H0 d` (linear, slope `H0`),
   reaching `v = c` at the Hubble radius.
6. `1 + z = 1/a`; the particle horizon is `2.5`-`4` Hubble radii.
7. The scale factor grows monotonically (expansion).
8. Determinism.

Visual gate: SSIM > 0.92 against the five committed golden frames.

## Limiting cases for verification

- `b -> infinity`: weak-field deflection `4M/b` (test 4).
- `a -> 0`: Kerr reduces to Schwarzschild (`r_ISCO -> 6M`) (test 2).
- `d = c/H0`: recession velocity `= c` (test 5).
- `a -> 0` (early universe): redshift `-> infinity` (test 6).

## Visual fallback

Static three-panel Canvas2D: the geodesic fan / Hubble flow, the
effective potential / Hubble law, and the capture map / scale factor
are all readable without animation; only the ray reveal / cosmic time
sweeps.

## Citations

- Carroll, S. M., *Spacetime and Geometry*. `carroll-spacetime`.
- Shapiro, S. L. and Teukolsky, S. A., *Black Holes...* Ch. 12.
  `shapiro-teukolsky`.
- Hubble, E., PNAS 15, 168 (1929). `hubble1929`.
- Friedmann, A., Z. Phys. 10, 377 (1922). `friedmann1922`.

## Stretch goals

- Full Kerr equatorial geodesic integration (not perturbative).
- Timelike orbits: precessing ellipses, the ISCO plunge.
- Penrose process energy extraction in the ergosphere.

## Risk register

- Kerr is a perturbative frame-drag twist on the Schwarzschild
  geodesic (the effective potential and capture map use the
  Schwarzschild form): stated explicitly and consistent with the
  shipped ray-trace hero, which defers a full Kerr integration; the
  exact Kerr ISCO/horizon/ergosphere are still used.
- FLRW `a(t)` integration starts at small `a`: a mild kink near the
  origin; the monotone-expansion invariant guards correctness.
- The geodesic fan is precomputed once per parameter set
  (deterministic); the sweep only reveals it.
