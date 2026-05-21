---
title: Shakura-Sunyaev Accretion Disc Temperature
slug: accretion-disk-temperature-profile
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-HE
supporting_ucs: []
curriculum_year: msc-y1
hook: 'Gas cannot fall straight onto a black hole; it forms a disk that friction heats until it glows, and this profile is the model behind the blue glow of cataclysmic variables and the UV bump of quasars.'
one_paragraph: 'In a steady, optically thick, geometrically thin disk, gas at radius R orbits at the local Keplerian rate and drifts slowly inward; viscous torques carry angular momentum outward and dissipate the released gravitational energy locally. Balancing that power against blackbody emission from both faces gives the Shakura-Sunyaev profile T(R) = [3 G M Mdot / (8 pi sigma R^3) (1 - sqrt(R_in/R))]^(1/4), with central mass M, accretion rate Mdot, inner edge R_in (the innermost stable circular orbit) and Stefan-Boltzmann sigma. Far from the edge this is the famous T proportional to R^(-3/4) law; the bracket forces T to zero at R_in and produces a peak just outside it. The playground plots T(R) and the integrated multi-temperature blackbody spectrum as M, Mdot and R_in are varied. Reference: Shakura and Sunyaev 1973; Frank, King and Raine, Accretion Power in Astrophysics, Chapter 5.'
tags: [stellar, fluids-mhd, animation, live-readout]
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

# Shakura-Sunyaev accretion disc temperature profile

## Explainer

### What you are looking at

Gas spiraling onto a black hole or neutron star cannot fall straight
in: it forms a disk, and friction between adjacent rings heats it
until it glows. The playground computes how hot each radius gets and
the spectrum that results, the model behind the blue glow of cataclysmic
variables and the UV bump of quasars.

### Where the heat comes from

In a steady, optically thick, geometrically thin disk, gas at radius
$R$ orbits at the local Keplerian rate and slowly drifts inward,
releasing gravitational energy. Viscous torques transport angular
momentum outward and dissipate that energy locally. Balancing the
released power against blackbody emission from both faces gives the
Shakura-Sunyaev temperature profile

$$T(R) = \left[\frac{3 G M \dot M}{8\pi\sigma R^3}
  \left(1 - \sqrt{\frac{R_\mathrm{in}}{R}}\right)\right]^{1/4},$$

with $M$ the central mass, $\dot M$ the accretion rate,
$R_\mathrm{in}$ the inner edge (e.g. the innermost stable circular
orbit), and $\sigma$ the Stefan-Boltzmann constant. Far from the
inner edge this is the famous $T\propto R^{-3/4}$ law; the bracket
forces $T\to0$ at $R_\mathrm{in}$ (the zero-torque boundary), so the
temperature actually peaks slightly outside the inner edge.

### The multicolor blackbody spectrum

Each annulus radiates as a blackbody at its own $T(R)$. Summing
nested rings gives the disk's integrated spectrum,

$$L_\nu \;\propto\; \int_{R_\mathrm{in}}^{R_\mathrm{out}}
  2\pi R\;B_\nu\big(T(R)\big)\,dR,$$

which has a characteristic shape: a Rayleigh-Jeans
($L_\nu\propto\nu^2$) tail at low frequency, a broad flat
$L_\nu\propto\nu^{1/3}$ middle from the range of ring temperatures,
and a Wien cutoff set by the hottest inner ring. Raising $\dot M$
slides the whole spectrum up and blueward. The playground sweeps
$\dot M$ and $M$ and shows $T(R)$ and the multicolor-disk spectrum
respond.

### Things to try

- Confirm the $T\propto R^{-3/4}$ falloff away from the inner edge,
  and the turnover to zero at $R_\mathrm{in}$.
- Increase $\dot M$ and watch the temperature and the spectral peak
  rise (hotter, bluer disk).
- Identify the $\nu^{1/3}$ flat segment between the Rayleigh-Jeans
  rise and the Wien cutoff (the multicolor signature).

### Where this comes from

The thin-disk temperature profile and the multicolor blackbody
spectrum follow Shakura and Sunyaev, A&A 24, 337 (1973), and Frank,
King and Raine, *Accretion Power in Astrophysics*, Chapter 5.

## Physical setup

Steady, optically thick, geometrically thin accretion disc around a
non-rotating compact object. Shakura-Sunyaev (1973) temperature profile:

  T(r) = T_in (R_in / r)^(3/4) [1 - sqrt(R_in / r)]^(1/4)

where R_in is the inner radius and T_in sets the overall scale. The
bracket factor vanishes at R_in (so T = 0 at the inner boundary) and
approaches 1 far from R_in (so the bare scaling r^(-3/4) is recovered).
Maximum temperature occurs at r = (49 / 36) R_in approx 1.361 R_in.

## Numerical method

None. Closed-form evaluation.

## Controls

- view: profile (T vs r) / disc (face-on).
- r_out: outer radius for plotting, 20 to 200 R_in.
- speed: animation rate (no-op currently).
- Reset / Pause / Play.

## Expected qualitative features

1. Inner-edge boundary: T(R_in) = 0.
2. Peak at r = 49/36 R_in.
3. Far-edge T ~ r^(-3/4).
4. Disc image: hot ring near r = 1.36 R_in shading outward through
   orange to deep red.

## Invariants and acceptance thresholds

1. T(R_in) = 0 within 1e-12.
2. R_TMAX = 49/36 R_in exact.
3. T / T_bare approaches 1 within 1 percent at r >= 1e4 R_in.
4. Monotonic decrease for r > R_TMAX.
5. Bare scaling: T_bare(2 r) / T_bare(r) = 2^(-3/4) exact.
6. Full / bare ratio = [1 - sqrt(R_in / r)]^(1/4).

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- r -> infinity: T(r) approaches bare r^(-3/4).
- r = R_in: T = 0.

## Visual fallback

Canvas2D only. Profile view: T(r) curve with bare-r^(-3/4) dashed
overlay and peak marker. Disc view: face-on rendering of annuli colored
by local temperature.

## Citations

- Frank, King, Raine, Accretion Power in Astrophysics 3e Ch. 5
  (`frank-king-raine`).
- Shakura and Sunyaev 1973 A&A.

## Stretch goals

- Relativistic correction (Page-Thorne 1974) for spinning hole.
- SED multicolor disc-blackbody.
- Animated photon ray trajectories.

## Risk register

- The temperature-to-RGB mapping is qualitative, not blackbody-accurate.
