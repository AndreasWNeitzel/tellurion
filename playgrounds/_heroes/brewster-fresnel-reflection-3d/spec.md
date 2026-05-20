---
title: Brewster Angle and Fresnel Reflection (Hero)
slug: brewster-fresnel-reflection-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: FIS1014
supporting_ucs: [FIS2006]
curriculum_year: hero
primary_citation: hecht-optics
primary_chapter: 4
hero_candidate: true
hook: 'At Brewster angle, p-polarized light is perfectly transmitted (R_p = 0). At the critical angle, light is totally internally reflected. The Fresnel coefficients between these two surfaces cover the whole story of an interface.'
one_paragraph: 'A light ray hits the interface between two media of refractive indices n1, n2 at angle of incidence theta_i. Snell s law gives the refracted angle, and the Fresnel coefficients give the reflected and transmitted amplitudes for the two linear polarizations s (perpendicular to the plane of incidence) and p (parallel). The reflectance R_p of p-polarized light vanishes at the Brewster angle tan(theta_B) = n2 / n1 (the polarizing angle Brewster discovered in 1815); R_s never vanishes. For n1 > n2 (e.g. glass to air), light at angles above the critical angle sin(theta_c) = n2 / n1 is totally internally reflected. The playground shows the incident ray, the reflected and refracted rays color-coded by polarization, and the R_s(theta) and R_p(theta) curves with the Brewster zero and the TIR cliff marked. Reference: Hecht, Optics, 5th ed., Ch. 4.'
caption: 'Figure 1. Light incident at angle theta_i on the interface between media n1 and n2. Reflected and refracted rays (thickness ~ R, T); R_s (red) and R_p (cyan) plotted as functions of theta_i with the Brewster zero and (where applicable) the TIR cliff marked. Method: closed-form Snell + Fresnel formulas. Source: Hecht, Optics, 5th ed., Chapter 4.'
tags: [optics, electromagnetism, animation, live-readout]
difficulty: 3
tier: single
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [theta_deg, n1, n2]
---

# Brewster angle and Fresnel reflection
R_s, R_p, theta_B, theta_c. Source: Hecht, *Optics*, 5th ed., Pearson 2017, Ch. 4 (`hecht-optics`); original: Brewster, *Phil. Trans. R. Soc.* 105 (1815) 125.

## Explainer

### What you are looking at

A light ray (yellow) heading toward a horizontal interface between
two homogeneous media of refractive indices $n_1$ (top, e.g. air)
and $n_2$ (bottom, e.g. glass). The ray hits the interface at angle
of incidence $\theta_i$ from the surface normal. Part of the energy
reflects back at the same angle (white ray); the rest refracts into
the second medium at angle $\theta_t$ (cyan ray) given by Snell's law

$$n_1 \sin\theta_i \;=\; n_2 \sin\theta_t.$$

The thickness of each ray segment is proportional to the
energy-reflection or transmittance for unpolarized light.

The right panel plots $R_s(\theta_i)$ and $R_p(\theta_i)$, the
reflectances for s- and p-polarized light. The Brewster angle
$\theta_B = \arctan(n_2/n_1)$ is marked: $R_p$ vanishes there
(p-polarized light is perfectly transmitted). For $n_1 > n_2$ the
critical angle $\theta_c = \arcsin(n_2/n_1)$ is also marked: above
it, both polarizations are totally internally reflected.

### The Fresnel amplitude coefficients

$$r_s \;=\; \frac{n_1 \cos\theta_i - n_2 \cos\theta_t}
                {n_1 \cos\theta_i + n_2 \cos\theta_t},
   \quad
   r_p \;=\; \frac{n_2 \cos\theta_i - n_1 \cos\theta_t}
                {n_2 \cos\theta_i + n_1 \cos\theta_t}.$$

The energy reflectances are $R_s = r_s^2$, $R_p = r_p^2$.
Transmittance follows from energy conservation, $T = 1 - R$, after
accounting for the geometric beam-spread factor $n_2 \cos\theta_t /
n_1 \cos\theta_i$ which we absorb into the visual thickness.

### Brewster's angle

Setting $r_p = 0$ requires $n_2 \cos\theta_i = n_1 \cos\theta_t$,
which combined with Snell's law gives the famous condition

$$\tan\theta_B \;=\; n_2 / n_1.$$

At this angle the reflected ray is purely s-polarized; polaroid
sunglasses exploit exactly this when filtering out glare from a
water or asphalt surface (the glare is the s-polarized component;
the p-polarized component goes through into the water).

### Total internal reflection

When light tries to escape from a denser medium ($n_1 > n_2$),
Snell's law has no real solution for $\theta_i > \theta_c =
\arcsin(n_2/n_1)$. All the energy is reflected back ($R_s = R_p =
1$); the transmitted wave becomes an evanescent wave that decays
exponentially in the lower-index medium. This is what makes optical
fibres possible.

### Symbols

- $n_1, n_2$: refractive indices on either side of the interface.
- $\theta_i$: angle of incidence (from surface normal).
- $\theta_t$: angle of refraction (transmitted ray).
- $\theta_B = \arctan(n_2/n_1)$: Brewster (polarizing) angle.
- $\theta_c = \arcsin(n_2/n_1)$: critical angle for TIR (only if
  $n_1 > n_2$).
- $r_s, r_p$: Fresnel amplitude coefficients.
- $R_s, R_p$: energy reflectances.

### Things to try

- Air-to-water ($n_1 = 1$, $n_2 = 1.333$): $\theta_B = 53.1^\circ$,
  no TIR. Sweep $\theta_i$ through $\theta_B$ and watch $R_p$ dip to
  zero on the right-hand plot.
- Water-to-air ($n_1 = 1.333$, $n_2 = 1$): $\theta_B = 36.9^\circ$,
  $\theta_c = 48.6^\circ$. The Brewster dip is now below the TIR cliff.
- Glass-to-air ($n_1 = 1.5$, $n_2 = 1$): the classic prism geometry.
- Diamond-to-air ($n_1 = 2.42$, $n_2 = 1$): tiny critical angle of
  $24.4^\circ$ explains the brilliance of cut diamond.

### Where this comes from

Brewster's original paper: *Phil. Trans. R. Soc.* 105 (1815) 125.
Modern derivation: Hecht, *Optics*, 5th ed., Pearson 2017, Section
4.6. Born and Wolf, *Principles of Optics*, 7th ed., CUP 1999,
Chapter 1, has the full electromagnetic derivation from Maxwell's
equations.
