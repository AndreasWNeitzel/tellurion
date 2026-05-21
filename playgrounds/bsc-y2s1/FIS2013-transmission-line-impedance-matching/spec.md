---
title: Transmission Line Impedance Matching
slug: transmission-line-impedance-matching
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2013
supporting_ucs: []
curriculum_year: bsc-y2s1
primary_citation: jackson1998
primary_chapter: 8
hook: 'Terminate a cable with the wrong resistance and part of every signal bounces back; match the impedance and the reflection vanishes.'
one_paragraph: 'On a transmission line the forward and reflected voltage waves add into a standing-wave pattern set by the load mismatch. The reflection coefficient Gamma = (Z_L - Z_0) / (Z_L + Z_0) controls everything downstream: the standing-wave ratio, the fraction of power actually delivered (1 - |Gamma|^2), and the return loss in dB. The playground draws the standing-wave envelope and these numbers as you vary the load: a matched load Z_L = Z_0 gives Gamma = 0 and full power transfer, while an open or a short reflects all of it. This is the everyday reason antennas and RF chains are impedance-matched. Reference: Jackson, Classical Electrodynamics, Ch. 8.'
tags: [electromagnetism, animation, live-readout]
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

# Transmission line impedance matching

## Explainer

### What you are looking at

Send a signal down a cable into a load that does not "match" and part
of it bounces straight back, setting up standing waves that waste
power and can destroy a transmitter. The playground shows the
forward and reflected waves on a transmission line and how matching
the impedance kills the reflection.

### Reflection at a mismatch

A line of characteristic impedance $Z_0$ terminated in a load $Z_L$
reflects a fraction of the incident wave set by the reflection
coefficient

$$\Gamma = \frac{Z_L - Z_0}{Z_L + Z_0}.$$

Matched ($Z_L=Z_0$): $\Gamma=0$, nothing reflects, all power
delivered. Open or short ($Z_L\to\infty$ or $0$): $|\Gamma|=1$,
total reflection. The forward and reflected waves superpose into a
standing-wave pattern whose peak-to-trough ratio is the standing-wave
ratio

$$\mathrm{SWR} = \frac{1+|\Gamma|}{1-|\Gamma|},$$

1 when matched, infinite when fully reflected.

### Matching with a quarter-wave transformer

Because the line transforms impedance along its length, a section of
line a quarter-wavelength long turns a load into

$$Z_\mathrm{in} = \frac{Z_0^2}{Z_L},$$

so inserting a quarter-wave section of impedance
$Z_0' = \sqrt{Z_0 Z_L}$ between line and load makes the line "see"
$Z_0$ and the reflection vanishes (at that frequency). This is the
quarter-wave transformer, the same idea as anti-reflection optical
coatings and acoustic horn matching. The playground lets you set
$Z_L$ and the matching section and watch $\Gamma$, the SWR, and the
standing-wave envelope collapse to flat when matched.

### Things to try

- Set $Z_L=Z_0$ and see a flat travelling wave (SWR = 1, no
  reflection).
- Open- or short-circuit the load and watch a full standing wave
  (SWR to infinity, nulls fixed in place).
- Insert the $\sqrt{Z_0 Z_L}$ quarter-wave section and watch the
  reflection cancel and the line go flat again.

### Where this comes from

The reflection coefficient, SWR, and the quarter-wave transformer
follow Pozar, *Microwave Engineering*, Chapter 2, and Griffiths,
*Introduction to Electrodynamics*, Chapter 9.

## Physical setup

A coaxial transmission line of characteristic impedance $Z_0 = 50\,\Omega$ terminated by a resistive load $Z_L$. The forward and reflected voltage waves superpose into a standing pattern whose amplitude envelope depends on the mismatch.

## Governing equations

Reflection coefficient: $\Gamma = (Z_L - Z_0) / (Z_L + Z_0)$. VSWR: $(1 + |\Gamma|)/(1 - |\Gamma|)$. Power delivered: $1 - |\Gamma|^2$. Return loss (dB): $-20 \log_{10}|\Gamma|$.

Three special loads:
- $Z_L = Z_0$ (matched): $\Gamma = 0$, VSWR $= 1$, full power transfer.
- $Z_L \to \infty$ (open): $\Gamma \to 1$, VSWR $\to \infty$.
- $Z_L = 0$ (short): $\Gamma = -1$, VSWR $\to \infty$.

## Numerical method

Closed-form. The animation samples $V(x, t) = V_\text{inc}(\cos(\omega t - k x) + \Gamma \cos(\omega t + k x))$ at the rAF frame time; the dashed envelope is $|V(x)| = \sqrt{1 + \Gamma^2 + 2\Gamma\cos(2 k x)}$.

## Controls

- Load impedance $Z_L$ in ohms (1 to 500).

## Expected qualitative features

1. Matched load gives a flat envelope (uniform amplitude).
2. Open / short give a pure standing wave (envelope touches zero at the appropriate nodes).
3. Intermediate $Z_L$ gives a partial standing wave (envelope ripples between two nonzero levels).
4. VSWR readout grows from 1 (matched) toward infinity (open or short).

## Invariants and acceptance thresholds

| invariant | threshold | location |
| matched $Z_L = Z_0$: $\Gamma = 0$ | within $10^{-15}$ | invariants test |
| open $Z_L \to \infty$: $\Gamma \to 1$ | $> 0.999$ | invariants test |
| short $Z_L = 0$: $\Gamma = -1$ | within $10^{-15}$ | invariants test |
| VSWR $= 1$ at matched load | within $10^{-12}$ | invariants test |
| 100 Ohm into 50 Ohm: $|\Gamma| = 1/3$, VSWR $= 2$ | within $10^{-12}$ | invariants test |
| power balance $P_\text{deliv} + \Gamma^2 = 1$ | within $10^{-12}$ | invariants test |
| return-loss infinite at perfect match | exact | invariants test |
| return-loss for VSWR $= 2$ is $\approx 9.54$ dB | within 0.001 | invariants test |
| isMatched within 1 percent tolerance | exact | invariants test |

All confirmed in `invariants.test.mjs` (9 tests passing).

## Limiting cases for verification

- $Z_L = Z_0$: textbook matched-line condition.
- $Z_L = 0$ or $\infty$: textbook standing wave with nodes at quarter-wave distances.
- $Z_L = R \pm j X$ (not modeled here): would land off the real-axis Smith chart.

## Visual fallback

If KaTeX or Canvas2D is unavailable, the slider still works.

## Citations

- Jackson, *Classical Electrodynamics*, 3e, Ch. 8 (`jackson1998`).
- Pozar, *Microwave Engineering*, for the engineering Smith-chart variant.

## Stretch goals

- Complex $Z_L = R + jX$ with Smith-chart overlay.
- Add a quarter-wave transformer demo to match arbitrary loads to $Z_0$.
- Stub-tuner with sliding-short geometry.

## Risk register

- Pure-resistive loads only; the playground deliberately limits to real $Z_L$ to keep the visualization clean. The Smith-chart extension is a stretch goal.
