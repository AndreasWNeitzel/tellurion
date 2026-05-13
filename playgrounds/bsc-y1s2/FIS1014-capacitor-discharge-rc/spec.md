---
title: Capacitor Discharge through a Resistor
slug: capacitor-discharge-rc
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1014
supporting_ucs: []
curriculum_year: bsc-y1s2
primary_citation: griffithsem2017
primary_chapter: 7
---

# RC discharge

## Physical setup

A capacitor of capacitance $C$ charged to $V_0$ is suddenly connected across a resistor of resistance $R$. Kirchhoff's voltage law gives the first-order linear ODE
$$R \dot Q + Q/C = 0,$$
whose closed-form solution is
$$V_C(t) = V_0 \exp(-t / \tau), \qquad \tau = R C.$$

The current is $I(t) = V_C(t)/R = (V_0/R) \exp(-t/\tau)$. The total energy initially stored in the capacitor, $U_C(0) = \tfrac{1}{2} C V_0^2$, is dissipated as heat in $R$.

## Numerical method

Closed-form. No time integration; the animation just samples $V(t)$ at the rAF-frame time.

## Controls

- $V_0$ in volts (1 to 50).
- $R$ in kOhm (0.1 to 100).
- $C$ in uF (0.1 to 100).
- Reset (restart the clock) and Play/Pause.

## Expected qualitative features

1. $V(t)$ is a textbook decaying exponential with $V(\tau) = V_0/e \approx 0.37 V_0$.
2. The marker dot tracks $V$ as $t$ advances; when $t > 7\tau$ the clock loops.
3. Changing $R$ or $C$ proportionally rescales the time axis (same shape).
4. The capacitor-charge cloud size on the left visually shrinks with $V$.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| $V(0) = V_0$ | exact | invariants test |
| $V(\tau) = V_0/e$ | within $10^{-12}$ | invariants test |
| energy conservation $U_C(t) + W_\text{diss}(t) = U_C(0)$ | within $10^{-12}$ | invariants test |
| $t_{1/2} = \tau \ln 2$ | exact | invariants test |
| $I = V_C/R$ at all $t$ | within $10^{-12}$ | invariants test |
| 99 percent discharge takes $\sim \ln(100) \tau$ | within $10^{-12}$ | invariants test |
| $\int_0^\infty P(t)\,dt = U_C(0)$ | within $10^{-12}$ | invariants test |

All confirmed in `invariants.test.mjs` (7 tests passing).

## Limiting cases for verification

- $R \to 0$ with $V_0 > 0$: $\tau \to 0$, instantaneous discharge, infinite current (idealized).
- $R \to \infty$: $\tau \to \infty$, capacitor essentially holds charge.
- $V_0 = 0$: trivial, $V(t) = 0$ for all $t$.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders still work.

## Citations

- Griffiths, *Introduction to Electrodynamics*, 5e, Ch. 7 (`griffithsem2017`).

## Stretch goals

- LC oscillation (no resistor): sinusoidal $V(t) = V_0 \cos(t/\sqrt{LC})$.
- RLC underdamped oscillator with the damping ratio adjustable.
- AC steady-state for sinusoidal source.

## Risk register

- The animation loops after $t = 7\tau$, which is enough for $V$ to fall below 0.1 percent of $V_0$. Adjusting $R$ or $C$ mid-loop resets the clock to keep timing meaningful.
