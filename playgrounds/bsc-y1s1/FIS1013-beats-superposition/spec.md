---
title: Beats from Superposition of Close Frequencies
slug: beats-superposition
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: [FIS2016]
curriculum_year: bsc-y1s1
---

# Beats from superposition of close frequencies

## Physical setup

Two harmonic signals of nearby frequencies, summed:
  y(t) = cos(2 pi f_1 t) + cos(2 pi f_2 t)

By a trig identity:
  y(t) = 2 cos(2 pi f_bar t) cos(2 pi f_b t)

with carrier f_bar = (f_1 + f_2) / 2 and envelope rate f_b = |f_1 - f_2| / 2.
The audible beat rate is 2 f_b = |f_1 - f_2| because the human ear hears
amplitude modulation, which has a maximum twice per envelope period.

## Governing equations

Above. No ODE; everything is closed form.

## Numerical method

None. Closed-form evaluation of cosines at sample points.

## Controls

- f_1: slider 3 to 7 Hz, default 5.0.
- f_2: slider 3 to 7 Hz, default 4.7.
- speed: cursor advance per frame, 1 to 6.

## Expected qualitative features

1. Distinct |f_1 - f_2|: clear beat envelope with period 1 / |f_1 - f_2|.
2. f_1 = f_2: beats vanish; sum is 2 cos(2 pi f t).
3. As f_2 approaches f_1, the envelope period stretches without bound.
4. Spectrum panel shows two bars at f_1 and f_2.

## Invariants and acceptance thresholds

1. Product-to-sum identity exact to 1e-12 over 100 sample points.
2. Envelope zero crossings at (2k + 1) / (2 |f_1 - f_2|) within 1e-12.
3. f_1 = f_2 limit: sum = 2 cos(2 pi f t) within 1e-12.
4. envelopeFreq, beatRate, carrierFreq compute correctly to 1e-12.
5. Sample arrays correctly sized and time-spanning.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- f_1 = f_2: no beats, period = 1 / f.
- f_2 = 0: y(t) = cos(2 pi f_1 t) + 1.

## Visual fallback

Canvas2D only. Three stacked panels: individual harmonics (top), sum with
envelope shadow (middle), frequency spectrum (bottom).

## Citations

- Crawford, Waves and Oscillations, Berkeley Physics Vol. 3 Ch. 1
  (`crawford-waves`).
- French, Vibrations and Waves Ch. 1 (alternate).

## Stretch goals

- Audio playback for ear-training.
- Three-frequency superposition.
- Animated envelope-frequency arrow.

## Risk register

- Spectrum panel uses bars at exact f_1, f_2; no FFT is computed.
- For f_1 = f_2 the cursor would suggest no beat; explicit annotation handles.
