---
title: The Heisenberg Uncertainty Seesaw
slug: heisenberg-uncertainty-visualizer
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Squeeze the wavepacket thin in position and it explodes in momentum: the product never drops below hbar/2, and only the Gaussian touches the floor.'
one_paragraph: 'A quantum state shown in both conjugate spaces at once: the position wavefunction |psi(x)|^2 and its Fourier transform |phi(k)|^2, with the standard deviations sigma_x and sigma_p drawn as extent bars. A slow breathing modulates the squeeze so the seesaw is live, as the position packet narrows the momentum packet must broaden. Because the momentum-space amplitude is the Fourier transform of the position one, narrowing a packet in x necessarily widens it in p. A gauge tracks the product sigma_x sigma_p against the hbar/2 floor it can never cross: a Gaussian sits exactly on the bound (the minimum-uncertainty state), while a box, triangle or double-bump state sits strictly above it. Reference: Griffiths, Introduction to Quantum Mechanics, Chapter 3; Cohen-Tannoudji, Quantum Mechanics, Chapter 1.'
tags: [quantum, fourier, animation, multi-panel, live-readout]
difficulty: 4
tier: hero
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-3Y-1S'
primary_uc: FIS3003
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

# The Heisenberg Uncertainty Seesaw

## Explainer

### What you are looking at

A quantum wavepacket shown twice at once: its shape in position and its
shape in momentum. Squeeze it narrow in position and it spreads wide in
momentum, and vice versa. You cannot make both narrow. That is the
Heisenberg uncertainty principle, and here it is a literal seesaw you
operate.

### Why the two are linked

The momentum-space wavefunction is the Fourier transform of the
position-space one:

$$\phi(k) = \frac{1}{\sqrt{2\pi}}\int \psi(x)\,e^{-ikx}\,dx.$$

A basic fact of Fourier transforms is that you cannot localize a
function and its transform simultaneously: a narrow $\psi(x)$ has a
broad $\phi(k)$. Quantifying the widths by their standard deviations
gives the exact bound

$$\sigma_x\,\sigma_p \ge \frac{\hbar}{2},$$

with equality only for a Gaussian. So the principle is not about clumsy
measurement; it is a theorem about waves.

### The seesaw

Squeeze $\psi(x)$ by a factor $s$ and $\sigma_x \to s\,\sigma_x$ while
$\sigma_p \to \sigma_p/s$: the product is pinned. Shifting the packet
in $x$ or boosting it by $k_0$ moves only the means, never the widths,
so the bound is untouched. Non-Gaussian shapes (box, triangle, double
bump) sit strictly above the bound, $\sigma_x\sigma_p > \hbar/2$. The
playground shows both densities and the live product as you squeeze,
shift, and reshape, and the product never drops below $\hbar/2$.

### Things to try

- Pick a Gaussian and squeeze it: watch one density narrow while the
  other widens, the product frozen at exactly $\hbar/2$.
- Switch to a box or triangle and see the product sit above the bound
  (Gaussian is optimal).
- Shift or boost the packet and confirm the widths, hence the
  product, do not change.

### Where this comes from

The Fourier-pair argument and the $\sigma_x\sigma_p \ge \hbar/2$ bound
(saturated by the Gaussian) follow Griffiths, *Introduction to Quantum
Mechanics*, Chapter 3.

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
Sec. 1.6 and 3.5.

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
Sec. 1.6.
