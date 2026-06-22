---
title: Quantum Wavepacket Revivals
slug: quantum-revival-carpet
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS3003
curriculum_year: bsc-y3s1
primary_citation: griffiths-qm
primary_chapter: 2
hook: "A wavepacket in a box smears into noise, then snaps back to its exact starting shape. Watch the quantum carpet weave its revivals over position and time."
one_paragraph: "A localized wavepacket in an infinite square well evolves as a sum of stationary states with energies E_n = n^2 E_1. The quadratic spectrum makes every phase realign at the revival time T_rev = 2 pi hbar / E_1, and at rational fractions of it the packet splits into scaled copies (fractional revivals). The playground paints |psi(x,t)|^2 as the quantum carpet over position and time, with the live density and a now-line above it, and plots the survival probability that peaks at the full and fractional revivals."
tags: [quantum-mechanics, infinite-well, wavepacket, revival, quantum-carpet, fourier, animation, live-readout]
difficulty: 4
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: [x0, k0]
invariants:
  - key: revival
    label: the survival probability returns to 1 at the full revival T_rev
    tolerance: 1e-3
  - key: start
    label: the survival probability is 1 at t=0
    tolerance: 1e-6
  - key: norm
    label: the total probability is conserved as the packet evolves
    tolerance: 1e-2
what_to_try:
  - Run a full period; the packet snaps back to its starting shape at T_rev.
  - Watch the half and third points; the packet reforms as mirror or multiple copies.
  - Add momentum k0; the carpet fills with steeper diagonal canals.
  - Compare the slice and survival plot; the density is sharpest where survival peaks.
references:
  - "Griffiths, Introduction to Quantum Mechanics, 3rd ed., Cambridge, 2018, Ch. 2."
  - "Robinett, Quantum wave packet revivals, Phys. Rep. 392, 1 (2004)."
---

# Quantum wavepacket revivals

## Physical setup

A particle in a one-dimensional infinite square well [0, L], prepared as a localized
Gaussian wavepacket and evolved under the time-dependent Schrodinger equation.

## Equations

With $\psi_n(x)=\sqrt{2/L}\sin(n\pi x/L)$ and $E_n = n^2 E_1$,

$$ \psi(x,t)=\sum_n c_n\psi_n(x)e^{-iE_n t/\hbar}, \qquad T_\mathrm{rev}=\frac{2\pi\hbar}{E_1}. $$

Because $E_n\propto n^2$, all phases realign at $T_\mathrm{rev}$ (full revival), and at
$t = (p/q)T_\mathrm{rev}$ the state is a superposition of scaled copies (fractional revivals).

## Numerical method

The initial packet is projected onto the first 40 eigenstates by quadrature; the carpet
sums the eigenstate series on a 240 by 200 grid (units hbar = 1, E_1 = 1, L = 1). The
survival probability uses $|\sum_n |c_n|^2 e^{-iE_n t}|^2$.

## Controls

- Start position x0; start momentum k0; play / pause.

## Expected qualitative features

1. The packet smears, then reassembles exactly at T_rev.
2. Fractional revivals form mirror or multiple copies at t = T_rev/2, /3, /4.
3. Momentum adds diagonal canals to the carpet.
4. The survival probability peaks where the density is sharpest.

## Invariants and acceptance thresholds

- Survival probability returns to 1 at T_rev (to 1e-3) and is 1 at t=0.
- Total probability conserved in time (to 1e-2).

## Citations

Griffiths, Introduction to Quantum Mechanics, 3rd ed., Ch. 2.
Robinett, Quantum wave packet revivals, Phys. Rep. 392, 1 (2004).
