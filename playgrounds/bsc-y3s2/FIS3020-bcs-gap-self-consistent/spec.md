---
title: BCS Gap, Self-Consistent
slug: bcs-gap-self-consistent
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS3020
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: ashcroft-mermin
primary_chapter: 34
hook: 'Cool a superconductor and an energy gap opens self-consistently; its zero-temperature size is locked to the transition temperature by the universal ratio 3.53.'
one_paragraph: 'BCS theory says electrons near the Fermi surface bind into Cooper pairs, opening an energy gap Delta in the excitation spectrum. The gap obeys a self-consistent equation, Delta appears on both sides, so it must be solved by iteration; it is largest at T = 0, shrinks as temperature rises, and vanishes at the critical temperature T_c. BCS predicts a universal ratio 2 Delta_0 / k_B T_c around 3.53 independent of material, confirmed across conventional superconductors. The playground solves the gap equation and traces Delta(T) and the ratio. Reference: Ashcroft and Mermin, Solid State Physics, Ch. 34.'
tags: [solid-state, animation, live-readout]
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
# BCS gap, self-consistent
$\Delta(T)$ from the BCS gap equation; universal ratio $2\Delta_0 / k_B T_c \approx 3.53$. Source: Ashcroft-Mermin Ch. 34 (`ashcroft-mermin`).

## Explainer

### What you are looking at

In a superconductor, electrons pair up and an energy gap opens in the
excitation spectrum: it costs a minimum energy $2\Delta$ to break a
pair. Warm it and the gap shrinks, vanishing exactly at the critical
temperature. The playground solves the gap equation and traces
$\Delta(T)$, with the universal ratio that makes BCS theory so
predictive.

### The self-consistent gap equation

Cooper pairs all share one wavefunction, and the gap $\Delta$ that
binds them depends on the gap itself, so it must be solved
self-consistently. At temperature $T$ the BCS gap equation is

$$\frac{1}{N(0)V}
  = \int_0^{\hbar\omega_D}
  \frac{\tanh\!\big(\sqrt{\xi^2+\Delta^2}/2k_BT\big)}
  {\sqrt{\xi^2+\Delta^2}}\,d\xi,$$

with $N(0)$ the density of states at the Fermi level, $V$ the
attractive coupling, and $\hbar\omega_D$ the phonon cutoff. $\Delta$
appears on both sides, so it is found by iteration.

### Universal behavior

Two limits are exact and parameter-free:

- At $T=0$: $\Delta_0 = 2\hbar\omega_D\,e^{-1/N(0)V}$ (exponentially
  small, the same essential singularity as Cooper pairing).
- The gap closes at $k_B T_c \approx 1.13\,\hbar\omega_D\,
  e^{-1/N(0)V}$.

Divide one by the other and the material-specific factors cancel,
leaving a pure number:

$$\frac{2\Delta_0}{k_B T_c} \approx 3.53.$$

Every conventional (weak-coupling) superconductor obeys this ratio
regardless of which metal it is, one of the cleanest confirmations of
BCS theory. The playground iterates the gap equation and shows
$\Delta(T)$ falling to zero at $T_c$ with the 3.53 ratio.

### Things to try

- Cool from $T_c$ down and watch $\Delta(T)$ rise from zero with the
  characteristic square-root onset near $T_c$.
- Change $N(0)V$ and watch both $\Delta_0$ and $T_c$ move
  exponentially while their ratio stays pinned near 3.53.
- Confirm the gap is exactly zero above $T_c$ (no pairing).

### Where this comes from

The self-consistent BCS gap equation, the $T=0$ and $T_c$ limits, and
the universal $2\Delta_0/k_BT_c \approx 3.53$ ratio follow Ashcroft and
Mermin, *Solid State Physics*, Chapter 34, and Tinkham, *Introduction
to Superconductivity*.
