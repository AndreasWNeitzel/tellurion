---
title: Kelvin-Helmholtz Instability
slug: kelvin-helmholtz-instability-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: FIS2014
supporting_ucs: [AST3014]
curriculum_year: hero
primary_citation: chandrasekhar-hydro
primary_chapter: 11
hero_candidate: true
hook: 'A velocity shear between two fluid layers rolls up into a row of cats-eye vortices. Stuart 1967 gave the exact closed-form pattern; the same instability sculpts cloud waves, Jupiters belts, and the boundaries of astrophysical jets.'
one_paragraph: 'A velocity shear at the interface between two fluid layers is linearly unstable: any small perturbation grows exponentially as exp(sigma t) with sigma = k U / 2 (for equal-density layers with opposite velocities +/- U). In the nonlinear stage, the interface rolls up into a row of coherent vortices spaced at wavelength lambda = 2 pi / k. Stuart (1967) showed that the mature pattern is captured exactly by the stream function psi = -ln(cosh y + A cos x), parameterised by A in [0, 1). The playground advects ~ 2000 tracer particles colored by their initial layer, slides A from 0 (plain shear) to ~ 0.7 (mature rolls), and reveals the iconic cats-eye geometry that appears in everything from atmospheric cloud waves to galaxy-scale jet boundaries. Reference: Chandrasekhar, Hydrodynamic and Hydromagnetic Stability, Ch. 11.'
caption: 'Figure 1. Kelvin-Helmholtz cats-eye vortices in a sheared layer, generated as the Stuart 1967 exact solution. Tracer particles colored by their initial half-plane reveal mixing through the interface. Method: closed-form Stuart streamfunction + RK4 tracer advection. Source: Chandrasekhar, Hydrodynamic and Hydromagnetic Stability, Ch. 11.'
tags: [fluid-dynamics, animation, three-d, live-readout]
difficulty: 4
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [stuart_A, shear_U]
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
  - "Chandrasekhar, Hydrodynamic and Hydromagnetic Stability, Ch. 11."
---

# Kelvin-Helmholtz instability
Stuart cats-eye, sigma = k U / 2. Source: Stuart, *J. Fluid Mech.* 29 (1967) 417; Chandrasekhar, *Hydrodynamic and Hydromagnetic Stability*, Oxford 1961, Ch. 11.

## Explainer

### What you are looking at

Two fluid layers slide past one another at the centerline; the
yellow band marks the upper layer, the cyan band the lower. The
boundary between them is unstable, and the playground integrates a
velocity field (Stuart 1967 exact solution to the 2D Euler
equations) that rolls the interface up into a row of vortices, the
classic Kelvin-Helmholtz "cats-eye" pattern. As the slider sweeps
the Stuart parameter $A$ from 0 to 0.7, the layers go from
unperturbed shear flow to fully developed rolls.

### The dispersion relation

For two incompressible layers of equal density moving with velocities
$\pm U/2$ across a flat interface, the linear-theory growth rate is

$$\sigma(k) \;=\; \frac{k U}{2}.$$

All wavelengths are linearly unstable; the shortest wavelengths grow
fastest. Surface tension or gravity (lighter on top) damp high $k$;
without them, the spectrum is ultraviolet-divergent in the linear
limit. In nonlinear evolution the dominant wavelength saturates
into discrete vortex billows.

### The Stuart streamfunction

Stuart (1967) showed that 2D Euler admits the exact stationary
solution

$$\psi(x, y) \;=\; -\ln\!\big(\cosh y \;+\; A \cos x\big),$$

with velocity $\vec u = (\partial_y \psi, -\partial_x \psi)$ and
vorticity $\omega = (1 - A^2) / D^2$ where $D = \cosh y + A \cos x$.
For $A = 0$ this reduces to a plain shear layer. For $A > 0$, the
solution is a row of vortices on the line $y = 0$, spaced one
wavelength apart; the velocity is shear at large $|y|$ and circular
near each vortex centre. As $A \to 1$ the vortices become more
concentrated and the inter-vortex separatrix sharpens.

### Symbols

- $\psi$: stream function; $\vec u = (\partial_y \psi, -\partial_x \psi)$.
- $\omega = \nabla \times \vec u$: vorticity.
- $A$: Stuart amplitude parameter, $[0, 1)$.
- $U$: shear-flow asymptotic speed; equivalently the vortex
  circulation scaling.
- $k = 1$: wavenumber in our normalized units; physical $\lambda = 2\pi/k$.
- $\sigma$: linear KH growth rate.

### Where you see this in nature

- Cloud bands above mountains (the "billow clouds" pattern).
- Jupiter's atmospheric belts and zonal-flow boundaries.
- The boundary of relativistic jets (M87 limb-brightened features).
- The Sun's coronal mass ejection sheaths.
- Galaxy-cluster gas sloshing fronts in X-ray observations.

### Things to try

- Move the Stuart $A$ slider from 0 to 0.7 and watch the cats-eye
  vortices appear.
- Set $A = 0$ and add a tiny perturbation: the linear-theory growth
  rate readout shows $\sigma = k U / 2$.
- Notice that tracers very near the centerline are sucked into the
  vortex cores while those far from it just translate; this is the
  classical Lagrangian picture of the instability.

### Where this comes from

Stuart, *J. Fluid Mech.* 29 (1967) 417 gave the
exact streamfunction. The general dispersion relation is in
Chandrasekhar, *Hydrodynamic and Hydromagnetic Stability*, Oxford
1961, Chapter 11. Modern treatment: Drazin
and Reid, *Hydrodynamic Stability*, 2nd ed., CUP 2004. The
astrophysical applications are reviewed in Schekochihin and Cowley,
*Phys. Plasmas* 13 (2006) 056501.
