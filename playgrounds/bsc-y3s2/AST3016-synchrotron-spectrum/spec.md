---
title: Synchrotron Spectrum
slug: synchrotron-spectrum
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: AST3016
supporting_ucs: [FIS2013]
curriculum_year: bsc-y3s2
primary_citation: rybickilightman1979
primary_chapter: 6
hook: 'One electron spiralling in a magnetic field radiates a single broad hump; a power-law swarm of them radiates a power-law spectrum, the fingerprint of cosmic-ray sources.'
one_paragraph: 'A relativistic electron gyrating in a magnetic field beams synchrotron radiation into a narrow forward cone, producing a single broad spectral hump peaking near its critical frequency. Real sources hold a power-law distribution of electron energies, and summing their humps gives a power-law radio spectrum whose slope maps directly onto the electron energy slope. The playground shows the single-electron spectrum and the ensemble power-law as you change the field strength and the electron distribution. This is the emission of radio galaxies, supernova remnants, and pulsar wind nebulae. Reference: Rybicki and Lightman, Radiative Processes in Astrophysics, Ch. 6.'
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
  - "Rybicki, Lightman, Radiative Processes in Astrophysics, Ch. 6."
---
# Synchrotron spectrum
Hump for one electron; power-law for an ensemble. Source: Rybicki-Lightman Ch. 6.

## Explainer

### What you are looking at

A single relativistic electron spiralling in a magnetic field radiates
a broad hump of light. A whole population of electrons with a power-law
energy spread radiates a power-law spectrum, and the slope you measure
tells you the slope of the invisible electron distribution. This is the
emission of radio galaxies, supernova remnants, and pulsar wind
nebulae.

### One electron: a hump at the critical frequency

An electron of Lorentz factor $\gamma$ gyrating in field $B$ beams
radiation forward and emits over a broad spectrum peaking near the
critical frequency

$$\nu_c \;\sim\; \gamma^2\,\frac{eB}{2\pi m_e},$$

(the $\gamma^2$ is the relativistic beaming/compression). Its single-
electron spectrum rises, peaks near $\nu_c$, then falls off
exponentially, the characteristic hump.

### An ensemble: a power law

Astrophysical sources hold a power-law electron energy distribution,
$N(\gamma)\,d\gamma \propto \gamma^{-p}\,d\gamma$. Summing each
electron's hump over this distribution gives a power-law spectrum

$$S_\nu \;\propto\; \nu^{-\alpha},
  \qquad \alpha = \frac{p - 1}{2}.$$

So a measured spectral index $\alpha$ reads back the electron energy
slope $p = 2\alpha + 1$ directly, the standard diagnostic of cosmic-ray
electron populations. The playground shows the single-electron hump and
the ensemble power-law as you change the field and the electron
distribution. (Note: the synchrotron critical frequency is $\omega_c =
\tfrac32\gamma^2 eB/m_e$ in SI; the playground uses the correct SI
form.)

### Things to try

- Watch the single-electron hump shift up in frequency as $\gamma^2$
  when you raise the electron energy or field.
- Stack a power-law population and watch the straight $\nu^{-\alpha}$
  spectrum emerge.
- Change the electron slope $p$ and confirm the radio slope follows
  $\alpha=(p-1)/2$.

### Where this comes from

The single-electron synchrotron spectrum, the critical frequency, and
the ensemble power-law $\alpha=(p-1)/2$ follow Rybicki and Lightman,
*Radiative Processes in Astrophysics*, Chapter 6.
