---
title: Stern-Gerlach Spin Quantization (Hero)
slug: stern-gerlach-spin-quantization-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: FIS3003
supporting_ucs: [FIS3007]
curriculum_year: hero
primary_citation: sakurai-napolitano
primary_chapter: 1
hero_candidate: true
hook: 'A continuous magnetic dipole would smear out into a band on the screen. Stern and Gerlach saw two spots, full stop. That is what convinced everyone in 1922 that angular momentum is quantized.'
one_paragraph: 'Neutral atoms with magnetic moment mu_z = -g mu_B m_J pass through a region of inhomogeneous magnetic field B_z(z). The gradient dB_z/dz applies a force F_z = mu_z dB_z/dz that depends on the (signed) projection m_J of the angular momentum along the field. For a single classical orientation the deflection would be one fixed value; for a thermal ensemble of orientations the deflection would be a continuous band of width 2 J. What is actually seen is 2J+1 discrete spots: the unmistakable signature that the projection m_J takes only the values -J, -J+1, ..., +J. The playground shoots a stream of atoms through a 3D apparatus (oven on the left, magnet in the middle, screen on the right), shows their deflected trajectories color-coded by m_J, and tallies a live histogram on the screen comparing the quantum result (2J+1 spikes) with the classical band. Reference: Sakurai and Napolitano, Modern Quantum Mechanics, 2nd ed. Ch. 1.'
caption: 'Figure 1. Stern-Gerlach apparatus. Atoms of angular momentum J enter the magnet (red north, blue south) and are deflected by F_z = mu_z dB_z/dz; the screen on the right shows 2J+1 discrete spots, the histogram (right panel) builds in real time. Method: classical Newton with quantized m_J. Source: Sakurai and Napolitano, Modern Quantum Mechanics, Sec. 1.1.'
tags: [quantum, animation, three-d, live-readout]
difficulty: 3
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [J, dBdz, rate]
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

# Stern-Gerlach spin quantization
2J+1 discrete spots, not a classical band. Source: Sakurai and Napolitano, Modern Quantum Mechanics, 2nd ed., Sec. 1.1 (`sakurai-napolitano`); original experiment: Gerlach and Stern, Z. Phys. 9 (1922) 349.

## Explainer

### What you are looking at

An oven on the left emits a beam of neutral atoms (each one carrying
some angular momentum $J$). The beam passes through a magnet whose
poles are shaped so that the field strength varies along $z$: $B_z(z)
= B_0 + (\mathrm{d}B/\mathrm{d}z)\, z$. A magnetic moment $\vec\mu$
in such a gradient feels a force $F_z = \mu_z (\mathrm{d}B/\mathrm{d}z)$
that pushes it up or down depending on the sign of $\mu_z$. After
the magnet the atoms drift to a screen. What gets painted there is
the Stern-Gerlach prediction.

### Classical vs quantum prediction

Classically, $\mu_z = |\vec\mu| \cos\theta$ can take any value in
$[-|\vec\mu|, +|\vec\mu|]$, so the screen should show a continuous
band of width $\propto |\vec\mu| \mathrm{d}B/\mathrm{d}z$ smeared
over all directions of the atomic spin. Quantum mechanically,

$$\mu_z \;=\; -g\, \mu_B\, m_J, \qquad m_J \in \{-J, -J+1, \dots, +J\},$$

and only $2J+1$ values of $\mu_z$ are allowed. The deflection on
the screen is therefore $2J+1$ discrete spots equally spaced in $z$.
For silver atoms (one unpaired 5s electron) you see exactly two
spots: $m_J = \pm 1/2$.

### Why the gradient matters, not the field

A uniform $\vec B$ would torque the magnetic moment (precession) but
not translate it. The force on a magnetic dipole is

$$\vec F \;=\; \nabla(\vec\mu \cdot \vec B),$$

so only the *spatial variation* of $\vec B$ produces deflection. In
the Stern-Gerlach geometry $\mathrm{d}B_z/\mathrm{d}z$ is the only
non-negligible component; the divergence-free condition
$\nabla \cdot \vec B = 0$ requires a compensating $B_x$ gradient, but
the time average over Larmor precession picks out only the $z$
component (Sakurai 1.1).

### The deflection formula

For an atom of mass $m$ moving at speed $v$ through a magnet of
length $L$ followed by a gap $L_{\rm gap}$ to the screen, the
transverse displacement is

$$\Delta z \;=\; \frac{\mu_z (\mathrm{d}B/\mathrm{d}z)}{m v^2}\,
   \Big(\tfrac{1}{2} L^2 + L\, L_{\rm gap}\Big).$$

So the spot spacing scales linearly with $m_J$ and with $\mathrm{d}B/\mathrm{d}z$;
quadratically with $L$; and inversely with $v^2$.

### Symbols

- $J$: total angular-momentum quantum number.
- $m_J$: projection on the field axis, in $\{-J, ..., +J\}$, $2J+1$ values.
- $\mu_z = -g \mu_B m_J$: magnetic moment along $z$.
- $\mu_B = e\hbar / (2 m_e)$: Bohr magneton.
- $g$: Lande g-factor (taken as 2 for spin-1/2 electron).
- $\mathrm{d}B_z/\mathrm{d}z$: field gradient along the apparatus.
- $L$, $L_{\rm gap}$: magnet length and magnet-to-screen distance.

### Things to try

- Set $J = 1/2$: two spots, equally bright. This is the iconic
  silver-atom result.
- Set $J = 1$: three spots. The $m_J = 0$ atoms pass through
  undeflected.
- Switch off the quantization (classical mode): see the same beam
  spread into a continuous band, with no spots; this is what physics
  predicted before 1922.
- Crank $\mathrm{d}B/\mathrm{d}z$: spots move further apart linearly.

### Where this comes from

Sakurai and Napolitano, *Modern Quantum Mechanics*, 2nd ed., CUP
2017, Section 1.1 derives the deflection formula and the classical
vs quantum predictions in full. The original experiment is Gerlach
and Stern, *Z. Phys.* 9 (1922) 349 (`gerlach-stern-1922`); see also
Friedrich and Herschbach, *Phys. Today* 56 (2003) 12 for the
historical context.
