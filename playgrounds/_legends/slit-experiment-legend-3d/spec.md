---
title: Slit Experiment Legend
slug: slit-experiment-legend-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: FIS3007
supporting_ucs: [FIS2016, FIS2017]
curriculum_year: hero
primary_citation: hecht-optics
primary_chapter: 10
hero_candidate: true
tier: legend
hook: 'One slit, two slits, a thousand: photons or electrons. Wave or particle. Wide or narrow. Visible or X-ray. This legend covers the entire slit-experiment family in one canvas with togglable modes.'
one_paragraph: 'A legend playground covers every interference-and-diffraction experiment that uses N parallel slits as the optical element. Fraunhofer intensity is I(theta) = (sin alpha / alpha)^2 * (sin N beta / sin beta)^2 with alpha = pi a sin(theta) / lambda and beta = pi d sin(theta) / lambda; setting N = 1 recovers the single-slit smear, N = 2 the iconic Young pattern, and large N the grating with bright principal maxima. The same intensity formula applies whether the projectile is a photon (lambda chosen directly) or an electron (lambda = h / sqrt(2 m E) from de Broglie). Toggle between continuous wave-field visualization (interference pattern as colour), particle accumulator (single hits build the histogram), and Davisson-Germer Bragg-scattering off a nickel crystal (lambda from de Broglie matches the lattice spacing 2.15 Angstroms). Reference: Hecht, Optics, 5th ed., Ch. 10.'
caption: 'Figure 1. Slit-experiment laboratory: source, N-slit mask, screen. Wave mode shows continuous fringes; particle mode accumulates one hit at a time into the same Fraunhofer pattern. Method: closed-form Fraunhofer (sin alpha / alpha)^2 * (sin N beta / sin beta)^2 with rejection-sampled hits. Source: Hecht, Optics, 5th ed., Chapter 10.'
tags: [quantum, optics, animation, live-readout, legend]
difficulty: 4
tier: legend
renderer: canvas2d
estimated_engagement_minutes: 8
share_state_keys: [n_slits, slit_width_um, slit_pitch_um, wavelength_nm, particle, mode]
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

# Slit Experiment Legend
Fraunhofer N-slit + de Broglie. Source: Hecht, *Optics*, 5th ed., Ch. 10 (`hecht-optics`); Tonomura et al., *Am. J. Phys.* 57 (1989) 117 (`tonomura1989`); Davisson and Germer, *Nature* 119 (1927) 558 (`davisson-germer-1927`).

## Explainer

### What you are looking at

A source emits coherent wave-particles toward an opaque screen with $N$
parallel slits and onto a screen behind it. You choose:

- the **particle type** (photon or electron),
- the **wavelength** (or the electron kinetic energy, via de Broglie),
- the slit count $N$, width $a$, and centre-to-centre distance $d$,
- the **mode**: wave (continuous intensity), particles (one-at-a-time
  accumulator), grating (large-N Fraunhofer line spectrum), or
  Davisson-Germer (Bragg scattering from a crystal lattice).

### The Fraunhofer intensity

For $N$ identical slits of width $a$ separated by $d$, the far-field
intensity at angle $\theta$ from the axis is

$$I(\theta) \;=\; I_0\,\Big(\frac{\sin\alpha}{\alpha}\Big)^2
                  \,\Big(\frac{\sin(N\beta)}{\sin\beta}\Big)^2,
  \quad \alpha = \frac{\pi a \sin\theta}{\lambda},
  \quad \beta = \frac{\pi d \sin\theta}{\lambda}.$$

The first factor (the $\mathrm{sinc}^2$) is the single-slit diffraction
envelope. The second factor is the multi-slit interference. For
$N = 1$ only the envelope survives, for $N = 2$ the second factor
becomes $4 \cos^2\beta$, and as $N \to \infty$ the second factor turns
into a sum of sharp delta functions at $d\sin\theta_m = m\lambda$, the
principal maxima of a diffraction grating.

### de Broglie: photons and electrons obey the same law

A photon has $\lambda = c/\nu$ directly. An electron has

$$\lambda \;=\; \frac{h}{\sqrt{2 m_e E}}
            \;=\; 1.226\,\mathrm{nm} \,\Big(\frac{1\,\mathrm{eV}}{E}\Big)^{1/2}.$$

At $E = 50\,\mathrm{eV}$, $\lambda = 1.73\,\mathrm{Angstrom}$, comparable
to the inter-plane spacing in a nickel crystal: this is the
Davisson-Germer experiment (1927), which proved electrons are waves.

### Particle accumulator mode

Switch on "particles" to launch one projectile at a time. Each one
lands at a single random angle drawn from $I(\theta)$ (rejection
sampling). After ~ 100 hits the pattern looks like noise; after
$\sim 10^4$ the Fraunhofer fringes emerge cleanly. This is the
Tonomura 1989 demonstration: even with a single electron in the
apparatus at a time, the pattern still appears.

### Davisson-Germer mode

Replace the slit mask with a crystal lattice. The same interference
formula applies in Bragg form

$$2 d_{\rm lat} \sin\theta \;=\; m\,\lambda,$$

with $d_{\rm lat} = 2.15\,\mathrm{Angstrom}$ for nickel (111). Tune
the electron energy until the first-order Bragg peak shows up at the
classic 50-degree angle (Davisson and Germer 1927).

### Symbols

- $N$: number of slits ($N \ge 1$).
- $a$: slit width.
- $d$: centre-to-centre spacing of adjacent slits.
- $\lambda$: wavelength.
- $\theta$: observation angle from the axis.
- $\alpha = \pi a \sin\theta / \lambda$: single-slit phase.
- $\beta = \pi d \sin\theta / \lambda$: between-slits phase.
- $E$: kinetic energy of the projectile (electron mode).
- $m_e = 9.11 \times 10^{-31}\,\mathrm{kg}$: electron mass.
- $h = 6.63 \times 10^{-34}\,\mathrm{J\,s}$: Planck's constant.

### Things to try

- Toggle wave / particles: same final pattern, different visualization.
- Sweep $N$ from 1 to 10 at fixed $\lambda$ and $d$: the central
  bright fringe sharpens by a factor of $N$.
- Make the slits very narrow ($a \ll \lambda$): the envelope becomes
  flat and only the cosine fringes remain. Make them wide
  ($a \gtrsim d$): the central fringe dominates everything.
- Davisson-Germer: pick electron, set $E = 54\,\mathrm{eV}$; the
  first-order Bragg peak lands at $\theta \approx 50^\circ$, matching
  the 1927 experiment.

### Where this comes from

The Fraunhofer formula is in Hecht, *Optics*, 5th ed., Pearson 2017,
Sections 10.1 (single slit), 10.2.2 (double slit), 10.2.3 (grating).
The single-electron build-up of the fringes is Tonomura et al.,
*Am. J. Phys.* 57 (1989) 117 (`tonomura1989`). Davisson-Germer:
Davisson and Germer, *Nature* 119 (1927) 558
(`davisson-germer-1927`).
