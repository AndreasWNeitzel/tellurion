---
title: "Galaxy Merger N-Body"
slug: galaxy-merger-nbody
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: MAA-GD
supporting_ucs: []
curriculum_year: msc-y1
hook: 'Two Hernquist galaxies collide; tracer particles feel both halo potentials and develop tidal tails, captured stars, and a final mixed-color elliptical remnant.'
one_paragraph: 'Each tracer feels analytic Hernquist potentials of BOTH halos while halo centers integrate as a softened 2-body. Plummer softening keeps the pair force finite during close encounters.'
tags: [galactic, interactive-drag, animation, live-readout]
difficulty: 4
tier: large
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: []
---

# Galaxy Merger N-Body

Two coherently-rotating exponential spiral disks (7000 tracer particles each, color-coded by initial galaxy) of user-set masses M1, M2 approach at chosen impact parameter and relative velocity. Each tracer feels the live combined Hernquist potential of both halos; the nuclei integrate as an unequal-mass Newtonian two-body with exact Chandrasekhar dynamical friction, so the orbit decays and the cores coalesce into one phase-mixed remnant. A second panel plots every star in the centre-of-mass energy vs angular-momentum plane, color-coded by origin, where the disrupted lighter galaxy forms the Gaia-Enceladus / Sausage clump.

## Explainer

### What you are looking at

Two spiral galaxies fall together, shred each other into tidal tails,
and coalesce into a single relaxed remnant. The left panel is the
encounter in space; the right panel is the same stars in the
energy vs angular-momentum plane, the diagram galactic archaeologists
actually use, where the disrupted galaxy leaves the Gaia-Enceladus /
"Sausage" fingerprint. Two sliders set the galaxy masses.

### The galaxies and their potential

Each galaxy is a rotating exponential stellar disk (surface density
$\Sigma\propto e^{-R/R_d}$, the Freeman 1970 law) of 7000 tracer
stars, embedded in an analytic Hernquist halo of mass $M$:

$$\Phi(r) = -\frac{G M}{r + a},
  \qquad
  \rho(r) = \frac{M\,a}{2\pi\,r\,(r+a)^3}.$$

The two nuclei integrate as a Newtonian two-body of unequal masses
$M_1, M_2$ (set by the sliders); each star feels the live combined
potential $\Phi_1 + \Phi_2$ of both halos. This restricted scheme
makes 14000 stars cheap to integrate while keeping the tidal
dynamics exact.

### Why they actually coalesce: dynamical friction

A clean two-body orbit never decays, so on its own the pair would
just fly past. Real galaxies merge because each massive halo plows
through the other's matter and drags on its own gravitational wake.
This is Chandrasekhar dynamical friction, included here exactly (no
fudge factor):

$$\frac{d\mathbf v}{dt}\Big|_{\rm DF}
  = -\,\frac{4\pi G^2 M\,\rho\,\ln\Lambda}{v^3}
  \Big[\mathrm{erf}(X) - \tfrac{2X}{\sqrt\pi}e^{-X^2}\Big]\,\mathbf v,
  \quad X=\frac{v}{\sqrt2\,\sigma}.$$

It drains orbital energy, so the lighter satellite spirals in (the
heavier primary barely moves), and once the nuclei are within a scale
length they coalesce into a single nucleus at the mass-weighted
centre of mass. The stars then violently relax into one phase-mixed
remnant.

### The integrals-of-motion panel and the Sausage

For each star the playground computes, in the centre-of-mass frame,
the specific angular momentum and orbital energy

$$L_z = x\,v_y - y\,v_x,
  \qquad
  E = \tfrac12 v^2 + \Phi_1 + \Phi_2,$$

and plots $E$ against $L_z$, colour-coded by galaxy of origin. These
are near-conserved labels (adiabatic invariants), so debris from the
disrupted galaxy stays clustered there long after it is spatially
mixed. A lower-mass accreted galaxy on a radial orbit lands as a
distinct blob at low $|L_z|$ and intermediate $E$: exactly the
signature of the Gaia-Enceladus / Sausage merger found in the Milky
Way halo (Helmi et al. 2018; Belokurov et al. 2018). Change the mass
ratio and watch the accreted clump's position and prominence shift.

### Things to try

- Watch the two disks spiral in (dynamical friction) and coalesce
  into one relaxed remnant, not a flyby.
- Read the right panel: the accreted (gold) galaxy forms a distinct
  low-$L_z$ clump, the Sausage analogue, separate from the primary.
- Set $M_1=M_2$ for a major merger, or a large ratio for a minor one,
  and watch the integrals-of-motion structure change.

### Where this comes from

The restricted N-body merger model, tidal tails, and elliptical
remnant follow Toomre and Toomre, ApJ 178, 623 (1972), and Binney
and Tremaine, *Galactic Dynamics*, 2nd ed., Chapters 2 and 8.

## Physical setup

Hernquist (1990) density and DF, sampled analytically so the tracers start in equilibrium. Gravity on each tracer: $\mathbf{a} = -\nabla(\Phi_1 + \Phi_2)$ from both halo centers. Halo centers: leapfrog with softening. Units: $M_\odot$, kpc, km/s.

## Controls

- Impact-parameter slider, relative-velocity slider, Launch button
- Preset encounters: direct hit, grazing pass, retrograde, minor merger (3:1)
- Zoom + pan

## Invariants

- Total halo-center energy conserved within 0.1% per 1000 steps.
- Isolated galaxy retains velocity dispersion profile within 5% after 500 steps.
- Head-on merger: > 90% of stars from each galaxy remain bound.

## Status note

Scaffolded with Hernquist DF spec; analytic DF sampler + leapfrog + remnant-classification readout not yet implemented.

## Citations

Hernquist 1990, ApJ 356, 359 (`hernquist1990`).
