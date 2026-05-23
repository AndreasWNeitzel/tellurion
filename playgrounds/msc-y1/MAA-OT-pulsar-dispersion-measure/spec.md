---
title: "Pulsar Dispersion Measure Dedispersion"
slug: pulsar-dispersion-measure
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: MAA-OT
supporting_ucs: [MAA-AS]
curriculum_year: msc-y1
hook: 'A radio pulse sweeps from high to low frequency through the ionized interstellar medium; dedispersion realigns the channels to a single sharp spike.'
one_paragraph: 'Delay Delta t = DM / (2.41e-4) (1/f_MHz^2 - 1/f_ref^2) ms; the dynamic spectrum shows the f^-2 sweep, the dedispersed time series peaks sharply at the true DM and flattens out everywhere else.'
tags: [stellar, radio-astronomy, animation, live-readout]
difficulty: 3
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [dm]
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

# Pulsar Dispersion Measure Dedispersion

Dynamic spectrum: frequency vertical (400 to 1600 MHz), time horizontal. The pulse arrives later at lower frequencies, tracing the classic $\propto f^{-2}$ DM sweep. Below, the dedispersed time series shifts each channel by the chosen DM and sums; correct DM gives a sharp narrow spike, wrong DM gives a smeared blob. Presets for Crab, B1937+21, Vela, FRB-like DM = 500.

## Explainer

### What you are looking at

A pulsar emits a sharp radio flash, but by the time it reaches Earth the
flash is smeared across frequency: low frequencies arrive later because
the ionized interstellar medium slows them. Correct for that delay (de-
disperse) and the smear collapses back into a sharp spike. The playground
shows the dispersed sweep and lets you tune the correction.

### The dispersion delay

Radio waves travel through a cold plasma of free electrons slightly
slower than $c$, and more so at lower frequency. The arrival delay
relative to infinite frequency is

$$\Delta t(f) = \frac{\mathrm{DM}}{2.41\times10^{-4}}
  \left(\frac{1}{f_\mathrm{MHz}^2}
  - \frac{1}{f_\mathrm{ref}^2}\right)\ \text{ms},$$

where the dispersion measure

$$\mathrm{DM} = \int_0^d n_e\,d\ell$$

is the integrated free-electron column to the source. The signature is
the $f^{-2}$ law: a flash sweeps from high to low frequency along a
parabola in the (frequency, time) plane.

### De-dispersion and why DM matters

To recover the pulse you shift every frequency channel back by
$\Delta t(f)$ for an assumed DM and sum. The right DM aligns all
channels and the power adds coherently into a tall narrow spike; the
wrong DM leaves residual slopes and the sum is a smeared low blob. So
DM is both a nuisance to remove and a measurement: it gives the
electron column to the pulsar (a rough distance via a Galactic
electron model), and for fast radio bursts the large extragalactic DM
encodes the cosmic ionized baryon content. The playground sweeps DM
(Crab, Vela, B1937+21, an FRB-like DM=500) and shows the spike sharpen
at the correct value.

### Things to try

- Watch the dispersed pulse trace the $f^{-2}$ parabola across the
  dynamic spectrum.
- Tune DM to the correct value and watch the de-dispersed sum snap
  into a sharp spike.
- Detune DM slightly and watch the spike smear: the sensitivity that
  makes DM a precise observable.

### Where this comes from

The cold-plasma dispersion delay, the dispersion measure, and
incoherent de-dispersion follow Lorimer and Kramer, *Handbook of
Pulsar Astronomy*, Chapter 4.

## Physical setup

Dispersion delay $\Delta t = \mathrm{DM}/(2.41 \times 10^{-4}) (1/f_\mathrm{MHz}^2 - 1/f_\mathrm{ref}^2)$ ms with DM in pc cm$^{-3}$. Dedispersion: shift each frequency channel by $-\Delta t$ before summing. Scattering broadening: convolve channels with exponential tail $\tau_s \propto f^{-4}$.

## Controls

- DM slider (0 to 1000 pc cm$^{-3}$)
- Intrinsic pulse width, center frequency, scattering timescale
- Find-DM button: grid search for the DM maximizing dedispersed peak

## Invariants

- Delay from 400 to 1400 MHz at DM = 100 matches the analytic formula within 0.1%.
- Dedispersed SNR maximum at the true DM; monotone decrease as DM departs by 10%.
- Scattering scales as $f^{-4}$ within 2%.

## Citations

Lorimer & Kramer, "Handbook of Pulsar Astronomy" ch. 4.
