---
title: Rectangular Waveguide Modes
slug: waveguide-mode-animator
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Drop below the cutoff and the wave simply stops dead in the pipe: no propagation, only an evanescent skin.'
one_paragraph: 'A hollow rectangular waveguide carries only discrete TE and TM modes. Each has a cutoff frequency f_c = (c/2) sqrt((m/a)^2 + (n/b)^2); above it the mode propagates at the guide wavelength lambda_g = 2 pi / beta (longer than free space), below it beta is imaginary and the field is evanescent, carrying no power. The primary scene is physical: the transverse field map of the chosen mode in the a x b cross-section and a longitudinal strip showing the wave travelling down the guide or decaying when below cutoff. The side panel is the mode-cutoff spectrum with the operating frequency, so single-mode operation is visible. Reference: Jackson, Classical Electrodynamics, 3rd ed., Chapter 8; Pozar, Microwave Engineering, Chapter 3.'
tags: [electromagnetism, waveguide, multi-panel, live-readout]
difficulty: 3
tier: advanced
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
curriculum_year: 'L:F-2Y-2S'
primary_uc: FIS2006
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

# Rectangular Waveguide Modes

## Explainer

### What you are looking at

A hollow metal pipe can carry microwaves, but only above a sharp
cutoff frequency and only in specific field patterns called modes.
Below the cutoff the wave does not travel at all; it dies away inside
the pipe. The playground shows each mode's field and the
propagating-versus-dead transition.

### Cutoff and the guide wavelength

A rectangular guide of width $a$ and height $b$ supports transverse-
electric (TE) and transverse-magnetic (TM) modes labelled by integers
$(m,n)$. Each has a cutoff frequency

$$f_c=\frac{c}{2}\sqrt{\Big(\frac{m}{a}\Big)^2+\Big(\frac{n}{b}\Big)^2}.$$

Above $f_c$ the axial propagation constant
$\beta=\frac{2\pi}{c}\sqrt{f^2-f_c^2}$ is real and the wave travels
with a guide wavelength

$$\lambda_g=\frac{2\pi}{\beta}\;>\;\lambda_0,$$

longer than in free space, diverging to infinity as $f\to f_c$. Below
$f_c$, $\beta$ becomes imaginary: the field decays as
$e^{-\alpha z}$ and carries no power (evanescent).

### Which mode dominates

TE modes need $(m,n)$ not both zero; TM modes need $m\ge1$ and
$n\ge1$. For a guide wider than it is tall ($a>b$) the lowest cutoff
belongs to TE$_{10}$, the dominant mode, a single half-sine across the
broad wall. Operating between the TE$_{10}$ and TE$_{20}$ cutoffs
gives clean single-mode transmission.

### Things to try

- Sweep the frequency down through a mode's cutoff and watch the
  travelling wave freeze into a decaying skin.
- Compare TE$_{10}$, TE$_{20}$ and TM$_{11}$ field maps and their
  cutoffs.
- Widen the broad wall $a$ and see every cutoff drop.

### Where this comes from

The mode structure, the cutoff condition and the guide wavelength
follow Jackson, Classical Electrodynamics, 3rd ed., Chapter 8, and
Pozar, Microwave Engineering, Chapter 3.

## Physical setup

A hollow rectangular metallic waveguide of width a and height b
(vacuum filled), excited in a chosen TE or TM mode at a variable
frequency.

## Governing equations

Cutoff frequency `f_c = (c/2) sqrt((m/a)^2 + (n/b)^2)`. Above cutoff
the propagation constant `beta = (2 pi/c) sqrt(f^2 - f_c^2)` is real
and the guide wavelength `lambda_g = 2 pi / beta` exceeds the
free-space wavelength; below cutoff `beta` is imaginary, the field
decaying as `exp(-alpha z)` with `alpha = sqrt(k_c^2 - k_0^2)`. TE
modes need `(m, n)` not both zero; TM modes need `m >= 1` and
`n >= 1`. For `a > b` the dominant (lowest-cutoff) mode is TE10.

## Numerical method

Closed-form cutoff, propagation and field expressions; the
cross-section map samples the modal field on a grid (diverging
colour, animated by `cos(omega t)`), the longitudinal strip draws a
travelling wave at `lambda_g` or an evanescent envelope. Reference:
Jackson, *Classical Electrodynamics* (3rd ed.), Ch. 8
(`jackson1998`).

## Controls

- mode: TE10, TE20, TE01, TE11, TE21, TM11, TM21.
- frequency (GHz): sweeps through the cutoffs.
- broad wall a (mm): rescales every cutoff.
- Reset, Pause.

## Expected qualitative features

- TE10 is a single half-sine across the broad wall, uniform in height.
- Above cutoff the longitudinal strip is a travelling wave; below
  cutoff it is a non-propagating decaying envelope.
- The spectrum panel marks each mode cutoff and the operating
  frequency, showing the single-mode band.
- Widening `a` lowers every cutoff; a narrow guide cuts modes off.

## Invariants and acceptance thresholds

- `f_c` matches the closed form within 0.1%; WR-90 TE10 ~6.557 GHz.
- TE10 is the dominant mode for `a > b`; `f_c(TE20) = 2 f_c(TE10)`.
- Propagating with `beta > 0` above cutoff, evanescent with
  `alpha > 0` below, `beta = 0` at cutoff; `alpha` grows further
  below.
- `lambda_g > lambda_0`, diverging as `f -> f_c`.
- TM needs `m, n >= 1`; TE excludes `(0, 0)`; the lowest TM is TM11.
- Modal fields vanish on the conducting walls.

## Limiting cases for verification

- `f -> f_c+`: `lambda_g -> infinity`, `beta -> 0`.
- Square guide: `TEm0` and `TE0m` become degenerate.

Source: Jackson, *Classical Electrodynamics* (3rd ed.), Ch. 8
(`jackson1998`).
