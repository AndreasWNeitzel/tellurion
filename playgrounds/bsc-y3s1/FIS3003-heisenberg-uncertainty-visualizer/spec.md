---
title: The Heisenberg Uncertainty Seesaw
slug: heisenberg-uncertainty-visualizer
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Squeeze the wavepacket thin in position and it explodes in momentum: the product never drops below hbar/2, and only the Gaussian touches the floor.'
one_paragraph: 'A quantum state shown in both conjugate spaces at once: the position wavefunction |psi(x)|^2 and its Fourier transform |phi(k)|^2, with the standard deviations sigma_x and sigma_p drawn as extent bars. A slow breathing modulates the squeeze so the seesaw is live, as the position packet narrows the momentum packet must broaden. A gauge tracks the product sigma_x sigma_p against the hbar/2 floor it can never cross; a Gaussian sits exactly on it, while a box, triangle or double-bump state sits strictly above. The momentum representation is the discrete Fourier transform of psi. The headless sim.js is gate-tested for the Gaussian saturation, the universal bound, the squeeze tradeoff, the FT unitarity, shift/boost invariance and the scaling law.'
tags: [quantum, fourier, animation, multi-panel, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-3Y-1S'
primary_uc: FIS3003
share_state_keys: []
---

# The Heisenberg Uncertainty Seesaw

## Physical setup

A normalised wavepacket of a chosen shape (Gaussian, box, triangle,
double bump) presented simultaneously in position space and in
momentum space, with a live squeeze.

## Governing equations

With `hbar = 1`, `phi(k)` is the Fourier transform of `psi(x)`; the
spreads satisfy

`sigma_x sigma_p >= 1/2`,

with equality only for a Gaussian, for which `sigma_x = sigma`,
`sigma_p = 1/(2 sigma)`. Squeezing `psi(x)` by a factor `s` scales
`sigma_x` by `s` and `sigma_p` by `1/s`, leaving the product fixed.
Shifting `psi` in `x` or boosting it by `k0` moves only the means.

## Numerical method

A centred position grid and matched k-grid; the momentum density is
the direct discrete Fourier transform of psi, then normalised so
`integral |phi|^2 dk = 1`. Variances are computed from the two
densities. N = 192 for display (256 in the headless tests).
Reference: Griffiths, *Introduction to Quantum Mechanics* (3rd ed.),
Sec. 1.6 and 3.5 (`griffiths-qm`).

## Controls

- shape: Gaussian (the minimum), box, triangle, double bump.
- squeeze sigma: the base width (the breathing modulates around it).
- breathing: the live seesaw on/off.
- Reset, Pause.

## Expected qualitative features

- As the position packet narrows, the momentum packet broadens, and
  vice versa, in lockstep.
- For a Gaussian the gauge bar sits exactly on the hbar/2 line at
  every squeeze; the product readout stays 0.5000.
- Box, triangle and double-bump states push the gauge bar above the
  line (strictly more uncertain).

## Invariants and acceptance thresholds

- Gaussian saturates: `sigma_x sigma_p = 1/2` within 2%; the widths
  match `sigma` and `1/(2 sigma)`.
- Every shape obeys `sigma_x sigma_p >= 1/2`.
- Non-Gaussian shapes strictly exceed the Gaussian product by `> 0.02`.
- Squeezing trades width at constant product (within 2.5%).
- The FT is unitary: norm `= 1` in both spaces to 1e-6.
- The product is invariant under a position shift and a momentum
  boost; only the means move.
- Scaling by `s = 2` scales `sigma_x` by 2 and `sigma_p` by 1/2.

## Limiting cases for verification

- Gaussian: the minimum-uncertainty state, product exactly `hbar/2`.
- Sharper position packets give proportionally broader momentum
  packets (the product cannot fall below `hbar/2`).

Source: Griffiths, *Introduction to Quantum Mechanics* (3rd ed.),
Sec. 1.6 (`griffiths-qm`).
