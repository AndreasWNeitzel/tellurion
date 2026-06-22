---
title: "Parametric Resonance: Pumping a Swing"
slug: parametric-resonance-swing
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS1013
curriculum_year: bsc-y1s1
primary_citation: landau-mechanics
primary_chapter: 27
hook: "Pump a swing by crouching twice per arc and it grows without a push. Parametric resonance turns a periodic squeeze of the frequency into exponential growth."
one_paragraph: "Modulating a pendulum's natural frequency in time gives the Mathieu equation theta'' + 2 beta theta' + omega0^2 (1 + h cos(omegaD t)) theta = 0. When the drive frequency is near twice the natural frequency and the depth h exceeds a damping-set threshold, the amplitude grows exponentially: parametric resonance. The playground integrates the swing (length pumped) and plots the log-amplitude envelope, while the Ince-Strutt stability chart of the Mathieu equation shows the resonance tongues at a = n^2 with the operating point (a, q) marked inside or outside. Floquet analysis gives the growth per period."
tags: [classical-mechanics, oscillations, parametric-resonance, mathieu, pendulum, floquet, interactive, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: [r, h, beta]
invariants:
  - key: tongue
    label: the principal Mathieu tongue at a=1 is unstable with modulation
    tolerance: 0.0
  - key: damping
    label: enough damping stabilizes a shallow tongue point
    tolerance: 0.0
  - key: conserve
    label: the integrator conserves energy when h = beta = 0
    tolerance: 1e-4
what_to_try:
  - Set the drive ratio to 2 (pump twice per swing); the amplitude grows exponentially.
  - Detune to 1.6 or 2.4; the dot leaves the tongue and the swing dies away.
  - Raise the depth h; the dot moves into the tongue and growth accelerates.
  - Raise the damping; the threshold lifts and a once-growing setting decays.
references:
  - "Landau and Lifshitz, Mechanics, 3rd ed., Butterworth-Heinemann, 1976, section 27."
  - "Bender and Orszag, Advanced Mathematical Methods, Ch. 11 (Mathieu equation)."
---

# Parametric resonance: pumping a swing

## Physical setup

A damped pendulum (natural frequency omega0, damping beta) whose frequency is modulated
periodically at frequency omegaD and depth h, as when a child pumps a swing.

## Equations

$$ \ddot\theta + 2\beta\dot\theta + \omega_0^2\,(1 + h\cos\omega_d t)\,\theta = 0. $$

In scaled time $\tau = \omega_d t/2$ this is the Mathieu equation
$\theta'' + 2\gamma\theta' + (a - 2q\cos2\tau)\theta = 0$ with $a=(2\omega_0/\omega_d)^2$,
$q=ah/2$, $\gamma=2\beta/\omega_d$. Floquet analysis of one period gives the growth per
period; instability (exponential growth) lives in tongues at $a=n^2$, strongest at $a=1$.

## Numerical method

The swing is integrated by RK4 in real time; the amplitude envelope is rescaled to avoid
overflow. The stability chart and the growth per period come from the monodromy matrix
(Floquet multipliers) of one drive period.

## Controls

- Drive ratio omegaD/omega0; modulation depth h; damping beta; play / pause.

## Expected qualitative features

1. At drive ratio 2 (a=1) the amplitude grows exponentially.
2. Detuning moves the operating point out of the tongue and the swing decays.
3. Deeper modulation pushes the point further into the tongue (faster growth).
4. Damping lifts the instability threshold.

## Invariants and acceptance thresholds

- The principal tongue at $a=1$ is unstable with modulation (growth > 1).
- Sufficient damping stabilizes a shallow tongue point.
- The integrator conserves energy when $h=\beta=0$.

## Citations

Landau and Lifshitz, Mechanics, 3rd ed., section 27.
Bender and Orszag, Advanced Mathematical Methods, Ch. 11.
