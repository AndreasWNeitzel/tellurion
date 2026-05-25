---
title: Optical Lithography Resolution
slug: nanofabrication-lithography-resolution
status: verified
audience: portfolio
created: 2026-05-17
primary_uc: MEF
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: mack2007
hook: 'Image a mask through a lens and the pupil throws away every spatial frequency above NA/lambda: features finer than the Rayleigh half-pitch R = k1 lambda / NA blur to flat grey. Switch i-line -> DUV -> EUV and watch the resolvable pitch collapse.'
one_paragraph: 'An interactive projection-lithography aerial-image model. A reticle (mask) transmission t(x) is imaged through a lens of numerical aperture NA at wavelength lambda; the pupil passes only spatial frequencies |f| <= NA/lambda, so the aerial intensity is I(x) = |IFFT[ pupil . FFT(t) ]|^2 and the resolvable half-pitch is the Rayleigh limit R = k1 lambda / NA. The reticle is a line/space test pattern whose half-pitch shrinks left to right; the playground draws the mask, the pupil-filtered aerial image (coarse zones crisp, sub-Rayleigh zones blurred to grey), and the per-zone Michelson contrast (bars turn red below R). Sweeping the wavelength from i-line (365 nm) through KrF/ArF DUV (248/193 nm) to EUV (13.5 nm), and the NA and k1, collapses the resolvable pitch: smaller lambda is sharper. The cutoff at NA/lambda, the Rayleigh half-pitch, and the sharp loss of contrast just below it are the physical content. Reference: Goodman, Introduction to Fourier Optics, Chapter 6; Levinson, Principles of Lithography.'
tags: [optics, lithography, fourier-optics, resolution, live-readout]
difficulty: 4
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [wavelength, na, k1]
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
  - "Mack, Fundamental Principles of Optical Lithography: The Science of Microfabrication."
---

# Optical Lithography Resolution

## Explainer

### What you are looking at

Every microchip is printed by shining light through a mask onto a
wafer. The lens cannot capture all the light the mask diffracts, so the
printed image is a blurred, low-pass-filtered copy of the mask. How
small a feature survives that blur is the resolution limit, the central
constraint of the entire semiconductor industry.

### The equation

The mask transmittance $t(x)$ diffracts into spatial frequencies. The
projection lens has a finite numerical aperture NA, so it acts as a
hard low-pass filter $\Pi(f)$ that passes only $|f| \le \mathrm{NA}/
\lambda$. The printed aerial image is

$$I(x) = \Big|\,\mathcal F^{-1}\big[\,\Pi(f)\,\mathcal F\{t\}(f)\,
  \big]\Big|^2,
  \qquad \Pi(f) = \begin{cases}1 & |f|\le \mathrm{NA}/\lambda\\
  0 & \text{else}\end{cases}.$$

Fine features (a tight line/space grating) live at high spatial
frequency; if that frequency exceeds $\mathrm{NA}/\lambda$ it is simply
thrown away and the lines do not print.

### The resolution limit

The smallest printable half-pitch follows directly:

$$\text{CD} = k_1\,\frac{\lambda}{\mathrm{NA}},$$

the Rayleigh scaling. Three levers: shorter wavelength $\lambda$
(deep-UV to extreme-UV), larger NA (immersion lenses), and a smaller
process factor $k_1$ (resolution-enhancement tricks like phase-shift
masks and off-axis illumination). The playground lets you shrink the
mask pitch and watch the aerial image contrast collapse to zero as the
features cross the $\mathrm{NA}/\lambda$ cutoff, the physical wall
Moore's law keeps pushing against.

### Things to try

- Shrink the line/space pitch and watch the printed contrast fade,
  then vanish at the diffraction limit.
- Increase NA and watch finer features survive (immersion
  lithography).
- Drop the wavelength and see the same gain (the move to EUV).

### Where this comes from

The Fourier-optics imaging model, the pupil low-pass filter, and the
Rayleigh CD $= k_1\lambda/\mathrm{NA}$ scaling follow Goodman,
*Introduction to Fourier Optics*, and the standard lithography
treatment in Levinson, *Principles of Lithography*.

## Physical setup

A projection scanner images a reticle (photomask) onto a wafer
through a reduction lens. Diffraction at the mask spreads the light
into spatial frequencies; the finite lens pupil collects only those
with `|f| <= NA / lambda`, discarding the rest. The printed aerial
image is therefore a low-pass-filtered version of the mask, and the
smallest line/space that survives sets the resolution, the central
constraint of semiconductor nanofabrication.

## Governing equations

```math
I(x) = \big|\,\mathcal{F}^{-1}\!\left[\,\Pi(f)\,\mathcal{F}\{t\}(f)\,\right]\big|^2,
\qquad
\Pi(f) = \begin{cases} 1 & |f| \le \mathrm{NA}/\lambda \\ 0 & \text{else}\end{cases},
\qquad
R = k_1\,\frac{\lambda}{\mathrm{NA}} .
```

For a coherent line/space grating the +/-1 diffraction orders sit at
`f = 1/(2 h)` (`h` = half-pitch); they clear the pupil only if
`h >= lambda/(2 NA)` (the `k1 = 0.5` two-beam limit), so the imaged
contrast collapses sharply at `h ~ lambda/(2 NA)`. Wavelengths:
i-line 365 nm, KrF 248 nm, ArF 193 nm, EUV 13.5 nm (Mack 2007;
Goodman; Born and Wolf).

## Numerical method

The pupil filter is applied in the Fourier domain with an exact DFT
(O(N^2), N ~ 1024 here, deterministic); the Rayleigh limit and the
NA/lambda cutoff are closed form. The Canvas2D playground draws the
reticle, the pupil-filtered aerial intensity, and the per-zone
Michelson contrast with the Rayleigh limit marked. No engine reuse is
required (a DFT plus closed-form algebra).

## Controls

- wavelength: i-line / KrF / ArF / EUV, default ArF (193 nm).
- NA: slider `0.40` to `1.35`, default `1.00`.
- k1: slider `0.25` to `0.80`, default `0.50` (process factor).
- reset, pause: buttons.
- Live monospace readouts: `lambda`, the cutoff `NA/lambda`, the
  Rayleigh `R = k1 lambda / NA`, and the finest resolved half-pitch.
- Share-state keys: `wavelength`, `na`, `k1`.

## Expected qualitative features

- The aerial image is crisp for the coarse (left) zones and blurs to
  a flat grey for the zones finer than `R`.
- The per-zone contrast bars are blue above `R` and red below it; the
  crossover sits at the Rayleigh half-pitch.
- Switching to a shorter wavelength (EUV) or a larger NA dramatically
  shrinks `R` and turns more zones blue (sharper).
- Raising `k1` relaxes the printed resolution (larger `R`).

## Invariants and acceptance thresholds

Checked offline through `sim.js` in `invariants.test.mjs` (no GPU):

- cutoff frequency (strong): `f_c = NA / lambda` exactly; monotone
  in NA and `1/lambda`.
- Rayleigh resolution (strong): `R = k1 lambda / NA` exactly; exactly
  linear in `lambda` (halving `lambda` halves `R`); EUV resolves
  finer than ArF.
- resolution cutoff (strong, the headline): a line/space grating
  loses contrast as the half-pitch crosses `lambda/(2 NA)`, and the
  measured contrast-0.5 crossover is within `5%` of `lambda/(2 NA)`.
- contrast collapse (strong): a grating at `2x` the limit images with
  high contrast; one at `0.5x` collapses by more than `5x`.
- non-negative intensity (medium): `I(x) >= 0` (it is `|.|^2`).
- determinism (medium): the DFT pipeline reproduces the image
  exactly.

Visual gate: five Playwright frames (init, 25, 50, 75, terminal) of
the deterministic ArF/NA=1.0 sweep, SSIM at least `0.92` vs committed
golden frames. Deterministic (no RNG; exact DFT).

## Limiting cases for verification

- `lambda -> 0` or `NA -> max`: cutoff `-> infinity`, every zone
  resolves.
- half-pitch `>> lambda/(2 NA)`: full contrast.
- half-pitch `<< lambda/(2 NA)`: only DC passes, flat image.
- larger `k1`: coarser printed resolution.

## Visual fallback

Pure Canvas2D over a deterministic DFT and closed-form algebra: no
WebGL, no RNG, so the headless capture and SSIM gate are robust. The
invariants run GPU-free in node.

## Citations

In `docs/CITATIONS.bib`:

- Goodman, Introduction to Fourier Optics, the
  pupil-filtered imaging model.
- Born and Wolf, Principles of Optics, the Rayleigh
  resolution criterion.
- Mack, Fundamental Principles of Optical Lithography, Wiley 2007
 , the lithography model, `k1` and the wavelengths.

## Stretch goals

- Partially coherent illumination (sigma) and off-axis / dipole
  sources.
- A 2D reticle with optical proximity correction.
- Resist threshold and the printed critical dimension.

## Risk register

- Finite-window DFT leakage: a square-wave grating just past cutoff
  retains a small residual contrast; the gated claim is the sharp
  crossover at `lambda/(2 NA)` within 5% and a > 5x collapse, not a
  literal zero.
- Coherent-only model: real scanners are partially coherent;
  documented as a stretch, the gated physics is the exact coherent
  cutoff.
- Engagement: the wavelength selector is the dramatic control, the
  resolvable pitch visibly collapses from i-line to EUV.

## Implementation notes

`sim.js` is self-contained (`cutoffFreq`, `rayleigh`,
`reticleGrating`, `reticleTestPattern`, `aerialImage`, `contrast`,
`gratingContrast`, `WAVELENGTHS`); `invariants.test.mjs` imports it
directly. `playground.js` is pure Canvas2D: the reticle, the aerial
image, the per-zone contrast bars with the Rayleigh marker, a
throttled readout, and the `?deterministic=1&capture=NAME` capture
contract.
