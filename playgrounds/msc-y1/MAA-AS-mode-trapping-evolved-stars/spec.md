---
title: Mode Trapping in Evolved Stars
slug: mode-trapping-evolved-stars
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: MAA-AS
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: aerts-asteroseism
primary_chapter: 3
hook: 'A sharp feature in a star''s interior traps some oscillation modes more than others, printing a periodic wiggle on the otherwise even period spacing.'
one_paragraph: 'In an evolved star the buoyancy (Brunt-Vaisala) frequency can carry a sharp glitch left by a chemical-composition discontinuity. Modes whose wavelength matches the glitch are partially trapped, so the gravity-mode period spacing is no longer constant: it picks up a periodic modulation whose period encodes where the glitch sits. The playground shows the even spacing developing this wiggle as the glitch is introduced. Reading that modulation probes the deep, otherwise invisible interior structure of red giants. Reference: Mosser et al. 2018; Aerts et al., Asteroseismology, Ch. 3.'
tags: [stellar, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: uniform-no-glitch
    label: with no glitch the period spacing is uniform at Pi_1
    tolerance: 0.02
  - key: modulation
    label: a glitch modulates the spacing while keeping the mean at Pi_1
    tolerance: 0.02
  - key: trapping-asymmetry
    label: the most-trapped mode is concentrated on one side of the glitch
    tolerance: 0
what_to_try:
  - Set the glitch strength to zero: the spacing flattens to the asymptotic Pi_1 and the eigenfunctions all look alike.
  - Turn the glitch up: the spacing develops dips, and the modes in those dips are trapped, ringing on one side of the glitch.
  - Move the glitch outward: the modulation period of the dips changes, because it tracks the buoyancy depth of the glitch.
references:
  - "Aerts, Christensen-Dalsgaard, Kurtz, Asteroseismology, Ch. 3."
---
# Mode trapping in evolved stars
Periodic ΔP modulation from a buoyancy-frequency glitch. Source: Mosser et al. 2018; Aerts et al. Ch. 3.

## Explainer

### What you are looking at

In a simple star the gravity-mode period spacing is flat: every
consecutive mode is the same period apart. In a real evolved star it
is not, it wobbles up and down in a regular pattern. That wobble is
not noise; it is the seismic fingerprint of a sharp feature buried
deep in the star. The playground shows the flat asymptotic spacing
and the periodic dips that "mode trapping" carves into it.

### The flat baseline

Far from any sharp structure, dipole g-modes are evenly spaced in
period at the asymptotic value

$$\Delta\Pi_1 = \frac{2\pi^2}
  {\sqrt{2}\,\displaystyle\int N\,\frac{dr}{r}},$$

with $N$ the Brunt-Vaisala (buoyancy) frequency. A plot of the
period spacing $\Delta P$ against mode period is then a horizontal
line.

### Glitches and mode trapping

If the buoyancy profile has a sharp localized feature (a "glitch":
a chemical-composition step left by a retreating convective core, or
the edge of a region of mixing), modes whose wavelength resonates
with the glitch location are partially trapped there. Their periods
shift, and the shift is periodic in radial order with a period set by
the acoustic/buoyancy depth of the glitch. The period spacing
develops a regular dip pattern, schematically

$$\Delta P(n) \;\approx\; \Delta\Pi_1
  \Big[1 - \alpha\,\cos\!\big(2\pi\,\tfrac{n}{\Lambda} + \phi\big)\Big],$$

where the modulation period $\Lambda$ encodes the glitch's depth and
its amplitude $\alpha$ encodes the glitch's sharpness. Here this dip
pattern is not imposed: it emerges from solving the g-mode wave
equation on a buoyancy profile that carries the glitch, so the trapped
eigenfunctions and the spacing dips are two faces of the same solve.
Reading $\Lambda$ and $\alpha$ back out is a direct sounding of where
the chemical discontinuity sits, which constrains the past extent of
convective mixing, something no surface measurement can reveal.

### Things to try

- Remove the glitch and watch $\Delta P$ flatten to the asymptotic
  line.
- Move the glitch deeper and watch the modulation period $\Lambda$
  change (the depth diagnostic).
- Sharpen the glitch and watch the dips deepen (the amplitude
  diagnostic).

### Where this comes from

Mode trapping by buoyancy glitches and the periodic period-spacing
modulation follow Mosser et al., A&A 618, A109 (2018); Cunha et al.,
ApJ 805, 127 (2015); and Aerts, Christensen-Dalsgaard and Kurtz,
*Asteroseismology*, Chapter 3.

## Physical setup and numerical method

The model is one buoyancy profile $N(x)$ on the radiative cavity
$x = r/R \in [x_{\rm in}, x_{\rm env}]$: a smooth core decline plus a
localised Gaussian glitch of strength $A$ at position $x_g$, tapering
to the convective boundary. For high-order g-modes the radial part
obeys the asymptotic (Cowling) equation

$$\psi'' + \frac{\ell(\ell+1)\,N(x)^2}{\omega^2\,x^2}\,\psi = 0,
  \qquad \psi(x_{\rm in}) = \psi(x_{\rm env}) = 0.$$

This Sturm-Liouville problem is solved by the Numerov method with a
shooting search for the eigenfrequencies $\omega_n$ (the scan step
shrinks as $\omega^2$ to resolve the crowding of high-order modes).
The periods $P_n = 2\pi/\omega_n$ give the spacing
$\Delta P = P_{n+1} - P_n$, scaled so the mean equals a red-giant-like
$\Delta\Pi_1 = 80$ s; the eigenfunctions $\psi_n(x)$ give the displayed
displacement. The glitch makes $\Delta P$ oscillate and concentrates
the trapped modes near it, both from the one solve. Trapping is read
from the spacing: a mode sitting in a $\Delta P$ dip is trapped.

## Controls

- Glitch strength $A$ (0 to 0.6) and position $x_g$ (0.12 to 0.45 in $r/R$).
- Degree $\ell$ (1 or 2). Reset and Pause.
