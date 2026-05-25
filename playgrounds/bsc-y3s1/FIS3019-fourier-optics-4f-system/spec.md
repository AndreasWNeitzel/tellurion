---
title: The 4f Fourier-Optics Processor
slug: fourier-optics-4f-system
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Block the centre of a lens focal plane and the image keeps only its edges; block the outside and it blurs. Spatial filtering, the Abbe-Porter experiment, computed by FFT.'
one_paragraph: 'A coherent 4f optical processor: a lens forms the exact 2D Fourier transform of an object transmittance in its back focal plane, a mask there filters spatial frequencies, and a second lens transforms back to an image. The scene is three panels: the object, the Fourier-plane log-magnitude with the filter drawn on it, and the filtered intensity image. A circular low-pass mask blurs the image (it discards fine detail), a high-pass mask leaves only edges with the mean removed, a vertical slit keeps a single diffraction direction, and removing the mask returns the object exactly. This is the optical-processing principle behind spatial filtering, phase contrast and matched filtering. Reference: Goodman, Introduction to Fourier Optics, Chapters 4 to 8.'
tags: [optics, fourier, image-processing, multi-panel, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
curriculum_year: 'L:F-3Y-1S'
primary_uc: FIS3019
primary_citation: newman2013
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
references:
  - "Newman, Computational Physics, Revised printing ed."
---

# The 4f Fourier-Optics Processor

## Explainer

### What you are looking at

A lens does a Fourier transform. Put a transparency one focal length in
front of a lens and its spatial-frequency spectrum appears one focal
length behind. A second lens transforms back, reconstructing the image.
Put a mask in the middle and you edit the image by editing its
frequencies, the optical ancestor of every image filter.

### The Fourier-transform property of a lens

A thin lens of focal length $f$ illuminated by light of wavelength
$\lambda$ maps the COMPLEX field in its front focal plane to its
own Fourier transform in the back focal plane. Writing the front-
plane transmittance as $t(x, y)$ and the back-plane field as
$U_f(x_f, y_f)$,

$$\boxed{\;U_f(x_f, y_f) = \frac{1}{i\lambda f}\,
    \mathcal F\{t\}(f_x, f_y)\bigg|_{f_x = x_f / (\lambda f),\;
                                       f_y = y_f / (\lambda f)},\;}$$

where the Fourier transform $\mathcal F\{t\}$ is

$$\mathcal F\{t\}(f_x, f_y) = \iint t(x, y)\,e^{-2\pi i (f_x x + f_y y)}\,dx\,dy,$$

and the spatial-frequency-to-position mapping is

$$x_f = \lambda f\,f_x,\qquad y_f = \lambda f\,f_y.$$

Low spatial frequencies (broad features) land near the optical axis;
high spatial frequencies (fine detail, sharp edges) land far out. The
common focal plane of the 4f system thus literally displays the
image's spatial spectrum at scale $\lambda f$ per cycle/length.

### Why a lens transforms

The Fraunhofer-diffraction integral for a transparency at distance
$z$ in the paraxial regime is

$$U(x', y'; z) \propto \iint t(x, y)\,
       \exp\!\left[-\frac{ik}{z}(x x' + y y')\right]\,dx\,dy,$$

with $k = 2\pi/\lambda$. A thin lens adds a quadratic phase
$\exp[-ik(x'^2 + y'^2)/(2 f)]$ to the field passing through it. In a
4f geometry the quadratic phases from the two lenses cancel the
free-space quadratic phases between them, leaving just the bare
exponential kernel above. The result is a clean two-dimensional
Fourier transform without paraxial-approximation artifacts.

### Spatial filtering

Place a mask $M(x_f, y_f)$ at the common focal plane, then a second
identical lens inverse-transforms:

$$U_f' = M\,U_f, \qquad U_{\rm image} = \mathcal F^{-1}\{U_f'\},
   \qquad I_{\rm image} = |U_{\rm image}|^2.$$

With no mask, $\mathcal F^{-1}\mathcal F\,t = t$: the image is
faithfully reproduced.

- *Low-pass* (central pinhole, blocks high $|f|$): the image blurs
  by convolution with the Airy pattern of the pinhole; sharp edges
  smear.
- *High-pass* (central beam stop, blocks low $|f|$): only sharp
  changes survive; this is Schlieren imaging.
- *Notch* (a small off-axis stop): removes a periodic grating
  selectively, the optical analogue of removing one frequency bin.
- *Phase mask* (Zernike phase contrast): converts the phase
  information of a transparent specimen into intensity.

This is exactly the convolution theorem realised at the speed of
light. The CPU implementation in the playground uses a 2D FFT to
mimic the same optics.

### Symbols, at a glance

- $t(x, y)$, complex transmittance of the input object.
- $\lambda$, wavelength of the illuminating light (m).
- $f$, focal length of each lens (m).
- $(x_f, y_f)$, position in the Fourier (mask) plane (m).
- $(f_x, f_y)$, spatial frequencies (cycles per metre).
- $M(x_f, y_f)$, mask transmittance.
- $U_f$, $U_{\rm image}$, the complex fields at the Fourier and
  image planes.

### Things to try

- No mask: confirm the image comes out identical (the transform and
  its inverse cancel).
- Low-pass (small central hole): watch the image blur as edges are
  removed.
- High-pass (central block): watch only the outlines survive (edge
  detection).
- A horizontal slit mask: removes all horizontal structure but
  preserves vertical lines.

### Bibliographic origin

The recognition that a lens performs a Fourier transform is in
Abbe's 1873 microscopy theory; the modern operational formulation
is Goodman, *Introduction to Fourier Optics* (4th ed., Roberts and
Co. 2017), Ch. 5, 8. The 4f geometry is in VanderLugt, *Optical
Signal Processing* (Wiley 1992), Ch. 3. Phase contrast: Zernike,
*Physica* **9** (1942) 686 (Nobel Prize 1953). A clean textbook
treatment of all of the above is Hecht, *Optics* (5th ed., Pearson
2017), Ch. 11.

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
Ch. 5-6; Hecht, Optics (5th ed.), Ch. 13.

## Controls

- object: grating, circular aperture, double slit, checker.
- filter: none, low-pass, high-pass, vertical slit.
- filter radius: the mask size in Fourier-plane pixels. Hidden for
  the "none" filter (the identity system, where it has no effect)
  rather than left inert.
- Reset.

## Expected qualitative features

- The readout is anchored to the canvas, not the figure, so it no
  longer overlaps the caption.
- No filter: the image is the object (4f identity); the RMS
  object-image difference is at machine precision (~1e-16),
  confirming the forward then inverse transform is exact.
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
 .
- Hecht, Optics (5th ed.), Ch. 13.

## Stretch goals

- A phase object plus phase-contrast (Zernike) filtering.
- Drag the filter centre to do directional (Schlieren) filtering.

## Risk register

- A hard-edged mask rings (Gibbs); this is real spatial-filtering
  physics, not a numerical artefact, and is left visible.
- `512^2` GPU FFT is out of scope under the Canvas2D stack rule;
  `128^2` recomputes per control change well within frame budget.
