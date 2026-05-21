---
title: Synchrotron Radiation Cone (Hero)
slug: synchrotron-radiation-cone-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: AST3016
supporting_ucs: [FIS2013]
curriculum_year: hero
primary_citation: rybicki-lightman
primary_chapter: 6
hero_candidate: true
hook: 'A relativistic electron in a magnetic field beams its radiation into a forward cone of half-angle 1/gamma. The observer sees a sharp pulse every time the cone sweeps across the line of sight, and the spectrum peaks at nu_c = (3/2) gamma^3 nu_L.'
one_paragraph: 'An electron of Lorentz factor gamma orbits in a uniform magnetic field B. Its angular frequency is omega_orbit = e B / (gamma m_e c), and the radiation is beamed into a forward cone of half-angle ~ 1/gamma along the instantaneous velocity. The observer receives a sharp synchrotron pulse each time the cone sweeps over the line of sight, of width Delta t ~ 1/(gamma omega) (much shorter than the orbital period). The spectrum is self-similar around the critical frequency nu_c = (3/2) gamma^3 e B / (2 pi gamma m_e c) = (3/2) gamma^2 e B / (2 pi m_e c). Single-electron synchrotron emission underlies pulsar wind nebulae, radio galaxies, jet polarization, and Galactic cosmic-ray loss times. Reference: Rybicki and Lightman, Radiative Processes in Astrophysics, Ch. 6.'
caption: 'Figure 1. Synchrotron radiation from a relativistic electron in a magnetic field B. The forward beaming cone of half-angle 1/gamma sweeps with the orbit. Method: closed-form Larmor + relativistic beaming geometry, Rybicki-Lightman spectral envelope. Source: Rybicki and Lightman, Radiative Processes in Astrophysics, Chapter 6.'
tags: [plasma, electromagnetism, astrophysics, animation, three-d, live-readout]
difficulty: 4
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [gamma, b_field_T]
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

# Synchrotron radiation cone
Beaming half-angle 1/gamma. Source: Rybicki and Lightman, *Radiative Processes in Astrophysics*, Ch. 6 (`rybicki-lightman`); Jackson, *Classical Electrodynamics*, 3rd ed., Sec. 14.4 (`jackson3e`).

## Explainer

### What you are looking at

A single electron orbits in a uniform magnetic field $\vec B$ (drawn
as purple field arrows pointing out of the page). Its trajectory is
a circle of gyro radius $r_L = \gamma m_e c / (e B)$ in the plane
perpendicular to $\vec B$. Because the electron is relativistic
($\gamma \gg 1$), its electromagnetic radiation is not isotropic in
the lab frame: relativistic aberration squeezes the emission into a
forward cone of half-angle $\sim 1/\gamma$ pointing along the
instantaneous velocity.

The orange cone in the playground tracks this beam. The observer at
the right sees a sharp pulse each time the cone sweeps across the
line of sight; the bottom panel records the pulse profile.

### Critical frequency and beaming

The relativistic Larmor frequency is

$$\omega_{\rm orbit} \;=\; \frac{eB}{\gamma m_e c}.$$

Pulse duration in the lab frame is $\Delta t \sim 1/(\gamma\, \omega_{\rm
orbit})$, so the spectrum extends up to a critical frequency

$$\nu_c \;\sim\; \frac{1}{\Delta t}
              \;\approx\; \frac{3}{2}\, \gamma^3\, \nu_L,
   \qquad
   \nu_L = \frac{e B}{2\pi \gamma m_e c}.$$

For $\gamma = 10^4$ and $B = 100\,\mu\mathrm{G}$ (typical pulsar wind
nebula), $\nu_c \sim 10^{16}\,\mathrm{Hz}$, i.e. soft X-ray.

### Total radiated power

The single-electron synchrotron power follows from Larmor with the
relativistic correction:

$$P_{\rm sync} \;=\; \frac{4}{3}\, \sigma_T\, c\, U_B\, \gamma^2 \beta^2,$$

where $U_B = B^2 / (8\pi)$ (CGS) is the magnetic energy density and
$\sigma_T$ the Thomson cross-section. Cooling timescale
$\tau = E / P \propto 1/(\gamma B^2)$.

### Spectral shape

The high-energy electrons emit a broadband spectrum that, in
log-log space, looks like

$$F(\nu) \;\propto\; \nu^{1/3}\,\exp(-\nu / \nu_c)$$

(Westfold approximation). At $\nu \ll \nu_c$, $F \propto \nu^{1/3}$;
at $\nu \gtrsim \nu_c$, exponential cutoff.

### Symbols

- $\gamma$: Lorentz factor of the electron.
- $\beta = v/c$: dimensionless speed.
- $B$: magnetic-field magnitude.
- $r_L = \gamma m_e c / (eB)$: gyro radius.
- $\nu_L = eB / (2\pi \gamma m_e c)$: relativistic Larmor frequency.
- $\nu_c = (3/2)\, \gamma^3\, \nu_L$: critical synchrotron frequency.
- $\sigma_T$: Thomson cross-section.

### Things to try

- $\gamma = 1$ (non-relativistic): beam half-angle is $90^\circ$, no
  beaming, smooth sinusoidal emission.
- $\gamma = 10$: cone narrows to $\sim 6^\circ$, pulses become sharp.
- $\gamma = 1000$: cone half-angle $0.06^\circ$, $\nu_c$ is $10^9$
  times $\nu_L$.
- Sweep $B$ from $1\,\mathrm{G}$ to $10^{12}\,\mathrm{G}$ (magnetar):
  the critical frequency climbs through visible into hard X-ray.

### Where this comes from

The full derivation is in Rybicki and Lightman, *Radiative Processes
in Astrophysics*, Wiley 1979, Chapter 6. The compact-source
application is in Pacholczyk, *Radio Astrophysics*, W. H. Freeman
1970. Original: Schwinger, *Phys. Rev.* 75 (1949) 1912.
