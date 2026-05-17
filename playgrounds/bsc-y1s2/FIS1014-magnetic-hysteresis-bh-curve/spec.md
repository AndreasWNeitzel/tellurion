---
title: Magnetic Hysteresis: Domains and the B-H Loop
slug: magnetic-hysteresis-bh-curve
status: verified
audience: portfolio
created: 2026-05-17
hook: 'The domains do not just follow the field, they remember where they have been. That memory is the area inside the loop.'
one_paragraph: 'A Jiles-Atherton hysteresis model driven by an oscillating field. The primary scene is a lattice of magnetic domains that flip toward the field but lag it; the secondary panel traces the B-H loop with a glowing pen and shades the per-cycle energy loss. Soft iron, hard steel and ferrite presets, with coercivity, saturation and drive sliders. The headless sim.js is gate-tested for remanence, coercivity and the soft-vs-hard ordering.'
tags: [electromagnetism, animation, live-readout]
difficulty: 3
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
curriculum_year: 'L:F-1Y-2S'
primary_uc: FIS1004
share_state_keys: []
---

# Magnetic Hysteresis: Domains and the B-H Loop

## Physical setup

A ferromagnet under an oscillating applied field. The domain lattice
reverses as a threshold-ordered wave that lags the field (the
hysteresis); the B-H loop is traced alongside, its enclosed area the
energy dissipated per cycle.

## Governing equations

Jiles-Atherton: anhysteretic `M_an = Ms[coth(He/a) - a/He]`,
`He = H + alpha M`, irreversible
`dM_irr/dH = (M_an - M_irr)/(k delta - alpha(M_an - M_irr))`,
`M = (1-c) M_irr + c M_an`.

## Numerical method

Explicit integration of the J-A ODE as `H = Hm sin(wt)` sweeps; the
full loop is precomputed for the reference curve and the live point
is integrated each frame.

## Controls

- material selector (soft iron, hard steel, ferrite).
- coercivity `k`, saturation `Ms`, drive `Hm` sliders; Reset, Pause.

## Expected qualitative features

- Domains reverse in a wave that lags the field.
- Soft iron: thin loop, small loss; hard steel: broad square loop.
- Remanence at `H = 0`; sign change near `+-Hc`.

## Invariants and acceptance thresholds

- Langevin odd and saturating; `|M| <= Ms`.
- Open loop: ascending and descending branches differ.
- Positive remanence and a real coercive field.
- Hard material has larger loop area and coercivity than soft.
- Loop area (energy per cycle) strictly positive.
- Anhysteretic curve through the origin, saturating to `+-Ms`.

## Limiting cases for verification

- `k -> 0`: loop collapses toward the anhysteretic curve.
- Large `Hm`: full saturation, maximal remanence.

Source: Jiles and Atherton, *JMMM* 61, 48 (1986) (`jiles-atherton`);
Griffiths, *Introduction to Electrodynamics*, 4th ed., Sec. 6
(`griffithsem2017`).
