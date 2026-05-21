---
title: "MRI: the Bloch Equations, the FID and k-Space Imaging"
slug: mri-bloch-equations-k-space
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MFM-MP
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: bloch1946
hook: 'A magnetization vector precessing and relaxing on the Bloch sphere, the free induction decay and its Lorentzian spectrum, and a brain phantom imaged by spin echo or gradient echo and reconstructed from k-space by the 2D inverse Fourier transform, with the contrast set by TR and TE.'
one_paragraph: 'An MRI physics playground (Bloch 1946; Liang and Lauterbur 2000). The Bloch equations are solved analytically in the rotating frame: after a 90-degree pulse the magnetization precesses while the transverse component decays with T2 and the longitudinal component recovers to M0 with T1, tracing a spiral on the Bloch sphere and producing the free induction decay whose Fourier transform is a Lorentzian. A brain-like phantom is imaged with the spin-echo equation S ~ rho (1 - e^{-TR/T1}) e^{-TE/T2} or the spoiled gradient-echo Ernst-angle equation; the image is transformed to k-space and reconstructed by a 2D inverse Fourier transform, and discarding the outer k-space lines blurs it. Panel A is the Bloch sphere, Panel B the FID and spectrum, Panel C the image and its k-space. The magnetisation magnitude is conserved under pure precession, T1 and T2 relaxation follow the Bloch laws, the spin-echo signal reaches its expected limits at the Ernst angle, and discarding the outer k-space lines blurs the image. Reference: Liang and Lauterbur, Principles of Magnetic Resonance Imaging; Bloch 1946.'
tags: [medical-physics, mri, bloch, k-space, live-readout]
difficulty: 5
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: [w, seq, kf]
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

# MRI: the Bloch Equations, the FID and k-Space Imaging

## Explainer

### What you are looking at

An MRI scanner does not photograph the body; it listens to spinning
protons and reconstructs the image from their radio signal. The
playground walks the whole chain: tip the spins, watch them precess
and relax (the Bloch equations), record the decaying signal, and fill
k-space to form the image.

### The Bloch equations

Protons in a static field $B_0$ have a net magnetization $\mathbf M$.
A radio pulse tips it into the transverse plane, after which it obeys
the Bloch equations:

$$\frac{d\mathbf M}{dt}
  = \gamma\,\mathbf M\times\mathbf B
  - \frac{M_x\hat x + M_y\hat y}{T_2}
  - \frac{(M_z - M_0)\hat z}{T_1}.$$

The first term is precession at the Larmor frequency
$\omega_0 = \gamma B_0$; $T_1$ is how fast the magnetization
regrows along $B_0$ (spin-lattice relaxation) and $T_2$ how fast the
transverse part dephases (spin-spin relaxation). Different tissues
have different $T_1,T_2$, which is the entire source of MRI contrast.

### k-space imaging

The decaying transverse signal is the free induction decay; its
Fourier transform is the spectrum. To make an image, magnetic-field
gradients make the Larmor frequency and phase depend on position, so
the received signal at gradient setting $(k_x,k_y)$ is

$$S(k_x,k_y)
  = \iint M(x,y)\,
  e^{-i 2\pi (k_x x + k_y y)}\,dx\,dy.$$

That is, the scanner directly samples the 2D Fourier transform of the
image. Filling this "k-space" by stepping the gradients and inverse-
transforming reconstructs the picture: the center of k-space carries
contrast and the edges carry fine detail. The sequence timing (TR
between excitations, TE to the echo) weights the image toward
$T_1$ or $T_2$ contrast. The playground lets you set the sequence and
watch the FID, k-space filling, and the reconstructed image.

### Things to try

- Tip the spins and watch the magnetization precess and the FID
  decay with $T_2$, then regrow with $T_1$.
- Fill k-space and watch the image sharpen as the high-frequency
  (edge) samples come in.
- Change TR/TE and watch the tissue contrast flip between
  $T_1$-weighted and $T_2$-weighted.

### Where this comes from

The Bloch equations, relaxation, and k-space reconstruction follow
Nishimura, *Principles of Magnetic Resonance Imaging*, and Haacke et
al., *Magnetic Resonance Imaging: Physical Principles*.

## Physical setup

Nuclear magnetic resonance imaging. Spins in a static field B0 are tipped by a radio-frequency pulse; their net magnetization then precesses and relaxes according to the Bloch equations. The decaying transverse magnetization is the measured signal (the free induction decay); its Fourier transform is the spectrum. An image is formed by encoding position into the precession frequency and phase so that the acquired data are samples of the image's 2D Fourier transform (k-space); the inverse transform reconstructs the image, and the contrast between tissues is controlled by the repetition time TR and echo time TE.

## Governing equations

Bloch (rotating frame, on resonance offset omega):

  M_xy(t) = M_xy(0) e^{-t/T2} e^{i omega t},   M_z(t) = M0 + (M_z(0) - M0) e^{-t/T1}.

Pure precession (T1, T2 -> infinity) is a rotation and conserves |M|. Spin-echo signal (Liang and Lauterbur):

  S = rho (1 - e^{-TR/T1}) e^{-TE/T2},

and spoiled gradient echo S = rho sin(a)(1 - E1)/(1 - cos(a) E1) e^{-TE/T2*}, E1 = e^{-TR/T1}, maximised at the Ernst angle a = arccos(E1). The image and k-space are related by the 2D discrete Fourier transform.

## Numerical method

The Bloch solution and the signal equations are evaluated analytically. The FID spectrum and the image/k-space transforms use an iterative radix-2 Cooley-Tukey FFT (rows then columns); partial acquisition zeroes the k-space lines outside a central square. The phantom is a 64 x 64 brain model with literature T1/T2 at ~1.5 T. The image, k-space and reconstruction are recomputed only on a control change and cached. Deterministic; seed not applicable.

## Controls

- `w`: weighting preset, T2 (long TR, long TE) / T1 (short TR, short TE) / proton density (long TR, short TE).
- `seq`: pulse sequence, spin echo or gradient echo (Ernst-angle flip).
- `kf`: percentage of k-space acquired, 6 to 100. Below 100 the image blurs (low-pass).
- Reset, Pause/Play. Pause freezes the Bloch precession and FID sweep; the image is static.

## Expected qualitative features

- The magnetization spiralling on the Bloch sphere: transverse decay then longitudinal recovery to the pole.
- A decaying-sinusoid FID and a single Lorentzian spectral peak.
- T2 weighting making CSF bright; T1 weighting inverting the contrast so CSF is dark.
- Discarding outer k-space blurring the image with Gibbs ringing.

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline):

1. The 2D FFT is unitary (inverse recovers the image to 1e-9); FFT of a delta is flat.
2. Pure precession conserves |M| to 1e-10; Mz -> M0 and Mxy -> 0 under relaxation; |Mxy| = e^{-t/T2}.
3. Spin-echo signal: TR>>T1, TE=0 -> rho; -> rho e^{-TE/T2}; increasing in TR, decreasing in TE; linear in rho.
4. The spoiled gradient echo is maximised at the Ernst angle; -> 90 degrees as TR>>T1.
5. T2 weighting makes CSF the brightest tissue; T1 weighting makes it the darkest (contrast inversion).
6. The FID is a decaying sinusoid; its spectrum has a finite peak.
7. Partial k-space reduces image energy (Parseval) and measurably changes the image.
8. Determinism.

Visual gate: SSIM > 0.92 against committed golden frames at 60 fps.

## Limiting cases for verification

- T1, T2 -> infinity: pure precession, |M| constant.
- t >> T1: Mz -> M0; t >> T2: Mxy -> 0.
- TR >> T1: the saturation factor (1 - e^{-TR/T1}) -> 1; the Ernst angle -> 90 degrees.
- Full k-space: exact reconstruction; central-only k-space: a blurred image.

## Visual fallback

The FID, spectrum, image and k-space are static reads; the Bloch precession and FID sweep are animation only.

## Citations

- Bloch, F., Nuclear Induction, Phys. Rev. 70, 460 (1946): the Bloch equations.
- Liang and Lauterbur, Principles of Magnetic Resonance Imaging (2000): the signal equations and k-space.

## Stretch goals

- Add slice-selective excitation and a gradient-echo EPI readout trajectory.
- Add chemical-shift artefact and B0 inhomogeneity (T2 versus T2*).

## Risk register

- The phantom uses representative 1.5 T relaxation values, not a specific subject; the contrast ordering (and its T1/T2 inversion) is the load-bearing physical check, not absolute pixel values.
