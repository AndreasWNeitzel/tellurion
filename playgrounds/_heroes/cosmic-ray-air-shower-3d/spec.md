---
title: Cosmic Ray Air Shower
slug: cosmic-ray-air-shower-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: FIS3030
supporting_ucs: [AST3014]
curriculum_year: hero
primary_citation: matthews-2005
primary_chapter: 1
hero_candidate: true
hook: 'A 10^18 eV cosmic-ray proton hitting the top of the atmosphere makes 10^10 secondary particles. The shower depth tells you what the primary was; the Pierre Auger Observatory uses exactly this.'
one_paragraph: 'A high-energy cosmic ray entering the upper atmosphere triggers a cascade of secondary particles. The Heitler model (Heitler 1954; Matthews 2005) predicts that after every radiation length X_0 = 36.6 g cm^-2 each particle splits or pair-produces, doubling the number while halving the energy. The cascade reaches maximum at X_max ~ X_0 log_2(E_0/E_c) with N_max ~ E_0/E_c particles (critical energy E_c = 87 MeV in air for electromagnetic showers). Hadronic primaries (proton, iron) develop the shower deeper by lambda_I = 90 g cm^-2 first-interaction depth; iron showers peak ~ 100 g cm^-2 higher than proton showers at the same energy, the basis for mass discrimination at the Pierre Auger Observatory. The playground renders the 3D shower in the atmosphere column with particles color-coded by species, plots the Gaisser-Hillas longitudinal profile N(X), and exposes sliders for primary type and energy. Reference: Matthews, Astropart. Phys. 22 (2005) 387.'
caption: 'Figure 1. Cosmic-ray air shower in the Earth atmosphere column. Primary particle enters at the top; cascade of electromagnetic (cyan) + hadronic (red) + muon (yellow) secondaries develops with depth. Method: Heitler cascade + Gaisser-Hillas profile. Source: Matthews, Astropart. Phys. 22 (2005) 387.'
tags: [particle-physics, astrophysics, three-d, animation, live-readout]
difficulty: 4
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [primary, log_E_eV]
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

# Cosmic ray air shower
Heitler cascade + Gaisser-Hillas profile. Source: Matthews, *Astropart. Phys.* 22 (2005) 387; Gaisser, *Cosmic Rays and Particle Physics*, CUP 1990.

## Explainer

### What you are looking at

A primary cosmic ray (typically a proton, but possibly heavier nuclei
up to iron) enters the top of the atmosphere at energy
$10^{15}$ to $10^{20}$ eV. The first interaction occurs at the
"first-interaction depth" $X_1 \sim \lambda_I = 90\,\mathrm{g\,cm^{-2}}$
($\sim 30$ km altitude). Each interaction produces $\sim 10$ secondary
hadrons (mostly pions), which either decay (charged pions to muons,
neutral pions to gamma-ray pairs) or interact again. The cascade
multiplies exponentially.

The playground shows a 3D atmosphere column with the primary entering
at the top. Particles are color-coded: red = hadronic, cyan =
electromagnetic ($e^\pm$ and $\gamma$), yellow = muons. The right
panel plots the longitudinal profile $N(X)$ (number of particles vs
atmospheric depth) using the Gaisser-Hillas formula

$$N(X) \;=\; N_{\max}\,\Big(\frac{X - X_1}{X_{\max} - X_1}\Big)^{(X_{\max} - X_1)/\lambda}
                \exp\!\Big(-\frac{X - X_{\max}}{\lambda}\Big).$$

### The Heitler model

In the simplest electromagnetic shower picture (Heitler 1954), each
$e^\pm$ emits a photon and each photon pair-produces, doubling the
particle count every radiation length $X_0 = 36.6\,\mathrm{g\,cm^{-2}}$
in air. After $n$ generations there are $2^n$ particles, each carrying
energy $E_0 / 2^n$. The cascade stops when $E_0/2^n$ falls below the
critical energy $E_c = 87$ MeV, where ionisation losses dominate over
bremsstrahlung. At shower max,

$$N_{\max} \;=\; \frac{E_0}{E_c},
   \qquad
   X_{\max} \;=\; X_0\, \log_2(E_0/E_c).$$

So a $10^{15}\,\mathrm{eV}$ EM cascade has $N_{\max} \sim 10^7$
particles at depth $X_{\max} \sim 800\,\mathrm{g\,cm^{-2}}$
(sea level is 1030 g cm$^{-2}$, so the shower peaks just above the
ground).

### Hadronic vs electromagnetic showers

For a hadronic primary, the first interaction produces $n_{\rm ch} \sim 10$
pions; the neutral pions decay almost immediately into photons that
feed the electromagnetic cascade. The hadronic part continues
multiplying with $\lambda_I \sim 90\,\mathrm{g\,cm^{-2}}$. The total
$X_{\max}$ is

$$X_{\max}^{\rm had} \;=\; \lambda_I \;+\; X_0\, \log_2\!\big(E_0 / (A\, n_{\rm ch}\, E_c)\big),$$

where $A$ is the primary mass number. For iron ($A = 56$), $X_{\max}$
is $\sim 100\,\mathrm{g\,cm^{-2}}$ smaller than for proton ($A = 1$)
at the same total energy, because the iron nucleus "starts higher"
(each nucleon carries $E_0/A$). This is the mass-discrimination
signal used by Pierre Auger, IceCube, and Telescope Array.

### Symbols

- $E_0$: primary energy.
- $A$: mass number of the primary (proton = 1, iron = 56).
- $X$: atmospheric column depth (g cm$^{-2}$).
- $X_1$: first-interaction depth.
- $X_{\max}$: depth of shower maximum.
- $X_0 = 36.6\,\mathrm{g\,cm^{-2}}$: radiation length in air.
- $\lambda_I = 90\,\mathrm{g\,cm^{-2}}$: hadronic interaction length.
- $E_c$: critical energy where ionisation overtakes bremsstrahlung.
- $n_{\rm ch}$: secondary-pion multiplicity per interaction.

### Things to try

- Set primary = proton, $\log_{10} E_0 = 18$ (i.e. EeV): $X_{\max}
  \sim 750\,\mathrm{g\,cm^{-2}}$, $N_{\max} \sim 10^{10}$ particles.
- Switch to iron-56: $X_{\max}$ shifts ~ 100 g cm$^{-2}$ shallower.
- Energy slider from $10^{15}$ (PeV, knee) to $10^{20}$ eV (GZK
  cutoff): the shower depth scales as $\log E$.

### Where this comes from

Matthews, *Astropart. Phys.* 22 (2005) 387 gives
the analytic Heitler-style model used here. Gaisser, *Cosmic Rays
and Particle Physics*, CUP 1990 is the
standard reference. Modern observational synthesis: Kampert and
Unger, *Astropart. Phys.* 35 (2012) 660 (Auger mass composition).
