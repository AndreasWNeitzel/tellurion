---
title: PSF and Strehl Ratio
slug: point-spread-function-strehl
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: MAA-OT
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: born-wolf
primary_chapter: 8
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [optics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# PSF and Strehl ratio
Airy PSF + Maréchal $S = e^{-(2\pi\sigma)^2}$. Source: Born-Wolf Ch. 8 (`born-wolf`).

## Explainer

### What you are looking at

A telescope can never image a star as a true point: diffraction
spreads it into a blob called the point-spread function (PSF). Add
optical imperfections or atmospheric turbulence and the blob gets
worse. The Strehl ratio is the single number that says how close to
perfect the image is. The playground shows the PSF and its Strehl as
you add aberration.

### The diffraction-limited PSF

For a perfect circular aperture of diameter $D$ at wavelength
$\lambda$, the PSF is the Airy pattern, the squared modulus of the
Fourier transform of the aperture:

$$I(\theta) = I_0
  \left[\frac{2 J_1(x)}{x}\right]^2,
  \qquad x = \frac{\pi D}{\lambda}\sin\theta,$$

a bright core surrounded by faint rings. Its width sets the
diffraction limit, the first dark ring at
$\theta \approx 1.22\,\lambda/D$ (the Rayleigh resolution): bigger
aperture, sharper image.

### Wavefront error and the Strehl ratio

Real optics deliver a wavefront that is not perfectly flat; let its
phase error have RMS $\sigma$ (in radians). The Strehl ratio is the
peak intensity of the actual PSF divided by the peak of the perfect
Airy PSF. For small aberrations the Marechal approximation gives

$$S \;=\; \frac{I_\mathrm{peak}^\mathrm{actual}}
  {I_\mathrm{peak}^\mathrm{ideal}}
  \;\approx\; e^{-(2\pi\sigma_\lambda)^2}
  \;=\; e^{-\sigma_\phi^2},$$

with $\sigma_\lambda$ the RMS error in waves. $S=1$ is perfect;
$S\gtrsim0.8$ (the Marechal criterion, $\sigma_\lambda\lesssim
\lambda/14$) is "diffraction-limited". As aberration grows the core
energy drains into a wider halo, so $S$ falls steeply. This is the
headline metric for adaptive optics and space telescopes. The
playground sweeps the RMS wavefront error and shows the PSF core
collapse while $S$ tracks $e^{-\sigma_\phi^2}$.

### Things to try

- Set zero aberration and confirm the clean Airy rings with $S=1$.
- Increase the RMS wavefront error and watch the core dim, the halo
  grow, and $S$ drop exponentially.
- Find the $S\approx0.8$ point: that is the
  $\sigma\approx\lambda/14$ diffraction-limited threshold.

### Where this comes from

The Airy PSF, the Rayleigh limit, and the Marechal/Strehl relation
follow Born and Wolf, *Principles of Optics*, Chapter 8, and
Mahajan, JOSA 72, 1258 (1982).
