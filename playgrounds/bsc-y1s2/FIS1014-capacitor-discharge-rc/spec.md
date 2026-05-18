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
hook: "Charge a capacitor, then let it dump through a resistor. The voltage does not fall steadily; it decays exponentially, losing the same fraction every time constant tau = RC, the heartbeat of every timing circuit."
one_paragraph: "A charged capacitor C discharging through a resistor R obeys V(t) = V0 e^{-t/RC}. The decay is exponential, not linear: after one time constant tau = RC the voltage is down to 1/e (about 37 percent), after 5 tau it is effectively zero, and the shape is the same whatever V0 is. The playground shows the RC circuit and the V(t) curve building, with a dashed marker at t = tau crossing the curve at the 37 percent point and a readout of R, C and tau (tau = R C, so 10 kOhm times 10 uF gives 0.1 s). Larger R or C means a slower decay. This single exponential sets the timing of camera flashes, switch debouncers and oscillators, and describes the leak of charge through any real insulator."
tags: [electromagnetism, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
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
