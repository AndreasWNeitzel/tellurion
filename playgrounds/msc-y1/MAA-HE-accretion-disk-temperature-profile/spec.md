---
title: Shakura-Sunyaev Accretion Disc Temperature
slug: accretion-disk-temperature-profile
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-HE
supporting_ucs: []
curriculum_year: msc-y1
---

# Shakura-Sunyaev accretion disc temperature profile

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
