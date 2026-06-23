---
title: Airy Disks and the Rayleigh Limit
slug: airy-disk-rayleigh-resolution
status: verified
audience: portfolio
created: 2026-06-23
primary_uc: FIS3019
supporting_ucs: []
curriculum_year: bsc-y3s1
primary_citation: hecht
primary_chapter: 10
hook: 'A bigger telescope does not just gather more light: it splits a single fuzzy blob into two separate stars, and the Rayleigh criterion says exactly when.'
one_paragraph: 'A point source seen through a circular aperture of diameter D images to an Airy pattern, a bright central disk ringed by faint halos, with intensity I(alpha)/I0 = [2 J1(x)/x]^2 and x = pi D sin(alpha)/lambda; the first dark ring sits at the Rayleigh angle theta_R = 1.22 lambda/D. Two incoherent sources add in intensity, and are just resolved when their separation equals theta_R, where the peak of one falls on the first dark ring of the other and the central saddle drops to about 73.5 percent of the peak. The playground images a physical double star of fixed angular separation through an aperture whose diameter grows like a real telescope: as D increases, theta_R shrinks, the normalised separation s = delta_theta/theta_R rises, and the merged blob splits into two stars. The combined image and the intensity cut along the separation axis show the dip forming, with a live resolved / at-limit / unresolved verdict. Reference: Hecht, Optics, Sec. 10.2.5.'
tags: [optics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: saddle-le-peak
    label: central saddle never exceeds the peak
    tolerance: 1e-9
  - key: rayleigh-dip
    label: saddle is about 0.735 of the peak at the Rayleigh separation
    tolerance: 0.02
  - key: bounded
    label: state stays finite
    tolerance: 1
what_to_try:
  - Let the aperture grow and watch the blob split into two stars.
  - Move a fainter or tighter binary and find the aperture that resolves it.
  - Change wavelength: blue light resolves a touch finer than red.
references:
  - "Hecht, Optics (2017), Sec. 10.2.5."
  - "Born and Wolf, Principles of Optics (1999), Sec. 8.6."

---
# Airy disks and the Rayleigh limit
$I(\alpha)=[2J_1(x)/x]^2$, $x=\pi D\sin\alpha/\lambda$; resolved when $\Delta\theta\ge\theta_R=1.22\lambda/D$. Source: Hecht Sec. 10.2.5.

## Physical setup

Two point sources (a double star) of fixed angular separation
$\Delta\theta$ are imaged through a circular aperture of diameter $D$.
Diffraction smears each source into an Airy pattern; whether the two
patterns can be told apart is the resolution question.

## Equations

A circular aperture gives the Airy intensity

$$\frac{I(\alpha)}{I_0}=\left[\frac{2J_1(x)}{x}\right]^2,\qquad
  x=\frac{\pi D\sin\alpha}{\lambda},$$

whose first dark ring is at $x=3.8317$, i.e. the Rayleigh angle

$$\theta_R=1.22\,\frac{\lambda}{D}.$$

Two incoherent sources add in intensity. Measuring positions in units of
$\theta_R$, the combined axial profile is
$I(u)=A(u+s/2)+A(u-s/2)$ with $A$ the Airy profile and
$s=\Delta\theta/\theta_R$. At $s=1$ the central saddle is about $0.735$ of
the peak (a 26.5 percent dip), the conventional resolution threshold.

## Numerical method

The Bessel function $J_1$ is evaluated by its power series for small
argument and the standard asymptotic expansion otherwise. The 2D image is
built from a precomputed radial Airy lookup table (two lookups per pixel),
and the dip ratio by scanning the symmetric axial profile.

## Controls

- binary separation $\Delta\theta$ (arcsec): the true angular split.
- aperture $D$ (m): the telescope diameter (auto-sweeps, a growing scope).
- wavelength $\lambda$ (nm): blue resolves finer than red.
- Reset, Pause.

## Expected qualitative features

- A small aperture shows one fuzzy blob; growing it splits the pair.
- The central dip appears and deepens as $s$ passes 1.
- The verdict reads unresolved below $s=1$, at-limit near $s=1$, resolved
  above it.
- Shorter wavelength gives a smaller $\theta_R$ and resolves slightly
  finer.

## Invariants and acceptance

- The central saddle never exceeds the peak.
- At $s=1$ the saddle is $0.735\pm0.02$ of the peak.
- All reported quantities remain finite.

## Explainer

### What you are looking at

The top image is the combined light of the two stars after diffraction,
stretched so the faint Airy rings are visible. The bottom panel is the
brightness along the line joining the stars: two humps with a dip between
them. The dashed line is the Rayleigh threshold, where the dip is just
deep enough (about a quarter) to call the pair resolved.

### Why it matters

This is the diffraction limit of every telescope, microscope, and eye. It
is why astronomers build larger mirrors (smaller $\theta_R$), why
adaptive optics and interferometry exist, and why the same $1.22\lambda/D$
sets the smallest feature a camera lens can record.

### Where this comes from

Hecht, *Optics* (2017), Sec. 10.2.5; Born and Wolf, *Principles of
Optics* (1999), Sec. 8.6.
