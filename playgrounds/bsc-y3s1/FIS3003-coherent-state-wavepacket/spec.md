---
title: The Coherent State
slug: coherent-state-wavepacket
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS3003
curriculum_year: bsc-y3s1
primary_citation: griffiths-qm
primary_chapter: 3
hook: "The one quantum state that acts like a classical particle. A Gaussian that slides back and forth in the well, oscillating forever without ever spreading."
one_paragraph: "A coherent (Glauber) state of the harmonic oscillator is a displaced ground state: a minimum-uncertainty Gaussian of fixed width sigma_0 = sqrt(hbar/2m omega) whose centre follows the classical orbit <x>(t) = x0 cos(omega t) and <p>(t) = -m omega x0 sin(omega t) without spreading. The playground animates |psi|^2 (and the real part) sloshing in the parabolic well between the turning points, and plots the phase-space point (<x>, <p>) tracing its energy ellipse with the kinetic and potential energy trading off at fixed sum. Exact closed form, hbar = m = 1."
tags: [quantum-mechanics, harmonic-oscillator, coherent-state, wavepacket, phase-space, interactive, animation, live-readout]
difficulty: 4
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: [x0, omega]
invariants:
  - key: width
    label: the position variance stays at sigma_0^2 (the packet never spreads)
    tolerance: 1e-4
  - key: orbit
    label: the phase point (<x>,<p>) lies on its energy ellipse
    tolerance: 1e-6
  - key: ehrenfest
    label: d<x>/dt = <p>/m (Ehrenfest)
    tolerance: 1e-5
what_to_try:
  - Watch the packet cross the centre; it keeps the same width throughout.
  - Follow the real part; dense wiggles where momentum is large, smooth at the turns.
  - Raise the amplitude x0; the packet shrinks against its swing (classical limit).
  - Raise omega; the well stiffens and the packet is squeezed narrower.
references:
  - "Griffiths, Introduction to Quantum Mechanics, 3rd ed., Cambridge, 2018, Problem 3.35."
  - "Cohen-Tannoudji, Diu, Laloe, Quantum Mechanics, Complement G_V."
  - "Shankar, Principles of Quantum Mechanics, 2nd ed., Ch. 21."
---

# The coherent state

## Physical setup

The one-dimensional harmonic oscillator, $H = p^2/2m + \tfrac12 m\omega^2 x^2$, prepared
in a coherent (Glauber) state: the ground state displaced in phase space by $\alpha$.
Natural units $\hbar = m = 1$.

## Equations

The probability density stays a Gaussian of fixed width that rides the classical orbit,

$$ |\psi(x,t)|^2 = \sqrt{\tfrac{\omega}{\pi}}\,e^{-\omega (x-\langle x\rangle)^2}, \quad \langle x\rangle = x_0\cos\omega t,\ \langle p\rangle = -\omega x_0\sin\omega t, $$

with $\sigma_0 = \sqrt{1/2\omega}$ and energy $E = \omega(|\alpha|^2 + \tfrac12)$,
$|\alpha|^2 = \tfrac12\omega x_0^2$.

## Numerical method

Closed-form evaluation of the analytic coherent state; no time integration. The width
invariant is checked by quadrature of the variance.

## Controls

- Amplitude x0 (sets |alpha|); frequency omega; toggle the real part of psi.

## Expected qualitative features

1. The packet oscillates between the turning points without spreading.
2. The real part wiggles fastest at the centre, smoothest at the turns.
3. The phase point traces a closed ellipse; KE and PE trade off at fixed sum.
4. Larger x0 approaches the classical point particle; larger omega narrows the packet.

## Invariants and acceptance thresholds

- Position variance fixed at $\sigma_0^2$ to 1e-4 (no spreading).
- Phase point on the energy ellipse to 1e-6.
- Ehrenfest $d\langle x\rangle/dt = \langle p\rangle$ to 1e-5.

## Citations

Griffiths, Introduction to Quantum Mechanics, 3rd ed., Problem 3.35.
Cohen-Tannoudji, Diu, Laloe, Quantum Mechanics, Complement G_V.
Shankar, Principles of Quantum Mechanics, 2nd ed., Ch. 21.
