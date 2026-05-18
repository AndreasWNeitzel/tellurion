---
title: Beats from Superposition of Close Frequencies
slug: beats-superposition
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: [FIS2016]
curriculum_year: bsc-y1s1
hook: "Play two notes a hair apart and you do not hear two notes: you hear one note that throbs, loud-soft-loud, at the difference frequency. That throb is beats, and it is how a piano tuner zeroes a string by ear."
one_paragraph: "Add two cosines of nearby frequency f1 and f2 and a trig identity rewrites the sum as a fast carrier at the average frequency times a slow envelope at half their difference: y = 2 cos(2 pi f_bar t) cos(2 pi f_b t). The ear cannot follow the fast carrier but does hear the envelope, so the tone seems to swell and fade, the beats, at the rate |f1 - f2| (0.3 Hz for the defaults here). The top panel overlays the two component waves so you can watch them drift in and out of step; the middle panel shows their sum hugging the slow envelope; the bottom panel is the spectrum, two close lines whose spacing is the beat rate. The time window scrolls like an oscilloscope so the envelope visibly marches past. Tuning a guitar or piano by ear is exactly this: adjust one string until the beats slow to a standstill, meaning the two frequencies have matched."
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Beats from superposition of close frequencies

## Explainer

### What you are looking at

Play two notes that are almost, but not quite, in tune and you hear
the loudness pulse, wah-wah-wah. Those are beats, and they are pure
wave addition: two steady tones summing to one tone whose volume
throbs. The playground sums two close frequencies and shows the
combined wave and its slow amplitude envelope.

### The superposition

Add two equal-amplitude harmonic signals of nearby frequencies
$f_1,f_2$:

$$y(t) = \cos(2\pi f_1 t) + \cos(2\pi f_2 t).$$

A sum-to-product identity rewrites this as a single fast oscillation
times a slow envelope:

$$y(t) = 2\,
  \underbrace{\cos\!\big(2\pi f_\mathrm{beat}\,t\big)}
  _{\text{slow envelope}}\;
  \underbrace{\cos\!\big(2\pi \bar f\,t\big)}
  _{\text{fast carrier}},$$

with the carrier at the average frequency $\bar f=(f_1+f_2)/2$ and
the envelope at the half-difference $f_\mathrm{beat}=|f_1-f_2|/2$.

### Why you hear a beat frequency of |f1 - f2|

The ear responds to loudness, which tracks the envelope's magnitude
$|\cos(2\pi f_\mathrm{beat}t)|$. Because the absolute value folds the
envelope, the loudness peaks twice per envelope cycle, so the audible
beat rate is the full frequency difference:

$$f_\mathrm{beats} = |f_1 - f_2|.$$

This is exactly how a musician tunes by ear: detune until the beats
slow to zero (the frequencies match). It is also the same math as
amplitude modulation in radio and the moire/aliasing you see when two
gratings overlap. The playground lets you set $f_1$ and $f_2$ and
watch the carrier, the envelope, and the beat rate change as the two
frequencies approach.

### Things to try

- Bring $f_2$ toward $f_1$ and watch the beats slow down, then
  vanish at exact unison (the tuning principle).
- Separate the frequencies and watch the beat rate equal $|f_1-f_2|$
  exactly.
- Note the fast carrier sits at the average frequency while only the
  slow envelope changes with the detuning.

### Where this comes from

The superposition of close frequencies and the beat phenomenon follow
French, *Vibrations and Waves*, Chapter 5, and Halliday, Resnick and
Walker, *Fundamentals of Physics*, Chapter 17.

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
