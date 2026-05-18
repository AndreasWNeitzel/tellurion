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

Two literature-standard multi-component galaxies (each a dominant Hernquist dark-matter halo, about 82% of the galaxy mass, plus a stellar component, about 18%; ~16000 PM particles total, split by the mass sliders) fall together as one true self-gravitating system. The primary is a rotation-supported two-arm spiral disk; the infalling secondary is a diffuse, dispersion-supported dwarf (a centrally-concentrated blob on isotropic random orbits, no rotation, no arms), which is the realistic Gaia-Enceladus / Sausage progenitor. Gravity is solved self-consistently with the shared particle-mesh engine using ISOLATED (vacuum) boundaries (zero-padded Green's-function convolution, fast radix-2 FFT): no periodic box, no analytic cores, no special-case forces. The dark halo binds the disk (so it is tidally heated, not trivially stripped) and is the mass against which dynamical friction sinks the companion, so the in-fall, tidal tails, friction-driven inspiral, disk heating and coalescence all emerge from the particle dynamics. The view is locked to the global mass-weighted centre of mass every frame (and zoomed to keep the extended halo in shot). A second panel plots the STELLAR particles (with a valid PM potential) in the energy vs angular-momentum plane in the COM frame, where the disrupted lighter galaxy forms the Gaia-Enceladus / Sausage clump.

## Explainer

### What you are looking at

Two galaxies fall together, tidally shred, and settle into a single
relaxed remnant with stripped debris. The left panel is the encounter
in space; the right panel is the same particles in the energy vs
angular-momentum plane, the diagram galactic archaeologists actually
use, where the disrupted galaxy leaves the Gaia-Enceladus / "Sausage"
fingerprint. Sliders set the two galaxy masses, the impact parameter
and the closing speed.

### A true self-gravitating particle mesh

Each galaxy is a dense rotating exponential disk (surface density
$\Sigma\propto e^{-R/R_d}$, the Freeman 1970 law) of equal-mass
particles. Crucially there are no point-mass cores and no prescribed
potential: gravity is computed from the particles themselves with a
particle-mesh (PM) solver. Each step deposits the particle masses on
a grid (cloud-in-cell), then solves the Poisson equation
$\nabla^2\Phi = 4\pi G\,\rho$ with ISOLATED (free-space) boundaries.
In 2D the Green's function of the Laplacian is
$\tfrac{1}{2\pi}\ln r$, so the potential is the convolution

$$\Phi(\mathbf r) = 2G\!\int \ln|\mathbf r-\mathbf r'|\;
  \rho(\mathbf r')\,d^2r',$$

evaluated by the zero-padded FFT trick (the density is embedded in a
doubled grid and convolved with the discretized Green's function).
There is no periodic box, so no spurious image forces and no wrapping
of particles. The force $-\nabla\Phi$ is interpolated back to each
particle, which is advanced by a kick-drift-kick leapfrog (Hockney
and Eastwood 1988). Because the field is built from the actual
particle distribution and fed back to them, the self-gravity is
fully self-consistent.

### Why coalescence is now automatic

Nothing special is added to make the galaxies merge. Dynamical
friction arises by itself: as the lighter galaxy plows through the
primary it raises a trailing density wake (visible in the particle
field) whose pull decelerates it, draining orbital energy. The
satellite sinks, is tidally stripped into tails and streams, and the
debris violently relaxes around the survivor. There is no two-body
core integration, no Chandrasekhar drag term, no merge teleport and
no damping: the previous artifacts (kiss-and-freeze, the discrete
energy jump at coalescence) are gone because the dynamics is one
continuous self-consistent system from start to finish.

### The integrals-of-motion panel and the Sausage

For each particle the playground computes, in the rest frame of the
primary galaxy's mass-weighted density centroid, the specific angular
momentum and the real (PM-potential) orbital energy

$$L_z = x\,v_y - y\,v_x,
  \qquad
  E = \tfrac12 v^2 + \Phi_\mathrm{PM}(\mathbf x),$$

with positions and velocities relative to that centroid. The centroid
is a continuous function of the particle positions, so the reference
frame never jumps. This is the Galactocentric analogue: the real
Gaia-Enceladus / Sausage integrals are measured relative to the
surviving Milky Way, not the system barycentre. While the galaxies
interact the potential is time-dependent and the points churn (violent
relaxation); as the remnant relaxes the potential becomes nearly
stationary and $E, L_z$ become near-conserved labels, so the accreted
debris stays clustered in a distinct low-$|L_z|$, radial locus, the
Gaia-Enceladus / Sausage signature found in the Milky Way halo (Helmi
et al. 2018; Belokurov et al. 2018). Change the mass ratio and watch
the accreted clump's position and prominence shift.

### Things to try

- Watch the lighter galaxy raise a trailing wake, sink, and tidally
  shred into streams while the primary survives.
- Read the right panel: the accreted (gold) debris forms a distinct
  low-$L_z$ locus separate from the primary's rotation sequence.
- Set $M_1=M_2$ for a major merger (both disrupted), or a large ratio
  for a minor one (clean Sausage), and watch the structure change.

### Where this comes from

The particle-mesh method follows Hockney and Eastwood, *Computer
Simulation Using Particles* (1988), Chapters 5 to 7; emergent
dynamical friction and tidal disruption follow Binney and Tremaine,
*Galactic Dynamics* 2e, Chapter 8; the integrals-of-motion Sausage
diagnostic follows Helmi et al., Nature 563, 85 (2018), and Belokurov
et al., MNRAS 478, 611 (2018).

## Physical setup

Two multi-component galaxies, each a Hernquist (1990) dark-matter halo (about 82% of the galaxy mass, the dominant component that binds the disk and carries dynamical friction) plus a two-arm exponential spiral stellar disk (about 18%), about 16000 PM particles total split by the M1, M2 sliders. Self-gravity is solved with the shared 2D particle-mesh engine (`shared/js/engine/particle-mesh-2d.js`): cloud-in-cell deposit on a 64 x 64 grid, ISOLATED Poisson solve (zero-padded Green's-function convolution on the doubled grid, radix-2 FFT), CIC force interpolation, kick-drift-kick leapfrog, no periodic wrap. At t=0 disk particles get the local circular speed and halo particles an isotropic dispersion from the 2D Jeans estimate against the actual self-consistent PM force, so each galaxy starts in approximate equilibrium. No analytic cores, no Chandrasekhar term, no merge event: friction-driven inspiral, disk heating and coalescence are all emergent. The view follows the global mass-weighted COM each frame. References: Hernquist 1990 (halo), Springel/GADGET and Yurin & Springel 2014 (compound-galaxy ICs), Binney & Tremaine Ch. 8.

## Controls

- M1 (primary mass), M2 (accreted mass), impact parameter, closing speed.
- Relaunch (re-seed the encounter), Pause/Play.

## Invariants

`invariants.test.mjs` plus the shared engine tests in `tests/engines/particle-mesh-2d.test.mjs`:

- The periodic PM Poisson solve recovers a single Fourier mode to 1e-9.
- The leapfrog conserves total momentum to < 1e-6 over 200 steps.
- A cold blob self-gravitates inward (RMS radius shrinks).
- Determinism: identical inputs reproduce the state bit-for-bit.

Visual gate: SSIM > 0.92 against the five committed golden frames.

## Citations

- Hockney and Eastwood, *Computer Simulation Using Particles* (1988), Chs. 5 to 7: the particle-mesh method (`hockney-eastwood1988`).
- Binney and Tremaine, *Galactic Dynamics*, 2nd ed., Ch. 8: dynamical friction and tidal disruption (`binney-tremaine`).
- Helmi et al., Nature 563, 85 (2018); Belokurov et al., MNRAS 478, 611 (2018): the Gaia-Enceladus / Sausage integrals-of-motion signature.
