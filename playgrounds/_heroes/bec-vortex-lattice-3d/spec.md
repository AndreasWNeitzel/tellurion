---
title: BEC Vortex Lattice in a Rotating Trap
slug: bec-vortex-lattice-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: FIS3017
supporting_ucs: [FIS3019]
curriculum_year: hero
primary_citation: pitaevskii-stringari-bec
primary_chapter: 11
hero_candidate: true
hook: 'Spin the trap and a triangular lattice of quantized vortices appears in the condensate. Each black hole at the center carries exactly one quantum of circulation; their number density n_v = m*Omega / (pi hbar) is set by Feynman alone.'
one_paragraph: 'A 2D Bose-Einstein condensate in a harmonic trap takes a Thomas-Fermi inverted-parabola density profile of radius R_TF = (15 N a_s / a_ho)^(1/5) a_ho. When the trap is rotated at angular frequency Omega < omega_trap, the condensate cannot acquire angular momentum continuously (the wave function must remain single-valued), so it forms a regular Abrikosov triangular lattice of singly-quantized vortices with area density n_v = m*Omega/(pi*hbar) (Feynman 1955). The playground draws the local density |psi|^2 (cyan-magenta), the phase (hue overlay), and the resulting vortex cores as black dots whose count obeys n_v * pi R_TF^2. As Omega is increased, the lattice grows from a single central vortex through 7, 19, 37, ... at the magic shell-filling counts. Reference: Pitaevskii and Stringari, Bose-Einstein Condensation and Superfluidity, Ch. 11.'
caption: 'Figure 1. Thomas-Fermi condensate density (cyan-magenta) with an Abrikosov triangular vortex lattice. Phase winding around each vortex is encoded as a hue ring. As the rotation rate Omega/omega_trap increases the vortex count grows as Omega R_TF^2. Method: kinematic Gross-Pitaevskii ansatz with vortex cores of size xi (the healing length). Source: Pitaevskii and Stringari, Bose-Einstein Condensation and Superfluidity, Ch. 11.'
tags: [quantum, condensed-matter, animation, live-readout]
difficulty: 4
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [omega, Na]
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

# BEC vortex lattice in a rotating trap
Quantized vortices in a rotating Bose-Einstein condensate. Source: Pitaevskii and Stringari, Bose-Einstein Condensation and Superfluidity, Ch. 11; Pethick and Smith, Bose-Einstein Condensation in Dilute Gases, 2nd ed., Ch. 9.

## Explainer

### What you are looking at

A two-dimensional Bose-Einstein condensate, of ~$10^5$ atoms confined
in a harmonic trap and rotated at angular frequency $\Omega$. The
bright cloud is the condensate density $n(\vec r) = |\psi|^2$, drawn
in a cyan-magenta colormap (low to high). Sprinkled across it are
black holes: each one is a quantized vortex where the wave function
vanishes and the phase winds by $2\pi$. The hue ring around each
vortex is the phase itself.

### Why vortices, and why a lattice

The condensate must support a single-valued wave function. To carry
angular momentum it cannot have a smooth differential rotation;
instead it threads itself with topological defects where the phase
gradient diverges and the density goes to zero. Each defect (vortex)
contributes one quantum of circulation,

$$\oint \vec v_s \cdot d\vec\ell \;=\; \frac{h}{m},$$

with $\vec v_s = (\hbar / m)\nabla \phi$ the superfluid velocity.
In a rotating trap, the energetically favorable configuration is many
singly-quantized vortices on an Abrikosov-style triangular lattice
(Tkachenko 1966), with area density

$$n_v \;=\; \frac{m \Omega}{\pi \hbar},$$

the celebrated Feynman result. In the playground that fixes the
number of cores you see at any rotation rate $\Omega$.

### Thomas-Fermi density profile

In the limit where the interaction term dominates the kinetic energy,
the condensate density profile is the inverted parabola

$$n_{\rm TF}(\vec r) \;=\; \frac{\mu - V(\vec r)}{g}, \qquad
  \mu \;=\; \frac{\hbar \omega_{\rm trap}}{2}
  \,\Big( 15 \, \frac{N a_s}{a_{\rm ho}} \Big)^{2/5},$$

where $V(\vec r) = (1/2) m \omega_{\rm trap}^2 r^2$ is the trap,
$g = 4\pi\hbar^2 a_s / m$ is the contact interaction, $N$ is the
atom number, and $a_{\rm ho} = \sqrt{\hbar / (m\omega_{\rm trap})}$
is the oscillator length. The Thomas-Fermi radius is

$$R_{\rm TF} \;=\; \sqrt{\frac{2\mu}{m \omega_{\rm trap}^2}}
              \;=\; (15 N a_s / a_{\rm ho})^{1/5}\, a_{\rm ho}.$$

The vortex core size is the healing length

$$\xi \;=\; \hbar / \sqrt{2 m \mu}.$$

In the playground we work in dimensionless units (lengths in
$a_{\rm ho}$, frequencies in $\omega_{\rm trap}$), so $\mu = (15 N
a_s / a_{\rm ho})^{2/5} / 2$ and $\xi = 1/\sqrt{2\mu}$.

### Things to try

- Crank $\Omega$ from 0 up to 0.9 and watch the vortex lattice fill
  shell by shell: 1 then 7 then 19 then 37, the "magic numbers".
- Increase the interaction $N a_s / a_{\rm ho}$ and see $R_{\rm TF}$
  swell (more atoms or stronger contact repulsion).
- Above $\Omega \sim 0.95\, \omega_{\rm trap}$, the centrifugal force
  matches the trap and the cloud expands without bound; the playground
  caps at $\Omega_{\rm max} = 0.95$.

### Symbols

- $\psi(\vec r)$: condensate wave function; $n = |\psi|^2$ density.
- $\Omega$: rotation rate of the trap.
- $\omega_{\rm trap}$: harmonic trap frequency (taken as unit).
- $a_{\rm ho}$: harmonic-oscillator length (unit of length).
- $a_s$: s-wave scattering length.
- $N$: atom number.
- $\mu$: chemical potential.
- $R_{\rm TF}$: Thomas-Fermi radius.
- $\xi$: healing length (vortex core size).
- $n_v$: vortex number density (Feynman).

### Where this comes from

The Thomas-Fermi derivation and Feynman vortex law are in Pitaevskii
and Stringari, *Bose-Einstein Condensation and Superfluidity*, OUP
2016, Sections 11.4 to 11.6. Vortex lattices in dilute gases are
reviewed in Cooper, *Adv. Phys.* 57 (2008) 539.
Pethick and Smith, *Bose-Einstein Condensation in Dilute Gases*, 2nd
ed. CUP 2008, Chapter 9 covers the same material at a slightly more
elementary level.
