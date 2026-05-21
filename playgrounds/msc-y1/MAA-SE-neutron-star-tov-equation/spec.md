---
title: "Neutron Stars: the TOV Equation and the Mass-Radius Diagram"
slug: neutron-star-tov-equation
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MAA-SE
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: oppenheimer-volkoff1939
hook: 'The Tolman-Oppenheimer-Volkoff equation integrated for four equations of state: an ideal free-neutron Fermi gas (the 0.71 solar-mass Oppenheimer-Volkoff limit), a stiff and a soft polytrope, and MIT-bag quark matter, traced into the mass-radius diagram with the two-solar-mass pulsar line.'
one_paragraph: 'A neutron-star structure playground built on the relativistic hydrostatic-equilibrium (TOV) equation (Tolman 1939; Oppenheimer and Volkoff 1939; Shapiro and Teukolsky Ch. 5). The TOV system is integrated by RK4 from the centre to the surface for four equations of state: an ideal degenerate free-neutron Fermi gas (which reproduces the historic Oppenheimer-Volkoff maximum mass of 0.71 M_sun at about 9 km), a stiff and a soft polytrope anchored at nuclear density, and self-bound MIT-bag quark matter. Sweeping the central density traces the mass-radius diagram, whose turning point is the maximum mass; only equations of state whose maximum exceeds the observed two-solar-mass pulsars (J0740, J0348) survive. Panel A is the mass-radius diagram for all four equations of state with the 2 M_sun line; Panel B is the selected star interior (pressure, energy density, enclosed mass) with a density-shaded cross-section; Panel C is the equation of state itself on a log-log pressure-density plane. The free-neutron equation of state reproduces the Oppenheimer-Volkoff maximum of 0.71 M_sun, stiffer equations of state reach higher masses, and the mass-radius turning point marks the onset of instability. Reference: Shapiro and Teukolsky, Black Holes, White Dwarfs and Neutron Stars, Chapter 5; Oppenheimer and Volkoff 1939.'
tags: [neutron-star, tov, equation-of-state, mass-radius, live-readout]
difficulty: 5
tier: standard
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: [eos, rho]
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

# Neutron Stars: the TOV Equation and the Mass-Radius Diagram

## Explainer

### What you are looking at

A neutron star packs more than the Sun's mass into a 12 km ball. At
that density Newtonian gravity is wrong; you need general relativity,
and the structure equation is the TOV equation. Its solutions form a
mass-radius curve with a maximum mass: push past it and the star
collapses to a black hole. The playground integrates the TOV equation
for different nuclear equations of state and traces that curve.

### The TOV equation

Newtonian hydrostatic equilibrium is $dP/dr=-G m\rho/r^2$. General
relativity adds three correction factors (pressure also gravitates,
spacetime is curved):

$$\frac{dP}{dr}
  = -\,\frac{G\,(\epsilon + P/c^2)\,
  \big(m + 4\pi r^3 P/c^2\big)}
  {r^2\,\big(1 - 2Gm/rc^2\big)},
  \qquad
  \frac{dm}{dr} = 4\pi r^2 \frac{\epsilon}{c^2}.$$

Every extra factor strengthens gravity relative to the Newtonian
case, which is why a relativistic star has a hard upper mass limit
that no Newtonian polytrope has.

### The equation of state and the maximum mass

The TOV system is not closed until you specify how pressure depends
on density, the equation of state $P(\epsilon)$, which encodes the
unknown physics of matter above nuclear density. The playground
offers several: an ideal degenerate neutron gas, stiff and soft
nuclear polytropes, and self-bound quark matter. For each, sweeping
the central density $\rho_c$ traces a one-parameter family of stars.
The mass-radius locus rises, turns over at a maximum mass
$M_\mathrm{max}$, and the branch beyond ($dM/d\rho_c<0$) is unstable
to collapse. A stiffer equation of state resists compression and
gives a larger $M_\mathrm{max}$ and radius. Measuring real neutron-
star masses and radii therefore directly constrains the dense-matter
equation of state, the central goal of NICER and gravitational-wave
observations. The playground shows the profile and where the star
sits on the M-R curve.

### Things to try

- Sweep the central density and watch the M-R point climb to the
  maximum mass then turn back (the unstable branch).
- Switch equations of state and watch a stiffer one push
  $M_\mathrm{max}$ and the radius up.
- Compare the GR maximum mass to a Newtonian polytrope, which has
  none: relativity is what creates the limit.

### Where this comes from

The TOV equation, the role of the equation of state, and the maximum
mass follow Oppenheimer and Volkoff, Phys. Rev. 55, 374 (1939), and
Shapiro and Teukolsky, *Black Holes, White Dwarfs, and Neutron
Stars*, Chapter 5.

## Physical setup

A cold, static, spherically symmetric star in general relativity. Hydrostatic equilibrium is the Tolman-Oppenheimer-Volkoff equation; closing it needs an equation of state P(epsilon). Four are offered: an ideal degenerate free-neutron Fermi gas (the Oppenheimer-Volkoff 1939 model), a stiff and a soft polytrope anchored at nuclear saturation density, and self-bound MIT-bag quark matter. Sweeping the central density gives a one-parameter family whose mass-radius locus turns over at the maximum mass; stars beyond it are unstable. SI units; radius in metres, mass in kilograms, reported in km and M_sun.

## Governing equations

TOV (Tolman 1939; Oppenheimer and Volkoff 1939), in SI:

  dm/dr = 4 pi r^2 rho,   rho = epsilon / c^2,
  dP/dr = -(G/r^2)(rho + P/c^2)(m + 4 pi r^3 P/c^2) / (1 - 2 G m / (c^2 r)).

Free neutron Fermi gas (Shapiro and Teukolsky Eqs. 2.3.22-23), x = k_F / m_n c:

  eps = (eps0/8)[ x sqrt(1+x^2)(2x^2+1) - asinh x ],
  P   = (eps0/24)[ x sqrt(1+x^2)(2x^2-3) + 3 asinh x ],   eps0 = m_n^4 c^5 / (pi^2 hbar^3),

with P ~ rho^{5/3} non-relativistically and rho^{4/3} ultra-relativistically. Polytropes P = P0 (rho/rho0)^Gamma with epsilon = rho c^2 + P/(Gamma-1); MIT bag epsilon = 3P + 4B (self-bound). Integration runs to P -> 0; M = m(R).

## Numerical method

RK4 with a fixed radial step (20-30 m), starting from a small-radius seed with the central pressure from rho_c through the chosen equation of state, terminating when P falls to 1e-8 of central. The Fermi-gas pressure is inverted for x by bisection inside the integrator. The mass-radius sequence is a log sweep of the central density; the maximum mass is the curve maximum. Deterministic; seed not applicable.

## Controls

- `eos`: equation of state, free Fermi gas / stiff polytrope / soft polytrope / MIT-bag quark.
- `rho`: log central rest-mass density, 1e17 to 1.6e19 kg/m^3. Selects the star along its mass-radius curve.
- Reset, Pause/Play. Pause freezes the marker pulse; the structure is static.

## Expected qualitative features

- The mass-radius diagram with all four curves and the 2 M_sun line; stiff above it, soft and Fermi gas below.
- The free Fermi gas peaking at 0.71 M_sun near 9 km (the Oppenheimer-Volkoff limit).
- Pressure and energy density falling from the centre, the enclosed mass rising to M; quark matter with a sharp self-bound surface.
- The equation-of-state panel: a steeper P(rho) means a stiffer star and a higher maximum mass.

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline):

1. Free Fermi gas maximum mass = 0.71 M_sun within 5 percent at R ~ 9-10 km (Oppenheimer-Volkoff).
2. Soft maximum mass < stiff maximum mass; stiff > 2 M_sun, soft < 2 M_sun.
3. As rho_c -> 0, M -> 0 (rising branch, M tiny near zero, positive).
4. The TOV star is finite and sub-Schwarzschild (0 < 2GM/Rc^2 < 1).
5. Fermi-gas EOS slopes -> 5/3 (non-relativistic) and 4/3 (ultra-relativistic).
6. MIT-bag EOS is exactly epsilon = 3P + 4B (self-bound, dEps/dP = 3).
7. The mass-radius sequence has an interior maximum (the stability turning point).
8. Determinism.

Visual gate: SSIM > 0.92 against committed golden frames at 60 fps.

## Limiting cases for verification

- rho_c -> 0: M -> 0, R large (the non-relativistic, low-mass limit).
- Free Fermi gas: the historic 0.71 M_sun Oppenheimer-Volkoff maximum.
- Stiffer EOS (steeper P(rho)) -> larger maximum mass.
- MIT bag: P = 0 at finite density (epsilon = 4B), the self-bound quark-star surface.

## Visual fallback

The mass-radius diagram and the equation-of-state panel are static and carry the physics; the marker pulse is decoration.

## Citations

- Tolman, R. C., Static Solutions of Einstein's Field Equations for Spheres of Fluid, Phys. Rev. 55, 364 (1939).
- Oppenheimer, J. R. and Volkoff, G. M., On Massive Neutron Cores, Phys. Rev. 55, 374 (1939).
- Shapiro and Teukolsky, Black Holes, White Dwarfs and Neutron Stars, Ch. 5.

## Stretch goals

- Add a realistic tabulated EOS (APR, SLy) and the tidal deformability.
- Overlay the causality and rotation limits on the mass-radius plane.

## Risk register

- The polytrope constants are anchored at nuclear saturation to give a soft model below and a stiff model above the 2 M_sun line; they are illustrative of stiffness, not a specific microphysical EOS. The free Fermi gas is parameter-free and reproduces 0.71 M_sun, which is the load-bearing physical check.
