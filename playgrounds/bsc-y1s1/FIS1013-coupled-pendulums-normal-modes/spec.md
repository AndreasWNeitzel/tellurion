---
title: Coupled Pendulums and Normal Modes
slug: coupled-pendulums-normal-modes
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: [FIS2016]
curriculum_year: bsc-y1s1
primary_citation: french-waves
primary_chapter: 5
hook: "Tie two identical pendulums together with a weak spring, start only one swinging, and within seconds the first is still while the second swings. The energy sloshes back and forth: normal modes and beats made visible."
one_paragraph: "Two identical pendulums are linked by a weak spring. Coupled, the system has two normal modes: a symmetric one (both swing together, the spring never stretches, frequency sqrt(g/L)) and an antisymmetric one (they swing exactly opposite, the spring works hardest, a higher frequency). Any motion is a mix of the two. Start just one pendulum moving and it is an equal blend of both modes; because the modes have slightly different frequencies they drift in and out of step, so the energy beats fully from one pendulum to the other and back, with period 2 pi / (omega_minus - omega_plus). The panels show the two pendulums, an energy-share bar (watch it slosh), a phase portrait that is a straight line for a pure mode and a Lissajous loop for the mix, and the angle traces under their slow beat envelope. Stiffer coupling or longer pendulums change the beat period."
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Coupled pendulums and normal modes

## Physical setup

Two identical pendulums of length $L$ and mass $m$, coupled by a spring of constant $k$ attached at distance $d$ from each pivot. Small-angle linearized EOM:

$$m L^2 \ddot\theta_1 = -m g L \theta_1 - k d^2 (\theta_1 - \theta_2),$$
$$m L^2 \ddot\theta_2 = -m g L \theta_2 - k d^2 (\theta_2 - \theta_1).$$

Normal modes:
$$\omega_+ = \sqrt{g/L} \quad (\theta_1 = \theta_2, \text{symmetric}),$$
$$\omega_- = \sqrt{g/L + 2 k d^2 / (m L^2)} \quad (\theta_1 = -\theta_2, \text{antisymmetric}).$$

For the asymmetric initial condition $\theta_1 = A$, $\theta_2 = 0$, the system is a superposition of both modes; the energy beats between pendulums with period $T_\text{beat} = 2 \pi / (\omega_- - \omega_+)$.

## Numerical method

RK4 at $\Delta t = 1/240$ s on the 4-dimensional linearized state $(\theta_1, \theta_2, \dot\theta_1, \dot\theta_2)$. Energy conservation is verified to $10^{-6}$ relative over 10 s.

## Controls

- $k$ in N/m (0 to 20).
- $d / L$ ratio (0.1 to 1.0).
- Three initial-condition buttons: asymmetric (transfers energy), symmetric (in-phase mode), antisymmetric (opposite-phase mode).

## Expected qualitative features

1. Symmetric IC: both bobs swing in lockstep forever; period is $2\pi / \omega_+$.
2. Antisymmetric IC: opposite phase, faster oscillation at $\omega_-$.
3. Asymmetric IC: full beating - pendulum 1 starts swinging alone, pendulum 2 grows, and after $T_\text{beat}/2$ pendulum 2 has most of the amplitude.
4. Decoupling: $k = 0$ leaves the pendulums independent; no energy transfer.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| $\omega_+ = \sqrt{g/L}$ | within $10^{-12}$ | invariants test |
| $\omega_- = \sqrt{g/L + 2 k d^2 / (m L^2)}$ | within $10^{-12}$ | invariants test |
| symmetric IC preserves $\theta_1 = \theta_2$ over 5 s | within $10^{-6}$ | invariants test |
| antisymmetric IC preserves $\theta_1 = -\theta_2$ | within $10^{-6}$ | invariants test |
| beat period $T_\text{beat} = 2\pi / (\omega_- - \omega_+)$ | within $10^{-12}$ | invariants test |
| energy conservation over 10 s | within $10^{-6}$ relative | invariants test |
| half-beat-period envelope transfer | $|\theta_2|_\text{env} > 0.08$ | invariants test |
| $k = 0$ decouples (no energy transfer) | within $10^{-6}$ | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $k = 0$: two independent pendulums, $\omega_- = \omega_+$, $T_\text{beat} \to \infty$.
- $k \to \infty$: $\omega_-$ grows without bound; antisymmetric mode becomes very stiff.
- Both pendulums released from rest at the same angle: stays in symmetric mode forever.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders and buttons still operate.

## Citations

- French, *Vibrations and Waves* (MIT Introductory Physics), Ch. 5 (`french-waves`).
- Crawford, *Waves* (Berkeley Vol. 3), Ch. 1-2 (`crawford-waves`) for the canonical normal-mode treatment.

## Stretch goals

- Three or more coupled pendulums (N-mode chain).
- Add damping via a velocity-proportional term.
- Switch to the full nonlinear EOM (sin theta) to show mode mixing at large amplitudes.

## Risk register

- Linearized EOM diverges from the full sin-theta dynamics for $\theta > 0.3$ rad; amplitudes are capped to keep the linear approximation valid.
