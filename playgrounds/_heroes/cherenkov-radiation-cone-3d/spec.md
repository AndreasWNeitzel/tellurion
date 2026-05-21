---
title: Cherenkov Radiation Cone (Hero)
slug: cherenkov-radiation-cone-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: FIS2013
supporting_ucs: [FIS3030]
curriculum_year: hero
primary_citation: jackson3e
primary_chapter: 13
hero_candidate: true
hook: 'A charged particle moving through water faster than light moves through water emits a shock wave of light: the blue glow inside reactor cores and the foundation of every neutrino detector from IceCube to Super-Kamiokande.'
one_paragraph: 'A relativistic charged particle moving through a medium of refractive index n at speed v > c/n outraces the phase velocity of light in that medium. The wavefronts it emits at successive points along its trajectory pile up coherently on a cone whose half-angle satisfies cos(theta_C) = 1/(beta n). Below threshold the wavelets stay nested and no cone forms; above threshold the cone sharpens with increasing beta. The playground shows the particle, the expanding wavelets at each emission point, and the envelope cone, alongside a live readout of theta_C and the Frank-Tamm intensity factor. Reference: Jackson, Classical Electrodynamics, 3rd ed., Section 13.4.'
caption: 'Figure 1. Charged particle moving at beta through a medium of refractive index n. The expanding spherical wavelets emitted at each point along its track interfere constructively on the Cherenkov cone of half-angle theta_C = acos(1/(beta n)). Method: closed-form Cherenkov geometry; Frank-Tamm normalization. Source: Jackson, Classical Electrodynamics, 3rd ed., Section 13.4.'
tags: [electromagnetism, animation, three-d, live-readout, relativity]
difficulty: 3
tier: single
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [beta, n]
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

# Cherenkov radiation cone
The "light boom" of relativistic charged particles. Source: Jackson, Classical Electrodynamics, Section 13.4 (`jackson3e`).

## Explainer

### What you are looking at

A charged particle (small dot moving from left to right) traverses a
transparent medium. Each point on its track emits a spherical light
wavelet that expands at the medium's phase speed $c/n$. The playground
draws these as concentric expanding circles. When the particle moves
faster than its own emitted light wavelets, the wavelets pile up on a
cone behind the particle. That cone is Cherenkov radiation: the optical
equivalent of a sonic boom.

### The threshold and the angle

The particle's speed is $v = \beta c$. The light's phase speed in the
medium is $c/n$. The condition for the Mach-cone analogue is

$$\beta\, n \;>\; 1\quad\Longleftrightarrow\quad v > c/n.$$

Below threshold the wavelets stay nested and form an outward-expanding
sphere. At and above threshold the envelope is a cone with half-angle

$$\cos\theta_C \;=\; \frac{c/n}{v} \;=\; \frac{1}{\beta\,n}.$$

For an ultra-relativistic particle in water ($n \approx 1.33$,
$\beta \to 1$), $\cos\theta_C \to 1/1.33$, so $\theta_C \approx 41^\circ$.
That is the characteristic angle behind every reactor's blue glow and
the geometric basis for IceCube's neutrino reconstruction.

### Frank-Tamm intensity

The number of photons emitted per unit path length per unit wavelength
follows from Maxwell's equations and is

$$\frac{d^2 N}{dx\,d\lambda} \;=\; \frac{2\pi \alpha}{\lambda^2}\,
  \left(1 - \frac{1}{\beta^2 n^2(\lambda)}\right).$$

The $1/\lambda^2$ factor explains the blue colour of the Cherenkov
emission in water reactors: shorter wavelengths get more photons.
The bracket vanishes at threshold and grows toward $1$ for ultra-
relativistic particles. The playground reports the Frank-Tamm
factor (the bracket) as the intensity readout.

### Symbols

- $\beta = v/c$: particle speed in units of vacuum light speed.
- $n$: refractive index of the medium (vacuum = 1; water $\approx 1.33$;
  lead glass $\approx 1.7$).
- $c$: vacuum speed of light (set to 1 in code units).
- $c_{\rm med} = c/n$: phase speed of light in the medium.
- $\theta_C$: Cherenkov half-angle.
- $\alpha$: fine-structure constant.

### Things to try

- Slide $\beta$ from below threshold to ultra-relativistic: at
  $\beta n < 1$ no cone forms, at $\beta n = 1$ the cone first opens
  along the trajectory, and as $\beta \to 1$ the angle approaches
  the asymptote $\theta_C^{\max} = \arccos(1/n)$.
- Switch the medium: in air ($n \to 1$) the threshold is unreachable
  for any massive particle; in glass ($n \approx 1.5$) the angle is
  wider.

### Where this comes from

The Cherenkov geometry follows Jackson, *Classical Electrodynamics*,
3rd ed., Section 13.4; the Frank-Tamm intensity formula is from
Frank and Tamm, *Doklady Akad. Nauk SSSR* 14 (1937) 109. The blue
colour and the use of the cone for particle physics is in Particle
Data Group, *Review of Particle Physics*, Section "Passage of particles
through matter".
