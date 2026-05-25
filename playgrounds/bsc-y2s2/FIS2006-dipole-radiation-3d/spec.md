---
title: Dipole Radiation in 3D
slug: dipole-radiation-3d
status: verified
audience: portfolio
created: 2026-05-17
hook: 'The radiation donut: nothing along the axis, everything in the equator, and the power climbing as the fourth power of the frequency.'
one_paragraph: 'An oscillating dipole radiates with the angular pattern sin^2(theta), the toroidal donut shown here as a rotating projected surface with the pulsing source and outgoing wavefronts. The time-averaged power is the Larmor form P = mu0 p0^2 omega^4 / (12 pi c), scaling as omega^4, and in the far zone E, B and r-hat are mutually orthogonal with |E| = c|B|. Nothing is radiated along the dipole axis and the emission peaks broadside; the steep omega^4 dependence is why the sky is blue (Rayleigh scattering). Switch to a magnetic dipole (same pattern, swapped polarization) or a half-wave antenna (sharper lobes, higher directivity); the side panel shows the polar pattern with the radiated power and directivity. Reference: Griffiths, Introduction to Electrodynamics, Chapter 11; Jackson, Classical Electrodynamics, Chapter 9.'
tags: [electromagnetism, radiation, 3d, multi-panel, live-readout]
difficulty: 4
tier: hero
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-2Y-2S'
primary_uc: FIS2006
primary_citation: griffithsqm2018
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
  - "Griffiths, Introduction to Quantum Mechanics, Third ed."
---

# Dipole Radiation in 3D

## Explainer

### What you are looking at

An oscillating charge (a dipole antenna) does not radiate equally in
all directions. It throws no power straight along its axis and the most
broadside, giving a doughnut-shaped radiation pattern. This is why a
whip antenna is mounted vertically and why you rotate it for the best
signal.

### The angular pattern

For a Hertzian (short) dipole of moment $p_0$ oscillating at frequency
$\omega$, the time-averaged power per unit solid angle is

$$\frac{dP}{d\Omega} =
  \frac{\mu_0\,p_0^2\,\omega^4}{32\pi^2 c}\,\sin^2\theta,$$

with $\theta$ measured from the dipole axis. The $\sin^2\theta$ is the
whole shape: a null along the axis ($\theta = 0,\pi$), a maximum in the
equatorial plane, the toroidal pattern. The strong $\omega^4$ is why
the sky is blue (higher-frequency light scatters far more) and why
efficient antennas are not tiny.

### Total power and the fields

Integrate over all directions and you recover the Larmor total

$$P = \frac{\mu_0\,p_0^2\,\omega^4}{12\pi c}.$$

In the far zone the radiation is a clean transverse wave: $\mathbf E$
along $\hat\theta$, $\mathbf B$ along $\hat\phi$, $|\mathbf E| =
c|\mathbf B|$, and the Poynting flux falls as $1/r^2$ (energy
conserved through expanding spheres). A real half-wave antenna sharpens
the lobe slightly, pattern
$[\cos(\tfrac\pi2\cos\theta)/\sin\theta]^2$, raising the directivity
from $3/2$ (Hertzian) to about $1.64$.

### Things to try

- Rotate the dipole and watch the doughnut swing with it, always
  nulling along the axis.
- Switch to the half-wave antenna and see the lobe narrow (higher
  directivity).
- Note the $1/r^2$ falloff of the Poynting flux: total radiated power
  is the same through any sphere.

### Where this comes from

The dipole $\sin^2\theta$ pattern, the radiated-power formula, the
far-zone fields, and antenna directivity follow Griffiths,
*Introduction to Electrodynamics*, 5th ed., Chapter 11.

## Physical setup

An oscillating electric (or magnetic) dipole, or a centre-fed
half-wave antenna, at the origin with its axis vertical. The radiated
power flows outward through the far zone.

## Governing equations

Hertzian dipole angular pattern `sin^2(theta)`, zero on the axis,
maximum in the equatorial plane. Time-averaged power per solid angle

`dP/dOmega = (mu0 p0^2 omega^4 / 32 pi^2 c) sin^2 theta`,

integrating to the Larmor total `P = mu0 p0^2 omega^4 / (12 pi c)`.
Far zone: `E` along theta-hat, `B` along phi-hat, `|E| = c|B|`,
Poynting `S ~ 1/r^2`. Half-wave antenna pattern
`[cos((pi/2) cos theta)/sin theta]^2`. Directivity `D = 4 pi
max(pattern)/integral`: `3/2` for the dipole, `~1.64` for the antenna.

## Numerical method

Closed-form patterns and Larmor power; the radiation surface is a
revolved `pattern(theta)` mesh, painter-sorted and projected with a
rotating orthographic camera; the polar panel plots the same pattern.
Reference: Jackson, *Classical Electrodynamics* (3rd ed.), Ch. 9.

## Controls

- source: electric dipole, magnetic dipole, half-wave antenna.
- frequency (MHz): sets omega (power ~ omega^4) and the wavefront
  spacing (lambda = c/f).
- moment p0/m0: the dipole strength (charge excursion and intensity
  ~ p0^2).
- Reset, Pause.

## Expected qualitative features

- The donut has a sharp null along the axis and a maximum in the
  equatorial plane; it rotates so the 3D shape is clear.
- Electric and magnetic dipoles share the pattern but the E-field
  polarization is meridional vs azimuthal (shown as the surface
  texture).
- The half-wave antenna lobes are narrower (higher directivity).
- Higher frequency packs more wavefronts; larger moment widens the
  charge oscillation and brightens the lobes.

## Invariants and acceptance thresholds

- `sin^2` pattern: nulls at `theta = 0, pi`, maximum at `pi/2`,
  fore-aft symmetric.
- Larmor total equals the angular integral within 0.2%.
- `P ~ omega^4` and `~ p0^2` exactly.
- Poynting flux equal through any sphere within 0.2% (1/r^2).
- Far-zone `E, B, r-hat` mutually orthogonal, unit, `|E| = c|B|`.
- Directivity `3/2` for the dipole, `> 3/2` and `~1.64` for the
  half-wave antenna.

## Limiting cases for verification

- `theta -> 0, pi`: the radiated intensity vanishes.
- Ideal dipole vs antenna: the antenna is strictly more directional.

Source: Jackson, *Classical Electrodynamics* (3rd ed.), Ch. 9.
