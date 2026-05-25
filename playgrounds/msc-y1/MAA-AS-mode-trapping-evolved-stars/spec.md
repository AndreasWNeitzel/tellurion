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
its amplitude $\alpha$ encodes the glitch's sharpness. Reading
$\Lambda$ and $\alpha$ back out is a direct sounding of where the
chemical discontinuity sits, which constrains the past extent of
convective mixing, something no surface measurement can reveal. The
playground sweeps the glitch depth and strength and shows the dip
pattern's spacing and depth respond.

### Things to try

- Remove the glitch and watch $\Delta P$ flatten to the asymptotic
  line.
- Move the glitch deeper and watch the modulation period $\Lambda$
  change (the depth diagnostic).
- Sharpen the glitch and watch the dips deepen (the amplitude
  diagnostic).

### Where this comes from

Mode trapping by buoyancy glitches and the periodic period-spacing
modulation follow Mosser et al., A&A 618, A109 (2018), and Aerts,
Christensen-Dalsgaard and Kurtz, *Asteroseismology*, Chapter 3.
