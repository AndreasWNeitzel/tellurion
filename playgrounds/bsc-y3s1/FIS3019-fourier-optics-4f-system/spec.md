---
title: The 4f Fourier-Optics Processor
slug: fourier-optics-4f-system
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Block the centre of a lens focal plane and the image keeps only its edges; block the outside and it blurs. Spatial filtering, the Abbe-Porter experiment, computed by FFT.'
one_paragraph: 'A coherent 4f optical processor: a lens forms the exact 2D Fourier transform of an object transmittance in its back focal plane, a mask there filters spatial frequencies, and a second lens transforms back to an image. The scene is three panels: the object, the Fourier-plane log-magnitude with the filter drawn on it, and the filtered intensity image. A circular low-pass blurs (removes fine detail), a high-pass leaves only edges with the mean removed, a vertical slit keeps one diffraction direction, and no mask returns the object exactly. The FFT is an in-line iterative radix-2 Cooley-Tukey transform, row-column for 2D. The headless sim.js is gate-tested against the direct DFT, the inverse round-trip, Parseval, Hermitian symmetry, linearity, the no-filter object-equals-image identity, low-pass smoothing with non-increasing energy, and high-pass DC removal.'
tags: [optics, fourier, image-processing, multi-panel, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
curriculum_year: 'L:F-3Y-1S'
primary_uc: FIS3019
share_state_keys: []
---

# The 4f Fourier-Optics Processor

## Physical setup

An object transmittance `t(x,y)` (grating, circular aperture, double
slit, checker) in the front focal plane of lens 1. Its Fourier
transform appears in the common focal plane, where a mask is placed;
lens 2 inverse-transforms to the image plane.

## Governing equations

A thin lens gives `U_f(fx,fy) proportional to F{t}(fx,fy)` in the
back focal plane (Fraunhofer / Fourier-transform property). Filtered
field `U_f' = M . U_f`; image field `U_i = F^{-1}{U_f'}`; recorded
intensity `|U_i|^2`. No mask: `F^{-1} F t = t`.

## Numerical method

In-line iterative radix-2 Cooley-Tukey FFT (power-of-two `N = 128`),
2D by the row-column method; `sign = -1` forward, `+1` inverse with
`1/N` normalization. Masks act on the unshifted frequency grid; the
displayed spectrum is fftshifted and log-scaled. Deterministic, no
RNG. Reference: Goodman, Introduction to Fourier Optics (4th ed.),
Ch. 5-6 (`goodman-fourier`); Hecht, Optics (5th ed.), Ch. 13
(`hecht2017`).

## Controls

- object: grating, circular aperture, double slit, checker.
- filter: none, low-pass, high-pass, vertical slit.
- filter radius: the mask size in Fourier-plane pixels.
- Reset.

## Expected qualitative features

- No filter: the image is the object (4f identity).
- Low-pass: fine detail gone, the image blurs; below the grating
  fundamental only a uniform patch survives.
- High-pass: a dark field with bright edges, the mean removed.
- Slit: only one row of diffraction orders passes, fringes rotate.
- The Fourier panel shows the grating's discrete orders, the Airy
  rings of a circular aperture, etc.

## Invariants and acceptance thresholds

- FFT equals the direct DFT (1e-9); inverse round-trips (1e-8 in 2D).
- Parseval `sum|x|^2 = (1/N) sum|X|^2` (1e-9).
- Real input has Hermitian-symmetric spectrum (1e-9).
- FFT is linear (1e-9).
- No filter: image `= t^2` pixelwise (1e-7).
- Low-pass: gradient energy and variance drop sharply; total energy
  is non-increasing (masking removes energy).
- High-pass: image mean `< 0.2` of the unfiltered mean; a uniform
  object maps to `~0`.
- Low-pass passes DC, high-pass blocks DC.

## Limiting cases for verification

- Identity: `F^{-1} F t = t`.
- Uniform object through a high-pass: identically zero.
- Low-pass radius below the grating fundamental: a flat field.

## Visual fallback

Static frame: the three panels at the captured filter radius.

## Citations

- Goodman, Introduction to Fourier Optics (4th ed.), Ch. 5-6
  (`goodman-fourier`).
- Hecht, Optics (5th ed.), Ch. 13 (`hecht2017`).

## Stretch goals

- A phase object plus phase-contrast (Zernike) filtering.
- Drag the filter centre to do directional (Schlieren) filtering.

## Risk register

- A hard-edged mask rings (Gibbs); this is real spatial-filtering
  physics, not a numerical artefact, and is left visible.
- `512^2` GPU FFT is out of scope under the Canvas2D stack rule;
  `128^2` recomputes per control change well within frame budget.
