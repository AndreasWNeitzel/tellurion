---
title: Driven RLC Resonance and Phasors
slug: rlc-resonance-phasors
status: verified
audience: portfolio
created: 2026-06-21
primary_uc: FIS1014
supporting_ucs: []
curriculum_year: bsc-y1s2
primary_citation: griffithsem2017
primary_chapter: 7
hook: "Drive a series RLC circuit and it answers loudest at one frequency, where the inductor and capacitor reactances cancel. The phasor diagram shows V_R, V_L and V_C summing to the source, and the resonance peak narrows as Q rises."
one_paragraph: "A series RLC circuit driven at angular frequency omega has impedance Z = R + i(omega L - 1/omega C), so the current amplitude is V0/|Z| and lags the drive by phi = atan2(omega L - 1/omega C, R). At resonance omega_0 = 1/sqrt(LC) the reactances cancel, |Z| = R is minimal, the current is maximal and in phase. The playground shows the rotating phasor diagram (V_R along the current, V_L leading and V_C lagging by 90 degrees, adding to the source) and the resonance curve of current amplitude versus drive frequency, peaking at f0 with a half-power bandwidth Delta omega = omega_0/Q, where Q = (1/R) sqrt(L/C). At resonance V_L and V_C are equal and opposite, each Q times the source, the voltage magnification behind every tuned circuit and radio receiver."
tags: [electromagnetism, circuits, resonance, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [R, L, C, F]
invariants:
  - key: phasor
    label: the phasor sum V_R + (V_L - V_C) equals the source amplitude
    tolerance: 1e-6
  - key: resonance
    label: at f0 the phase is zero and the current is V0/R
    tolerance: 0.05
  - key: bandwidth
    label: the half-power frequencies are spaced by R/L
    tolerance: 1e-6
what_to_try:
  - Sweep f across the peak: the current marker climbs to the top of the curve at f0 and the source lines up with V_R.
  - Drop R: the peak gets taller and narrower, Q rises, and V_L and V_C balloon past the source.
  - Below f0 the circuit is capacitive (phase negative); above f0 it is inductive (phase positive).
references:
  - "Young and Freedman, University Physics, 14e, Ch. 31 (AC circuits)."
  - "Griffiths, Introduction to Electrodynamics, Fifth ed., Sec. 7.2.4."
---

# Driven RLC resonance and phasors

## Physical setup

A resistor $R$, inductor $L$ and capacitor $C$ in series are driven by an
alternating source $V(t) = V_0 \cos(\omega t)$. In the steady state the current
is sinusoidal at the drive frequency, $I(t) = I_0 \cos(\omega t - \phi)$.

## Equations

The complex impedance is $Z = R + i X$ with reactance $X = \omega L - 1/\omega C$,
so

$$I_0 = \frac{V_0}{|Z|} = \frac{V_0}{\sqrt{R^2 + X^2}}, \qquad
  \phi = \operatorname{atan2}(X, R).$$

The resonance is at $\omega_0 = 1/\sqrt{LC}$ where $X = 0$, $|Z| = R$, the current
is maximal $V_0/R$ and $\phi = 0$. The quality factor and bandwidth are

$$Q = \frac{\omega_0 L}{R} = \frac{1}{\omega_0 R C} = \frac{1}{R}\sqrt{\frac{L}{C}},
  \qquad \Delta\omega = \frac{\omega_0}{Q} = \frac{R}{L}.$$

The component voltage amplitudes $V_R = I_0 R$, $V_L = I_0 \omega L$,
$V_C = I_0/\omega C$ add as phasors: $V_R^2 + (V_L - V_C)^2 = V_0^2$. At resonance
$V_L = V_C = Q V_0$ (equal, opposite, $Q$ times the source).

## Numerical method

Closed form; no engine. The steady-state amplitude, phase and component voltages
are evaluated directly from the impedance at the chosen drive frequency. The
phasor clock rotates only for visual effect; the relative angles and magnitudes
are the exact physics.

## Controls

- Resistance $R$ (5 to 300 Ohm), inductance $L$ (1 to 50 mH), capacitance $C$
  (0.1 to 10 uF), drive frequency $f$ (100 to 5000 Hz). Source amplitude fixed.
  Reset and Pause.

## Expected qualitative features

1. The current amplitude peaks at $f_0 = 1/(2\pi\sqrt{LC})$, where the phase
   crosses zero.
2. Smaller $R$ gives a taller, narrower peak (larger $Q$) and larger $V_L$, $V_C$.
3. The circuit is capacitive ($\phi < 0$) below resonance and inductive
   ($\phi > 0$) above.

## Invariants and acceptance thresholds

- $V_R^2 + (V_L - V_C)^2 = V_0^2$ exactly.
- At $\omega_0$: $X = 0$, $|Z| = R$, $I_0 = V_0/R$, $\phi = 0$.
- The exact half-power frequencies (where $|X| = R$) are spaced by $R/L$.
- The three forms of $Q$ agree.

## Citations

Young and Freedman, University Physics, 14th ed., Ch. 31. Griffiths,
Introduction to Electrodynamics, 5th ed., Sec. 7.2.4.
