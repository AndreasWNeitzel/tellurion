---
title: Shapiro Time Delay
slug: shapiro-time-delay
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST3017
supporting_ucs: []
curriculum_year: bsc-y3s2
---

# Shapiro time delay

## Physical setup

A light signal travels past a massive body (Schwarzschild M = 1 in
geometric units) at impact parameter b. The leading-order PPN time delay
relative to flat-space is

  delta t = 2 M ln(4 r_E r_R / b^2)

with r_E and r_R the emitter and receiver distances from the body. The
full Schwarzschild formula is

  delta t = 2 M ln((r_E + sqrt(r_E^2 - b^2)) (r_R + sqrt(r_R^2 - b^2)) / b^2).

## Governing equations

Above.

## Numerical method

None. Closed-form.

## Controls

- b / M: impact parameter, 1 to 100.
- r_E = r_R: emitter/receiver distance, 100 to 3000 M.
- speed: auto-sweep b.
- Reset / Pause / Play.

## Expected qualitative features

1. Delay decreases logarithmically with b.
2. Delay grows linearly with M.
3. Delay grows logarithmically with r.

## Invariants and acceptance thresholds

1. Leading-order matches full formula at b << r within 5 percent.
2. Decreases with b.
3. Increases with r.
4. Linear in M.
5. Full formula = 0 at b = r.
6. Leading-order formula manual match.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- b -> r: signal arrives nearly head-on, almost no extra delay.
- b -> 0: delay diverges (signal grazes the singularity).

## Visual fallback

Canvas2D only. Top: ray sketch with emitter, receiver, Sun, and b. Bottom:
delta t vs b curve with current-b cursor.

## Citations

- Schutz, A First Course in General Relativity 2e Ch. 11
  (`schutz-firstcourse`).
- Bertotti, Iess, Tortora 2003 Nature.

## Stretch goals

- Include solar radial dependence of refractive index.
- 2D photon trajectory in PPN field.
- PPN gamma parameter slider.

## Risk register

- Leading-order formula assumes b << r; near b = r it diverges from full.
