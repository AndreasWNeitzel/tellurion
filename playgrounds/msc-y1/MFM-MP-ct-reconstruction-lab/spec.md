---
title: "CT Reconstruction: Radon, Filtered Back-Projection and MLEM"
slug: ct-reconstruction-lab
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MFM-MP
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: kak-slaney1988
hook: 'A Shepp-Logan phantom, its Radon transform built up by a rotating gantry, and the image recovered by filtered back-projection with the Ram-Lak ramp filter or by the iterative MLEM algorithm: few angles give streaks, more angles and more iterations sharpen the image.'
one_paragraph: 'A computed-tomography reconstruction playground (Kak and Slaney 1988; Shepp and Vardi 1982). A Shepp-Logan phantom is projected by the parallel-beam Radon transform into a sinogram, filled angle by angle by a rotating gantry. The image is recovered either by filtered back-projection, applying the discrete Ram-Lak ramp filter (or the Shepp-Logan apodisation, or none) and smearing each projection back across the field, or by the Shepp-Vardi MLEM iteration. Panel A shows the phantom and the sinogram; Panel B the reconstruction; Panel C the error against the number of projection angles and, for MLEM, against iteration. The Radon transform is linear with angle-independent total attenuation, filtered back-projection inverts a point source exactly, the reconstruction error falls as more projection angles are added, and the MLEM iteration converges monotonically. Reference: Kak and Slaney, Principles of Computerized Tomographic Imaging; Shepp and Vardi 1982.'
tags: [medical-physics, tomography, radon, fbp, live-readout]
difficulty: 5
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: [na, filt, meth]
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

# CT Reconstruction: Radon, Filtered Back-Projection and MLEM

## Explainer

### What you are looking at

A CT scanner only ever measures shadows: X-ray attenuation along lines
through the body, at many angles. The playground builds those shadows
(the sinogram) from a phantom, then reconstructs the slice two ways,
filtered back-projection and iterative MLEM, and shows the error fall
as you add angles.

### The Radon transform

Each projection is the line integral of the attenuation $\mu(x,y)$
along rays at angle $\theta$:

$$p(\theta, s) = \int \mu(x,y)\,\delta(x\cos\theta + y\sin\theta - s)\,
  dx\,dy.$$

Stacking $p(\theta,s)$ over all angles is the sinogram (a point in the
object traces a sinusoid in it, hence the name). Reconstruction is the
inverse problem: recover $\mu$ from its projections.

### Filtered back-projection

Naively smearing each projection back across the image (back-
projection) gives a blurred result, because the projection-slice
theorem says each projection fills one radial line of the 2D Fourier
transform, and those lines are denser near the origin. Correct it by
ramp-filtering each projection before back-projecting:

$$\mu(x,y) = \int_0^\pi \big[\,p(\theta,\cdot)\ast h_\text{ramp}\,\big]
  (x\cos\theta + y\sin\theta)\ d\theta,$$

with $|\,\omega\,|$ the Ram-Lak filter (Shepp-Logan apodization tames
its noise). Exact in the limit of infinitely many noiseless angles;
streak artifacts appear with too few.

### Iterative MLEM

When the data are Poisson-noisy (few photons), maximum-likelihood
expectation-maximization instead iterates

$$\mu^{(k+1)}_j = \frac{\mu^{(k)}_j}{\sum_i A_{ij}}
  \sum_i A_{ij}\,
  \frac{p_i}{\sum_{j'} A_{ij'}\mu^{(k)}_{j'}},$$

multiplicatively driving the forward-projected estimate toward the
measured data. It is slower but handles noise and missing angles far
better, the basis of modern PET/SPECT reconstruction. The playground
shows FBP vs MLEM and the error versus number of angles and iterations.

### Things to try

- Add projection angles and watch FBP sharpen from streaky to clean
  (it needs many angles).
- Switch the ramp filter off and watch the back-projection blur
  return.
- Use few noisy angles and watch MLEM beat FBP as iterations proceed.

### Where this comes from

The Radon transform, the projection-slice theorem, filtered
back-projection, and MLEM follow Kak and Slaney, *Principles of
Computerized Tomographic Imaging* (1988), and Shepp and Vardi (1982).

## Physical setup

X-ray computed tomography measures line integrals of the attenuation coefficient through the body at many angles (the Radon transform, displayed as the sinogram) and inverts them to recover the cross-sectional image. Two reconstruction routes are shown: analytic filtered back-projection, the workhorse of clinical CT, and the statistical MLEM iteration used in emission tomography. The test object is the standard Shepp-Logan head phantom.

## Governing equations

The parallel-beam Radon transform p(theta, t) = integral of f along the line at angle theta and offset t; it is linear and, by conservation, integrates to the same total for every angle. Filtered back-projection (Kak and Slaney) applies the ramp filter and back-projects:

  f = integral_0^pi [ p(theta, .) * h ](x cos theta + y sin theta) dtheta,

with the discrete Ram-Lak (Ramachandran-Lakshminarayanan) kernel h[0] = 1/4, h[odd n] = -1/(pi^2 n^2), h[even n] = 0. MLEM (Shepp and Vardi) iterates

  x_{k+1} = x_k / (A^T 1) . A^T ( b / (A x_k) ),

with A the Radon operator and A^T back-projection; the likelihood increases and the error decreases each iteration.

## Numerical method

The phantom is a sum of analytic ellipses rasterised on an 80 x 80 grid. The Radon transform is a rotate-and-sum line integral with bilinear sampling; the ramp filter is the spatial-domain discrete kernel (no FFT); back-projection is bilinear in the detector coordinate. MLEM runs 20 iterations. Reconstructions are recomputed only when a control changes and cached. Deterministic; seed not applicable.

## Controls

- `na`: number of projection angles, 3 to 180. Few angles give the classic streak artefacts; more angles sharpen the image.
- `filt`: FBP filter, Ram-Lak ramp / Shepp-Logan / none. Without the ramp, back-projection is blurred.
- `meth`: reconstruction method, filtered back-projection or MLEM.
- Reset, Pause/Play. Pause freezes the gantry sweep; the reconstruction is static.

## Expected qualitative features

- The sinogram filling row by row as the gantry rotates; the sinusoidal traces of the phantom features.
- FBP with 5 angles streaky, with 180 angles a clean image; the error falling with the number of angles.
- The unfiltered back-projection a blurred blob; the ramp filter restoring sharpness.
- MLEM converging to a smooth image, with the error decreasing every iteration.

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline):

1. The Radon transform is linear to 1e-9.
2. Every projection conserves the total attenuation within 2 percent; a zero image gives a zero sinogram.
3. The Ram-Lak kernel has h[0] = 1/4, h[odd] = -1/(pi^2 n^2), h[even] = 0, symmetric.
4. FBP of a central point source peaks exactly at the source pixel.
5. The reconstruction error falls and the SNR rises with the number of angles, sub-linearly (sqrt-like).
6. MLEM error decreases monotonically and the image stays non-negative.
7. The filter selector changes the reconstruction (ramp deblurs versus none).
8. Determinism.

Visual gate: SSIM > 0.92 against committed golden frames at 60 fps.

## Limiting cases for verification

- Zero image: zero sinogram, zero reconstruction.
- Point source: FBP peak at the source (the point-spread function is centred).
- Many angles: FBP converges toward the phantom (error -> small).
- No filter: back-projection blurs (much larger error than Ram-Lak).

## Visual fallback

The phantom, sinogram, reconstruction and error curve are all static; the gantry sweep is an acquisition animation only.

## Citations

- Kak and Slaney, Principles of Computerized Tomographic Imaging (1988): Radon, the Fourier-slice theorem, FBP, the Ram-Lak kernel.
- Shepp and Vardi, Maximum Likelihood Reconstruction for Emission Tomography, IEEE TMI 1, 113 (1982): MLEM.

## Stretch goals

- Add Poisson photon noise and show the bias-variance trade-off of MLEM iterations.
- Add a fan-beam geometry and rebinning.

## Risk register

- FBP carries a global scale that depends on the discretisation; the displayed image and the error metrics use a single least-squares scale to the phantom, which does not affect the qualitative artefacts or the monotone trends the invariants check.
